-- 운영 일정 연결 검증. 조건이 맞지 않으면 배포 전에 즉시 실패시킨다.
DO $$
DECLARE
  target_teacher_id UUID;
  target_class_count INTEGER;
  target_student_count INTEGER;
  first_class_date DATE;
  last_class_date DATE;
BEGIN
  SELECT id INTO target_teacher_id
  FROM auth.users
  WHERE lower(email) = lower('seizhen39@gmail.com')
  LIMIT 1;

  IF target_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher auth account not found: seizhen39@gmail.com';
  END IF;

  SELECT count(*) INTO target_student_count
  FROM public.students
  WHERE teacher_id = target_teacher_id;

  SELECT count(*), min(date), max(date)
  INTO target_class_count, first_class_date, last_class_date
  FROM public.classes
  WHERE teacher_id = target_teacher_id;

  IF target_class_count = 0 THEN
    RAISE EXCEPTION 'No classes linked to teacher %', target_teacher_id;
  END IF;

  RAISE NOTICE 'teacher=%, students=%, classes=%, range=%..%',
    target_teacher_id, target_student_count, target_class_count, first_class_date, last_class_date;
END $$;
