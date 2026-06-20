import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type ClassRow = Database['public']['Tables']['classes']['Row']
type ClassUpdate = Database['public']['Tables']['classes']['Update']

export type ClassWithStudent = ClassRow & {
  students: {
    id: string
    name: string
    subjects: string[] | null
    color: string
    total_sessions: number
  } | null
}

export function useWeekClasses(weekStart: Date) {
  const supabase = createClient()
  const weekEnd = addDays(weekStart, 6)

  return useQuery({
    queryKey: ['classes', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async (): Promise<ClassWithStudent[]> => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          students (
            id,
            name,
            subjects,
            color
          )
        `)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('start_time')

      if (error) throw error
      return (data ?? []) as ClassWithStudent[]
    },
  })
}

// 전체 수업 이력 조회 — 회차 계산용 (모든 날짜, completed+scheduled)
export function useAllSessionClasses() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['classes-all-sessions'],
    queryFn: async (): Promise<ClassWithStudent[]> => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          students (
            id,
            name,
            subjects,
            color,
            total_sessions
          )
        `)
        .not('status', 'in', '(postponed,cancelled)')
        .order('date')
        .order('start_time')

      if (error) throw error
      return (data ?? []) as ClassWithStudent[]
    },
    staleTime: 60_000,
  })
}

// 회차 맵 계산: { classId -> N회 } — 전체 누적 순번 (전월 이월)
// 같은 학생의 모든 수업을 날짜·시간 순으로 1, 2, 3... 연속 부여
// 월이 바뀌어도 리셋 없이 이어짐
export function buildSessionNumberMap(allClasses: ClassWithStudent[]): Record<string, number> {
  const byStudent: Record<string, ClassWithStudent[]> = {}

  for (const cls of allClasses) {
    const sid = cls.student_id
    if (!byStudent[sid]) byStudent[sid] = []
    byStudent[sid].push(cls)
  }

  const map: Record<string, number> = {}
  for (const classes of Object.values(byStudent)) {
    classes.sort((a, b) =>
      a.date === b.date
        ? a.start_time.localeCompare(b.start_time)
        : a.date.localeCompare(b.date)
    )
    classes.forEach((cls, i) => {
      map[cls.id] = i + 1
    })
  }

  return map
}

export interface CreateClassInput {
  student_id: string
  date: string
  start_time: string
  end_time: string
  status?: string
  notes?: string | null
}

export function useCreateClass() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateClassInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('classes')
        .insert({
          teacher_id: user.id,
          student_id: input.student_id,
          date: input.date,
          start_time: input.start_time,
          end_time: input.end_time,
          status: (input.status ?? 'scheduled') as 'scheduled' | 'completed' | 'cancelled' | 'makeup',
          notes: input.notes ?? null,
          is_recurring: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & ClassUpdate) => {
      const { data, error } = await supabase
        .from('classes')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['today-briefing'] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}


export function usePostponeClass() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (cls: { id: string; student_id: string; teacher_id: string; date: string; start_time: string; end_time: string }) => {
      // 이 학생의 모든 scheduled 수업을 날짜순으로 조회
      const { data: allScheduled } = await supabase
        .from('classes')
        .select('date')
        .eq('student_id', cls.student_id)
        .eq('status', 'scheduled')
        .order('date')

      // 수업 간 평균 간격 계산 (최소 2개 이상일 때)
      let intervalDays = 7 // 기본값
      if (allScheduled && allScheduled.length >= 2) {
        const gaps: number[] = []
        for (let i = 1; i < allScheduled.length; i++) {
          const diff = (new Date(allScheduled[i].date).getTime() - new Date(allScheduled[i - 1].date).getTime()) / 86400000
          gaps.push(diff)
        }
        intervalDays = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
      }

      // 마지막 scheduled 수업 날짜 (미루기한 수업을 그 이후에 배치)
      const lastScheduled = allScheduled && allScheduled.length > 0
        ? allScheduled[allScheduled.length - 1].date
        : cls.date
      const lastDate = new Date(lastScheduled)
      lastDate.setDate(lastDate.getDate() + intervalDays)
      const newDate = format(lastDate, 'yyyy-MM-dd')

      // 현재 수업 → postponed (나머지 scheduled 수업들은 그대로 → 회차가 자동으로 당겨짐)
      const { error: updateError } = await supabase.from('classes').update({ status: 'postponed' }).eq('id', cls.id)
      if (updateError) throw updateError

      // 미뤄진 수업을 맨 뒤 날짜에 새로 생성
      const { error: insertError } = await supabase.from('classes').insert({
        student_id: cls.student_id,
        teacher_id: cls.teacher_id,
        date: newDate,
        start_time: cls.start_time,
        end_time: cls.end_time,
        status: 'scheduled' as const,
        is_recurring: false,
      })
      if (insertError) throw insertError
    },
    onError: (err) => { console.error('[postponeClass] error:', err) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['today-briefing'] })
    },
  })
}

// 학생/학부모 포털용: 특정 student_id의 수업 목록 조회
export function usePortalClasses(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['portal-classes', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, date, start_time, end_time, status, notes')
        .eq('student_id', studentId!)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) throw error
      return (data ?? []) as Array<{
        id: string
        date: string
        start_time: string
        end_time: string
        status: string
        notes: string | null
      }>
    },
  })
}
