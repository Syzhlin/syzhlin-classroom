-- ============================================================
-- RLS 정책 재적용 (유효 문법 교정본)
-- 원본 supabase-rls-migration.sql 은 'CREATE POLICY IF NOT EXISTS' 를 썼는데
-- Postgres는 CREATE POLICY 에 IF NOT EXISTS 를 지원하지 않아 첫 줄에서 에러로 중단됨.
-- → payments 등 쓰기 정책이 안 깔려서 결제요청/수업완료 카운트 업데이트가 막혔음.
-- 이 파일은 DROP POLICY IF EXISTS + CREATE POLICY 로 안전하게 재적용한다.
-- Supabase Dashboard > SQL Editor 에 통째로 붙여넣고 Run.
-- ============================================================

-- 1. classes — 포털 사용자 읽기
DROP POLICY IF EXISTS "portal users can view linked student classes" ON classes;
CREATE POLICY "portal users can view linked student classes"
  ON classes FOR SELECT
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 2. profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own profile" ON profiles;
CREATE POLICY "users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "users can insert own profile" ON profiles;
CREATE POLICY "users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. payments  ← 결제요청/수업완료 카운트의 핵심
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can manage payments" ON payments;
CREATE POLICY "teacher can manage payments"
  ON payments FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal users can view own student payment" ON payments;
CREATE POLICY "portal users can view own student payment"
  ON payments FOR SELECT
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 4. class_feedback
ALTER TABLE class_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can manage feedback" ON class_feedback;
CREATE POLICY "teacher can manage feedback"
  ON class_feedback FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal users can view own student feedback" ON class_feedback;
CREATE POLICY "portal users can view own student feedback"
  ON class_feedback FOR SELECT
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 5. class_materials
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can manage materials" ON class_materials;
CREATE POLICY "teacher can manage materials"
  ON class_materials FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal users can view own student materials" ON class_materials;
CREATE POLICY "portal users can view own student materials"
  ON class_materials FOR SELECT
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 6. messages  ← 결제 안내 자동 메시지 / 문의함
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can manage all messages" ON messages;
CREATE POLICY "teacher can manage all messages"
  ON messages FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal users can manage own student messages" ON messages;
CREATE POLICY "portal users can manage own student messages"
  ON messages FOR ALL
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 7. class_change_requests
ALTER TABLE class_change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can manage all change requests" ON class_change_requests;
CREATE POLICY "teacher can manage all change requests"
  ON class_change_requests FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal users can manage own student change requests" ON class_change_requests;
CREATE POLICY "portal users can manage own student change requests"
  ON class_change_requests FOR ALL
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 8. growth_reports
ALTER TABLE growth_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher can manage growth reports" ON growth_reports;
CREATE POLICY "teacher can manage growth reports"
  ON growth_reports FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal users can view own student growth reports" ON growth_reports;
CREATE POLICY "portal users can view own student growth reports"
  ON growth_reports FOR SELECT
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));

-- 9. push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can manage own push subscription" ON push_subscriptions;
CREATE POLICY "users can manage own push subscription"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. login_codes
ALTER TABLE login_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can read login codes" ON login_codes;
CREATE POLICY "anyone can read login codes" ON login_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "no user can insert login codes" ON login_codes;
CREATE POLICY "no user can insert login codes" ON login_codes FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "no user can delete login codes" ON login_codes;
CREATE POLICY "no user can delete login codes" ON login_codes FOR DELETE USING (false);

-- 11. homework_submissions
DROP POLICY IF EXISTS "student can insert own" ON homework_submissions;
DROP POLICY IF EXISTS "authenticated can select" ON homework_submissions;
DROP POLICY IF EXISTS "authenticated can update" ON homework_submissions;
DROP POLICY IF EXISTS "teacher can manage student homework" ON homework_submissions;
CREATE POLICY "teacher can manage student homework"
  ON homework_submissions FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
DROP POLICY IF EXISTS "portal can manage own student homework" ON homework_submissions;
CREATE POLICY "portal can manage own student homework"
  ON homework_submissions FOR ALL
  USING (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (student_id IN (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));
