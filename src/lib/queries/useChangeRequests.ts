import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type ChangeRequest = {
  id: string
  student_id: string
  requester_id: string
  class_id: string | null
  request_type: 'reschedule' | 'cancel' | 'makeup'
  preferred_dates: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  teacher_note: string | null
  created_at: string
}

/** 학부모/학습자용: 내 변경 요청 목록 */
export function useMyChangeRequests(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['change-requests', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from('class_change_requests')
        .select('*, classes(date, start_time)')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false })
      return (data ?? []) as Array<ChangeRequest & { classes: { date: string; start_time: string } | null }>
    },
  })
}

/** 선생님용: 전체 변경 요청 */
export function useAllChangeRequests() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['change-requests-all'],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase
        .from('class_change_requests')
        .select('*, students(name, color), classes(date, start_time)')
        .order('created_at', { ascending: false })
      return (data ?? []) as Array<ChangeRequest & {
        students: { name: string; color: string }
        classes: { date: string; start_time: string } | null
      }>
    },
  })
}

/** 변경 요청 제출 (학부모/학습자) */
export function useSubmitChangeRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (input: {
      student_id: string
      class_id?: string
      request_type: 'reschedule' | 'cancel' | 'makeup'
      preferred_dates?: string
      reason?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('class_change_requests').insert({
        ...input,
        requester_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['change-requests', vars.student_id] })
      queryClient.invalidateQueries({ queryKey: ['change-requests-all'] })
    },
  })
}

/** 요청 처리 (선생님) — 승인 시 캘린더(classes) 자동 반영 */
export function useHandleChangeRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      status: 'approved' | 'rejected'
      teacher_note?: string
      // 캘린더 반영용 (승인 시)
      request_type?: 'reschedule' | 'cancel' | 'makeup'
      class_id?: string | null
      preferred_dates?: string | null
    }) => {
      // 1. 변경 요청 상태 업데이트
      const { error } = await supabase
        .from('class_change_requests')
        .update({ status: input.status, teacher_note: input.teacher_note ?? null, updated_at: new Date().toISOString() })
        .eq('id', input.id)
      if (error) throw error

      // 2. 승인 시 캘린더 자동 반영
      if (input.status === 'approved' && input.class_id) {
        if (input.request_type === 'reschedule' && input.preferred_dates) {
          // YYYY-MM-DD 형식 추출
          const dateMatch = input.preferred_dates.match(/\d{4}-\d{2}-\d{2}/)
          if (dateMatch) {
            const { error: classErr } = await supabase
              .from('classes')
              .update({ date: dateMatch[0] })
              .eq('id', input.class_id)
            if (classErr) throw classErr
          }
        } else if (input.request_type === 'cancel') {
          const { error: classErr } = await supabase
            .from('classes')
            .update({ status: 'cancelled' })
            .eq('id', input.class_id)
          if (classErr) throw classErr
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests-all'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
