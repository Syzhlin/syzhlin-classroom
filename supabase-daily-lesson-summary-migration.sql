-- ============================================================
-- 오늘의 수업정리 / 다음 수업 준비 사항 마이그레이션
-- daily_lesson_summaries 테이블 생성 + 인덱스 + RLS
-- (기존 class_feedback 와 완전히 분리된, 학생·날짜별 기록)
-- Supabase SQL Editor에서 1회 실행하세요
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS daily_lesson_summaries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  content    TEXT,
  next_prep  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 학생 + 날짜 당 하나의 수업정리만 존재 (upsert 대상)
CREATE UNIQUE INDEX IF NOT EXISTS daily_lesson_summaries_student_date_idx
  ON daily_lesson_summaries(student_id, date);

-- 2. RLS 활성화
ALTER TABLE daily_lesson_summaries ENABLE ROW LEVEL SECURITY;

-- 3. 선생님: 본인 학생의 수업정리 전체 관리 (class_feedback 와 동일 스타일)
CREATE POLICY IF NOT EXISTS "teacher can manage lesson summaries"
  ON daily_lesson_summaries FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE teacher_id = auth.uid()
    )
  );

-- 4. 포털 사용자(학생/학부모): 연결된 학생의 수업정리 읽기 전용
CREATE POLICY IF NOT EXISTS "portal users can view own student lesson summaries"
  ON daily_lesson_summaries FOR SELECT
  USING (
    student_id IN (
      SELECT linked_student_id FROM profiles WHERE id = auth.uid()
    )
  );
