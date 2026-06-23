import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type DailyLessonSummaryRow = {
  id: string
  student_id: string
  author_id: string
  date: string
  content: string | null
  next_prep: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** 특정 학생 + 날짜의 수업정리 (선생님/포털 공통) */
export function useDailyLessonSummary(studentId: string | null, date: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['daily-lesson-summary', studentId, date],
    enabled: !!studentId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_lesson_summaries')
        .select('*')
        .eq('student_id', studentId!)
        .eq('date', date!)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data as DailyLessonSummaryRow | null
    },
  })
}

/** 수업정리 저장 (upsert, 선생님 작성) */
export function useUpsertDailyLessonSummary() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: {
      student_id: string
      date: string
      content?: string
      next_prep?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('daily_lesson_summaries')
        .upsert(
          {
            student_id: input.student_id,
            date: input.date,
            content: input.content ?? null,
            next_prep: input.next_prep ?? null,
            author_id: user.id,
            updated_at: new Date().toISOString(),
            deleted_at: null,
          },
          { onConflict: 'student_id,date' }
        )
        .select()
        .single()
      if (error) throw error
      return data as DailyLessonSummaryRow
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['daily-lesson-summary', vars.student_id, vars.date] })
      queryClient.invalidateQueries({ queryKey: ['portal-home'] })
    },
  })
}
