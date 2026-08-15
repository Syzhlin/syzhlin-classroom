-- 2026-08-15 20:19 KST 이후 작업 롤백
DO $$
DECLARE
  original_teacher_id UUID;
BEGIN
  -- 오늘 일괄 연결 전의 선생님 ID는 기존 피드백 작성 데이터에서 복원한다.
  SELECT teacher_id INTO original_teacher_id
  FROM public.class_feedback
  WHERE teacher_id IS NOT NULL
  GROUP BY teacher_id
  ORDER BY count(*) DESC
  LIMIT 1;

  IF original_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Cannot infer original teacher id from class_feedback';
  END IF;

  -- 오늘 20:19 KST 이후 자동 생성된 반복 일정만 제거한다.
  DELETE FROM public.classes
  WHERE is_recurring = true
    AND created_at >= timestamptz '2026-08-15 20:19:00+09';

  UPDATE public.students SET teacher_id = original_teacher_id;
  UPDATE public.classes SET teacher_id = original_teacher_id;
END $$;

-- 기존의 본인 소유 데이터 정책으로 복원
DROP POLICY IF EXISTS "teacher can manage own students" ON public.students;
CREATE POLICY "teacher can manage own students"
  ON public.students FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher can manage own classes" ON public.classes;
CREATE POLICY "teacher can manage own classes"
  ON public.classes FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.daily_lesson_summaries
  DROP COLUMN IF EXISTS topic,
  DROP COLUMN IF EXISTS achievement,
  DROP COLUMN IF EXISTS next_focus,
  DROP COLUMN IF EXISTS listening_score,
  DROP COLUMN IF EXISTS speaking_score,
  DROP COLUMN IF EXISTS reading_score,
  DROP COLUMN IF EXISTS writing_score;
