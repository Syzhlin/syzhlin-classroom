'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// 포털 계정(선생님 제외) 목록 — 계정 연결 UI용
// ⚠️ supabase-account-link-migration.sql 의 RLS 정책이 적용돼 있어야 선생님이 조회 가능
export function usePortalProfiles() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['portal-profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'teacher')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Profile[]
    },
  })
}

// 포털 계정 ↔ 학생 연결/해제 (studentId = null 이면 연결 해제)
export function useLinkProfile() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({ profileId, studentId }: { profileId: string; studentId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ linked_student_id: studentId })
        .eq('id', profileId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-profiles'] })
    },
  })
}
