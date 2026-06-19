import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type GrowthReport = {
  id: string
  student_id: string
  teacher_id: string
  period: string
  lesson_count: number
  score_expression: number | null
  score_comprehension: number | null
  score_reading_fluency: number | null
  score_sentence_building: number | null
  score_willingness: number | null
  note_expression: string | null
  note_comprehension: string | null
  note_reading_fluency: string | null
  note_sentence_building: string | null
  note_willingness: string | null
  teacher_comment: string | null
  generated_report: string | null
  status: 'draft' | 'saved' | 'published'
  created_at: string
  updated_at: string
}

/** 학생의 리포트 목록 */
export function useStudentReports(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['growth-reports', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from('growth_reports')
        .select('*')
        .eq('student_id', studentId!)
        .order('period', { ascending: false })
      return (data ?? []) as GrowthReport[]
    },
  })
}

/** 특정 기간 리포트 */
export function useStudentReportByPeriod(studentId: string | null, period: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['growth-report', studentId, period],
    enabled: !!studentId && !!period,
    queryFn: async () => {
      const { data } = await supabase
        .from('growth_reports')
        .select('*')
        .eq('student_id', studentId!)
        .eq('period', period)
        .maybeSingle()
      return data as GrowthReport | null
    },
  })
}

/** 학부모용 - 공개된 리포트만 */
export function usePublishedReports(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['published-reports', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from('growth_reports')
        .select('*')
        .eq('student_id', studentId!)
        .eq('status', 'published')
        .order('period', { ascending: false })
      return (data ?? []) as GrowthReport[]
    },
  })
}

/** 저장/업서트 */
export function useUpsertGrowthReport() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (input: Partial<GrowthReport> & { student_id: string; period: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('growth_reports')
        .upsert({ ...input, teacher_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'student_id,period' })
        .select()
        .single()
      if (error) throw error
      return data as GrowthReport
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['growth-reports', vars.student_id] })
      queryClient.invalidateQueries({ queryKey: ['growth-report', vars.student_id, vars.period] })
      queryClient.invalidateQueries({ queryKey: ['published-reports', vars.student_id] })
    },
  })
}
