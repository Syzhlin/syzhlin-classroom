import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Material = Database['public']['Tables']['class_materials']['Row']

// Portal: 학생 수업자료 조회
export function usePortalMaterials(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['portal-materials', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<Material[]> => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('class_materials')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

// Teacher: 학생별 수업자료 조회
export function useStudentMaterials(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['materials', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<Material[]> => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('class_materials')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

// Teacher: 자료 추가
export function useAddMaterial() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (input: Database['public']['Tables']['class_materials']['Insert']) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')
      const { data, error } = await supabase
        .from('class_materials')
        .insert({ ...input, teacher_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials', variables.student_id] })
    },
  })
}

// Teacher: 자료 삭제
export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const { error } = await supabase.from('class_materials').delete().eq('id', id)
      if (error) throw error
      return { id, studentId }
    },
    onSuccess: ({ studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['materials', studentId] })
    },
  })
}
