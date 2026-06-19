-- syzhlin-classroom DB 스키마
-- Supabase SQL 에디터에서 실행하세요

-- 학생 테이블
create table students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  parent_phone text,
  school text,
  grade text,
  subjects text[],
  hourly_rate integer,
  color text default '#6366f1',
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- 수업 일정 테이블
create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'makeup')),
  notes text,
  is_recurring boolean default false,
  recurring_rule jsonb,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table students enable row level security;
alter table classes enable row level security;

-- RLS 정책
create policy "teacher can manage own students"
  on students for all
  using (auth.uid() = teacher_id);

create policy "teacher can manage own classes"
  on classes for all
  using (auth.uid() = teacher_id);

-- 인덱스
create index classes_date_idx on classes(date);
create index classes_teacher_date_idx on classes(teacher_id, date);
create index students_teacher_idx on students(teacher_id);
