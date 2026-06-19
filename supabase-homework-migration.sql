-- 1. homework_submissions 테이블 생성
CREATE TABLE IF NOT EXISTS homework_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  photo_url      TEXT,
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted', 'reviewed')),
  teacher_comment TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS 활성화
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- 3. 학생/학부모 → 자신 것만 insert/select
CREATE POLICY "student can insert own"
  ON homework_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated can select"
  ON homework_submissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 선생님이 teacher_comment, status 업데이트
CREATE POLICY "authenticated can update"
  ON homework_submissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 4. Storage 버킷 (이미 없을 경우에만)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-photos', 'homework-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage 정책
CREATE POLICY "auth upload homework"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'homework-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "public read homework"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homework-photos');
