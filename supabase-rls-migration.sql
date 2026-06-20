-- ============================================================
-- RLS 전수 점검 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- ============================================================
-- 1. classes 테이블 — 포털 사용자 읽기 정책 추가
-- (기존 teacher policy는 유지)
-- ============================================================
CREATE POLICY IF NOT EXISTS "portal users can view linked student classes"
  ON classes FOR SELECT
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 2. profiles 테이블
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 3. payments 테이블
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher can manage payments"
  ON payments FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal users can view own student payment"
  ON payments FOR SELECT
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 4. class_feedback 테이블
-- ============================================================
ALTER TABLE class_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher can manage feedback"
  ON class_feedback FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal users can view own student feedback"
  ON class_feedback FOR SELECT
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 5. class_materials 테이블
-- ============================================================
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher can manage materials"
  ON class_materials FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal users can view own student materials"
  ON class_materials FOR SELECT
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 6. messages 테이블
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher can manage all messages"
  ON messages FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal users can manage own student messages"
  ON messages FOR ALL
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 7. class_change_requests 테이블
-- ============================================================
ALTER TABLE class_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher can manage all change requests"
  ON class_change_requests FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal users can manage own student change requests"
  ON class_change_requests FOR ALL
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 8. growth_reports 테이블
-- ============================================================
ALTER TABLE growth_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher can manage growth reports"
  ON growth_reports FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal users can view own student growth reports"
  ON growth_reports FOR SELECT
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 9. push_subscriptions 테이블
-- ============================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users can manage own push subscription"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. login_codes 테이블 — API 라우트(service_role)만 접근
-- 일반 사용자 직접 접근 차단
-- ============================================================
ALTER TABLE login_codes ENABLE ROW LEVEL SECURITY;

-- 로그인 코드 조회는 로그인 페이지에서 anon으로 접근하므로 허용
CREATE POLICY IF NOT EXISTS "anyone can read login codes"
  ON login_codes FOR SELECT
  USING (true);

-- 생성/삭제는 서버(API route)에서만 → service_role key 사용
-- anon/authenticated 사용자는 차단
CREATE POLICY IF NOT EXISTS "no user can insert login codes"
  ON login_codes FOR INSERT
  WITH CHECK (false);

CREATE POLICY IF NOT EXISTS "no user can delete login codes"
  ON login_codes FOR DELETE
  USING (false);

-- ============================================================
-- 11. homework_submissions — 기존 너무 관대한 정책 교체
-- ============================================================
DROP POLICY IF EXISTS "student can insert own" ON homework_submissions;
DROP POLICY IF EXISTS "authenticated can select" ON homework_submissions;
DROP POLICY IF EXISTS "authenticated can update" ON homework_submissions;

CREATE POLICY IF NOT EXISTS "teacher can manage student homework"
  ON homework_submissions FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "portal can manage own student homework"
  ON homework_submissions FOR ALL
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );

