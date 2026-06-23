-- ============================================================
-- 🚨 긴급 수정: profiles RLS 무한 재귀로 인한 로그인/역할선택 500 오류
--
-- 증상: 로그인 후 모든 계정이 "역할 선택"으로 빠지고, 역할 선택 시
--       "오류가 발생했습니다"가 뜸.
-- 원인: GET /rest/v1/profiles?select=* 가 500.
--       profiles 테이블의 RLS 정책 중 하나가 (직접 또는 students 경유로)
--       profiles 를 다시 평가해 무한 재귀(Postgres 42P17)가 발생.
--       정책 하나만 재귀해도 profiles 의 모든 SELECT 가 500이 되어
--       본인 프로필조차 못 읽음 → 앱이 "프로필 없음"으로 보고 역할선택으로 보냄.
--
-- 해결: profiles 의 기존 정책을 전부 비우고, 재귀가 불가능한
--       안전한 정책 세트로 재생성한다.
--       (선생님 권한 판별은 SECURITY DEFINER 함수 is_teacher() 로 처리해
--        RLS 를 우회하므로 재귀가 생기지 않음)
--
-- 적용: Supabase Dashboard > SQL Editor 에 통째로 붙여넣고 Run.
--       이 수정은 여권/스탬프 작업과는 완전히 별개이며, 먼저 실행하면 로그인이 복구됨.
-- ============================================================

-- 0) SECURITY DEFINER 헬퍼 (RLS 우회 → 재귀 차단)
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

alter table public.profiles enable row level security;

-- 1) profiles 의 기존 정책을 "전부" 동적으로 제거 (이름 모르는 잔존 정책까지 깨끗이)
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

-- 2) 재귀가 불가능한 안전한 정책으로 재생성
--    (a) 본인 프로필: 읽기/생성/수정
create policy "users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

--    (b) 선생님: 모든 포털 프로필 읽기 (연결 후보 목록 + 알림 발송용)
--        is_teacher() 는 SECURITY DEFINER 라 profiles 를 재귀 평가하지 않음.
create policy "teachers can view portal profiles" on public.profiles
  for select using (public.is_teacher());

--    (c) 선생님: 포털 프로필 수정 (linked_student_id 연결/해제용)
create policy "teachers can link portal profiles" on public.profiles
  for update using (public.is_teacher()) with check (public.is_teacher());

-- 참고: 기존 "teacher can view linked profiles"(profiles→students 참조) 정책은
--       위 (b) "teachers can view portal profiles" 가 상위 호환으로 대체하므로
--       다시 만들지 않는다. 푸시 알림의 "선생님이 연결된 학부모/학생 프로필 읽기"는
--       (b) 로 그대로 동작한다.

-- 3) 확인용: 적용 후 아래로 현재 정책 목록을 점검할 수 있음
-- select policyname, cmd, qual from pg_policies
--   where schemaname='public' and tablename='profiles' order by policyname;
