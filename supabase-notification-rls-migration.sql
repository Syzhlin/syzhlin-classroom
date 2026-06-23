-- ============================================================
-- 알림 보내기(선생님 → 학부모/학생 푸시) 용 RLS 정책 추가
--
-- 배경:
--  - 서버는 anon 키 + 로그인 쿠키만 사용한다(서비스 롤 키 없음).
--  - /api/notifications/send 가 휴대폰 푸시를 보내려면, 선생님 세션으로
--    "내 학생에 연결된 학부모/학생"의 profiles 와 push_subscriptions 를 읽어야 한다.
--  - 현재 정책은 profiles 는 본인 것만, push_subscriptions 도 본인 것만 읽게 되어 있어
--    선생님이 학부모/학생 구독을 못 읽는다 → 아래 SELECT 정책 2개를 추가한다.
--
-- 안전성:
--  - 추가 정책은 모두 SELECT(읽기) 전용이며, "선생님이 가르치는 학생에 연결된" 행으로만 제한된다.
--  - 기존 정책과 OR(permissive)로 합쳐지므로 본인 데이터 접근에는 영향 없음.
--
-- 적용: Supabase Dashboard > SQL Editor 에 통째로 붙여넣고 Run.
--  (이 SQL을 적용하지 않아도 앱 내 알림 벨은 동작하며, 휴대폰 푸시만 0건이 된다.)
-- ============================================================

-- 1) 선생님이 자기 학생에 연결된 포털 사용자(학부모/학생) 프로필을 읽을 수 있게
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can view linked profiles" ON profiles;
CREATE POLICY "teacher can view linked profiles"
  ON profiles FOR SELECT
  USING (
    linked_student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

-- 2) 선생님이 그 포털 사용자들의 푸시 구독을 읽을 수 있게
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can view linked push subscriptions" ON push_subscriptions;
CREATE POLICY "teacher can view linked push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE linked_student_id IN (
        SELECT id FROM students WHERE teacher_id = auth.uid()
      )
    )
  );
