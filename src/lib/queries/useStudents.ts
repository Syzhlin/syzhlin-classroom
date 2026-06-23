import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']

export function useStudents() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return (data ?? []) as Student[]
    },
  })
}

export interface CreateStudentInput {
  name: string
  phone?: string | null
  parent_phone?: string | null
  school?: string | null
  grade?: string | null
  subjects?: string[]
  hourly_rate?: number | null
  color?: string
  notes?: string | null
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('students')
        .insert({
          teacher_id: user.id,
          name: input.name,
          phone: input.phone ?? null,
          parent_phone: input.parent_phone ?? null,
          school: input.school ?? null,
          grade: input.grade ?? null,
          subjects: input.subjects ?? [],
          hourly_rate: input.hourly_rate ?? null,
          color: input.color ?? '#6366f1',
          notes: input.notes ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & Partial<CreateStudentInput>) => {
      const { data, error } = await supabase
        .from('students')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useResetAllPassportStamps() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // startDate: 'yyyy-MM-dd'. 이 날짜(포함) 이후 완료된 수업만 여권에 카운트됨.
  return useMutation({
    mutationFn: async (startDate: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      // 선생님의 모든 활성 학생의 여권 시작일을 선택한 날짜로 설정
      const { error } = await supabase
        .from('students')
        .update({ passport_start_date: startDate })
        .eq('teacher_id', user.id)
        .eq('is_active', true)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['growth-report'] })
    },
  })
}
