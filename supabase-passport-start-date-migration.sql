-- 여권 스탬프 기준일(passport_start_date) 마이그레이션
-- 기존: passport_base_classes(완료 수업 수 기준 오프셋, 수동 설정) → 오프셋이 오늘 수업까지
--       먹혀 0이 되는 문제가 있었음.
-- 변경: passport_start_date(날짜) 기준으로, 이 날짜(포함) 이후 완료된 수업만 여권에 카운트.
--       학생별로 다른 시작일을 둘 수 있음. NULL이면 앱의 기본값(PASSPORT_START_DATE=2026-06-22) 사용.

alter table students
  add column if not exists passport_start_date date;

-- 기존 모든 학생을 6/22 기준으로 백필 (요청사항: 6/22 이후 수업부터 새로 카운트)
update students
  set passport_start_date = '2026-06-22'
  where passport_start_date is null;

-- 신규 학생 기본값도 6/22 (원하면 이후 수정/리셋 가능)
alter table students
  alter column passport_start_date set default '2026-06-22';

-- 참고: passport_base_classes 컬럼은 더 이상 사용하지 않음(앱 코드에서 미참조).
--       당장 삭제하지 않고 보존. 정리하려면 아래 주석 해제:
-- alter table students drop column if exists passport_base_classes;
