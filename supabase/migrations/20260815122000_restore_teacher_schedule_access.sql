-- 기존 일정의 teacher_id가 현재 선생님 로그인 UID와 달라도
-- teacher 역할 계정은 학원 전체 학생·수업 일정을 관리할 수 있게 한다.
-- public.is_teacher()는 SECURITY DEFINER로 profiles RLS 재귀를 피한다.

DO $$
DECLARE
  target_teacher_id UUID;
BEGIN
  SELECT id INTO target_teacher_id
  FROM auth.users
  WHERE lower(email) = lower('seizhen39@gmail.com')
  LIMIT 1;

  IF target_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher auth account not found: seizhen39@gmail.com';
  END IF;

  INSERT INTO public.profiles (id, role, display_name)
  VALUES (target_teacher_id, 'teacher', 'Seizhen')
  ON CONFLICT (id) DO UPDATE SET role = 'teacher';

  -- 현재 학원 데이터의 소유 선생님을 요청 계정으로 일원화한다.
  UPDATE public.students SET teacher_id = target_teacher_id;
  UPDATE public.classes SET teacher_id = target_teacher_id;
END $$;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher can manage own students" ON public.students;
CREATE POLICY "teacher can manage own students"
  ON public.students FOR ALL
  USING (teacher_id = auth.uid() OR public.is_teacher())
  WITH CHECK (teacher_id = auth.uid() OR public.is_teacher());

DROP POLICY IF EXISTS "teacher can manage own classes" ON public.classes;
CREATE POLICY "teacher can manage own classes"
  ON public.classes FOR ALL
  USING (teacher_id = auth.uid() OR public.is_teacher())
  WITH CHECK (teacher_id = auth.uid() OR public.is_teacher());
