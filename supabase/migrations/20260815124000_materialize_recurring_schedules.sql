-- 학생 관리에 저장된 기존 반복 시간표를 실제 classes 행으로 복원한다.
-- 오늘부터 12주 범위이며 동일 학생·날짜·시작시간의 활성 일정은 중복 생성하지 않는다.
INSERT INTO public.classes (
  teacher_id,
  student_id,
  date,
  start_time,
  end_time,
  status,
  is_recurring
)
SELECT
  s.teacher_id,
  s.id,
  day_value::date,
  (slot.value->>'start_time')::time,
  (slot.value->>'end_time')::time,
  'scheduled',
  true
FROM public.students AS s
CROSS JOIN LATERAL jsonb_array_elements(to_jsonb(s.recurring_schedule)) AS slot(value)
CROSS JOIN LATERAL generate_series(
  current_date,
  current_date + 84,
  interval '1 day'
) AS generated(day_value)
WHERE s.is_active = true
  AND (slot.value->>'day')::integer = extract(dow FROM day_value)::integer
  AND slot.value ? 'start_time'
  AND slot.value ? 'end_time'
  AND NOT EXISTS (
    SELECT 1
    FROM public.classes AS existing
    WHERE existing.student_id = s.id
      AND existing.date = day_value::date
      AND existing.start_time = (slot.value->>'start_time')::time
      AND existing.status NOT IN ('postponed', 'cancelled')
  );
