-- ============================================================
-- 계정 연결 마이그레이션
-- 선생님이 포털 계정(학부모/학생/성인학습자)을 students 레코드와
-- 연결(profiles.linked_student_id)할 수 있도록 RLS 정책을 추가한다.
--
-- 기존 정책은 "본인 프로필만 SELECT/UPDATE" 였기 때문에
-- 선생님이 다른 사용자의 프로필을 조회·수정할 수 없었다.
-- 아래 정책은 기존 정책과 OR(permissive)로 합쳐진다.
-- Supabase SQL Editor에서 1회 실행하면 된다.
-- ============================================================

-- 재귀 방지용 헬퍼: SECURITY DEFINER로 RLS를 우회해 현재 사용자가 선생님인지 확인.
-- (profiles 정책 안에서 profiles를 그냥 조회하면 무한 재귀가 발생하므로 함수로 분리)
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

-- 선생님은 모든 포털 프로필을 조회할 수 있다 (연결 후보 목록 표시용)
drop policy if exists "teachers can view portal profiles" on public.profiles;
create policy "teachers can view portal profiles" on public.profiles
  for select using (public.is_teacher());

-- 선생님은 포털 프로필을 수정할 수 있다 (linked_student_id 연결/해제용)
drop policy if exists "teachers can link portal profiles" on public.profiles;
create policy "teachers can link portal profiles" on public.profiles
  for update using (public.is_teacher()) with check (public.is_teacher());
