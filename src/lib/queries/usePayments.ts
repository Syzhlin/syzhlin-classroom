import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Payment = Database['public']['Tables']['payments']['Row']
type Student = Database['public']['Tables']['students']['Row']

export type PaymentWithStudent = Payment & { student: Student }

export function useMonthPayments(yearMonth: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['payments', yearMonth],
    queryFn: async (): Promise<PaymentWithStudent[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, student:students(*)')
        .eq('year_month', yearMonth)
        .order('created_at')

      if (error) throw error
      return (data ?? []) as PaymentWithStudent[]
    },
  })
}

export interface UpdatePaymentInput {
  id: string
  completed_sessions?: number
  bonus_sessions?: number
  total_sessions?: number
  status?: '완납' | '미납' | '부분납'
  amount?: number
  payment_method?: string | null
  payment_link?: string | null
  payment_requested?: boolean
  notes?: string | null
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...update }: UpdatePaymentInput) => {
      const { data, error } = await supabase
        .from('payments')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: Database['public']['Tables']['payments']['Insert']) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('payments')
        .insert({ ...input, teacher_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

// Portal: fetch single payment for a student in a given year-month
export function usePortalPayment(studentId: string | null, yearMonth: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['portal-payment', studentId, yearMonth],
    enabled: !!studentId,
    queryFn: async (): Promise<Payment | null> => {
      if (!studentId) return null
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('year_month', yearMonth)
        .single()
      return data
    },
  })
}

/** 학생별 전체 결제 이력 */
export function useStudentPayments(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['payments-student', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<Payment[]> => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('year_month', { ascending: false })
      if (error) throw error
      return (data ?? []) as Payment[]
    },
  })
}

/** 전체 결제 이력 (회차 계산용) — studentId:yearMonth -> completed_sessions */
export function useAllPayments() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['payments-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('student_id, year_month, completed_sessions')
      if (error) throw error
      return (data ?? []) as Array<{ student_id: string; year_month: string; completed_sessions: number }>
    },
    staleTime: 30_000,
  })
}
