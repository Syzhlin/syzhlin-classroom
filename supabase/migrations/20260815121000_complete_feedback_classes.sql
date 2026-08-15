-- 피드백이 작성된 수업은 실제 진행된 수업이므로 완료 상태로 맞춘다.
-- 결제/회차 수치는 변경하지 않고 수업 상태만 보정한다.
UPDATE public.classes AS c
SET status = 'completed'
WHERE c.status IS DISTINCT FROM 'completed'
  AND EXISTS (
    SELECT 1
    FROM public.class_feedback AS f
    WHERE f.class_id = c.id
  );
