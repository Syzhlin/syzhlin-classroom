# syzhlin-classroom — 과외 선생님 학생 관리 웹앱

## 프로젝트 개요
과외 선생님(Sejin)이 학생과 수업 일정을 관리하는 웹앱.
현재 Phase 1(초기 세팅) 완료. **지금 할 작업: Phase 2 — `/schedule` 수업 일정 관리 UI 구현.**

## 기술 스택
- Next.js 15 + App Router
- TypeScript strict mode
- Tailwind CSS + shadcn/ui + lucide-react
- Supabase (Postgres + Auth) — `src/lib/supabase/client.ts` / `server.ts`
- TanStack Query v5
- Zustand (`src/store/scheduleStore.ts` 이미 생성됨)
- React Hook Form + Zod

## 폴더 구조 (현재 상태)
```
src/
├── app/
│   ├── (auth)/login/page.tsx       ← skeleton
│   └── (dashboard)/
│       ├── layout.tsx              ← Sidebar 포함 ✅
│       ├── page.tsx                ← 대시보드 홈 skeleton
│       ├── schedule/page.tsx       ← ⭐ 지금 구현할 페이지
│       ├── students/page.tsx       ← skeleton
│       └── payments/page.tsx       ← skeleton
├── components/
│   ├── layout/Sidebar.tsx          ✅ 완성
│   └── schedule/                   ← 지금 만들 컴포넌트들
├── lib/
│   ├── supabase/client.ts          ✅
│   ├── supabase/server.ts          ✅
│   └── queries/                    ← TanStack Query hooks 만들 곳
├── store/scheduleStore.ts          ✅
└── types/database.ts               ✅ (Supabase 타입 수동 정의됨)
```

## DB 스키마 (supabase-schema.sql 참고)
- `students`: id, teacher_id, name, phone, parent_phone, school, grade, subjects[], hourly_rate, color, is_active, notes
- `classes`: id, teacher_id, student_id, date, start_time, end_time, status(scheduled/completed/cancelled/makeup), notes

## ⭐ 지금 할 작업: `/schedule` 페이지 구현

### 화면 구성
1. **WeekNavigator** — 주 이동 (← 이전 주 | 2025년 6월 3주 | 다음 주 →)
2. **WeekCalendar** — 주간 그리드 (월~일 × 07:00~22:00, 1시간=60px)
3. **ClassBlock** — 캘린더 안 수업 블록 (학생 이름+과목+시간, 학생 color 배경)
4. **ClassFormDialog** — 수업 추가/수정 폼 (React Hook Form + Zod)
5. **ClassDetailSheet** — 수업 클릭 시 상세/수정/삭제 Sheet

### Zod 스키마
```typescript
const classSchema = z.object({
  student_id: z.string().uuid(),
  date: z.date(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'makeup']),
  notes: z.string().optional(),
}).refine(d => d.start_time < d.end_time, {
  message: '종료 시간은 시작 시간보다 늦어야 합니다',
  path: ['end_time'],
})
```

### TanStack Query hooks (`src/lib/queries/`)
- `useWeekClasses(weekStart: Date)` — date BETWEEN weekStart~weekEnd
- `useCreateClass()` — insert + invalidate ['classes']
- `useUpdateClass()` — update + invalidate ['classes']
- `useDeleteClass()` — delete + invalidate ['classes']
- `useStudents()` — 학생 목록 (Select 옵션용)

### 수업 블록 상태 표시
- scheduled: 정상
- completed: opacity-50
- cancelled: line-through
- makeup: 주황색 테두리(border-orange-400)

### 빈 상태
- 학생 없음: "먼저 학생을 추가해주세요" 메시지
- 수업 없음: 빈 그리드 (정상)

### 모바일 반응형
- 데스크톱: 주간 그리드
- 모바일(md 미만): 날짜 탭 + 일별 수업 목록

## 중요 규칙
- TypeScript strict mode, 에러 0개 유지
- `src/lib/supabase/` 파일 수정 금지
- `src/types/database.ts` 수정 금지
- students/payments 페이지 건드리지 않음
- shadcn/ui Skeleton으로 로딩 상태 처리

## 환경변수
`.env.local.example` 참고해서 `.env.local` 만들고 Supabase 값 입력 필요.

## 다음 단계 (이후 별도 지시)
- Phase 3: 학생 목록 관리 (`/students`)
- Phase 4: 결제/정산 (`/payments`)
- Phase 5: 대시보드 홈
- Phase 6: Supabase Auth 로그인
