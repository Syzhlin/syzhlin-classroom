-- 수업 날짜별 학습 내용과 영역별 관찰 척도(1~5)
ALTER TABLE public.daily_lesson_summaries
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS achievement TEXT,
  ADD COLUMN IF NOT EXISTS next_focus TEXT,
  ADD COLUMN IF NOT EXISTS listening_score SMALLINT CHECK (listening_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS speaking_score SMALLINT CHECK (speaking_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS reading_score SMALLINT CHECK (reading_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS writing_score SMALLINT CHECK (writing_score BETWEEN 1 AND 5);
