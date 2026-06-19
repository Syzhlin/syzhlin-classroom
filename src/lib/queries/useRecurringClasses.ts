import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

/** 오늘부터 12주치 정기 수업 자동 생성 */
export function useGenerateRecurringClasses() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      const { data: students } = await supabase
        .from('students')
        .select('id, recurring_schedule')
        .eq('teacher_id', user.id)
        .eq('is_active', true)

      if (!students?.length) return 0

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const until = new Date(today)
      until.setDate(until.getDate() + 84) // 12주

      const todayStr = format(today, 'yyyy-MM-dd')
      const untilStr = format(until, 'yyyy-MM-dd')

      // 이미 있는 수업 목록 (중복 방지) — postponed/cancelled는 빈 슬롯으로 간주
      const { data: existing } = await supabase
        .from('classes')
        .select('student_id, date, start_time, status')
        .eq('teacher_id', user.id)
        .gte('date', todayStr)
        .lte('date', untilStr)

      const existingSet = new Set(
        (existing ?? [])
          .filter(c => c.status !== 'postponed' && c.status !== 'cancelled')
          .map(c => `${c.student_id}|${c.date}|${c.start_time}`)
      )

      const toInsert: {
        teacher_id: string
        student_id: string
        date: string
        start_time: string
        end_time: string
        status: 'scheduled'
        is_recurring: boolean
      }[] = []

      for (const student of students) {
        const slots = (student.recurring_schedule ?? []) as { day: number; start_time: string; end_time: string }[]
        if (!slots.length) continue

        const cursor = new Date(today)
        while (cursor <= until) {
          const dow = cursor.getDay()
          for (const slot of slots) {
            if (slot.day === dow) {
              const dateStr = format(cursor, 'yyyy-MM-dd')
              const key = `${student.id}|${dateStr}|${slot.start_time}`
              if (!existingSet.has(key)) {
                toInsert.push({
                  teacher_id: user.id,
                  student_id: student.id,
                  date: dateStr,
                  start_time: slot.start_time,
                  end_time: slot.end_time,
                  status: 'scheduled',
                  is_recurring: true,
                })
                existingSet.add(key)
              }
            }
          }
          cursor.setDate(cursor.getDate() + 1)
        }
      }

      if (toInsert.length) {
        await supabase.from('classes').insert(toInsert)
      }
      return toInsert.length
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

/** 학생의 오늘 이후 scheduled 수업 전체 삭제 */
export function useDeleteFutureClasses() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (studentId: string) => {
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('classes')
        .delete()
        .eq('student_id', studentId)
        .eq('status', 'scheduled')
        .gte('date', today)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['today-briefing'] })
    },
  })
}
