import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type DailyLessonSummaryRow = {
  id: string
  student_id: string
  author_id: string
  date: string
  content: string | null
  next_prep: string | null
  topic: string | null
  achievement: string | null
  next_focus: string | null
  listening_score: number | null
  speaking_score: number | null
  reading_score: number | null
  writing_score: number | null
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
      topic?: string
      achievement?: string
      next_focus?: string
      listening_score?: number
      speaking_score?: number
      reading_score?: number
      writing_score?: number
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
            topic: input.topic ?? null,
            achievement: input.achievement ?? null,
            next_focus: input.next_focus ?? null,
            listening_score: input.listening_score ?? null,
            speaking_score: input.speaking_score ?? null,
            reading_score: input.reading_score ?? null,
            writing_score: input.writing_score ?? null,
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
