import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Message = {
  id: string
  student_id: string
  sender_id: string
  sender_role: 'teacher' | 'parent' | 'student'
  channel_type: string
  body: string
  read_at: string | null
  created_at: string
}

/** 학생별 메시지 스레드 (선생님/학부모 공통) */
export function useMessages(studentId: string | null, channelType?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['messages', studentId, channelType],
    enabled: !!studentId,
    refetchInterval: 10000, // 10초마다 polling
    queryFn: async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: true })
      if (channelType) query = (query as any).eq('channel_type', channelType)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Message[]
    },
  })
}

/** 선생님 대시보드용: 모든 학생별 최근 메시지 (unread count 포함) */
export function useAllStudentMessages() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['messages-all'],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, students(id, name, color)')
        .order('created_at', { ascending: false })
      const msgs = (data ?? []) as Array<Message & { students: { id: string; name: string; color: string } }>

      // 학생별로 그룹핑
      const map = new Map<string, { student: { id: string; name: string; color: string }; lastMsg: Message; unread: number }>()
      for (const m of msgs) {
        if (!map.has(m.student_id)) {
          map.set(m.student_id, {
            student: m.students,
            lastMsg: m,
            unread: (!m.read_at && m.sender_role !== 'teacher') ? 1 : 0,
          })
        } else {
          const cur = map.get(m.student_id)!
          if (!m.read_at && m.sender_role !== 'teacher') cur.unread++
        }
      }
      return Array.from(map.values())
    },
  })
}

/** 메시지 전송 */
export function useSendMessage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: { student_id: string; body: string; sender_role: 'teacher' | 'parent' | 'student'; channel_type?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await (supabase.from('messages') as any).insert({
        ...input,
        sender_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.student_id] })
      queryClient.invalidateQueries({ queryKey: ['messages-all'] })
    },
  })
}

/** 읽음 처리 */
export function useMarkMessagesRead() {
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({ studentId, channelType }: { studentId: string; channelType?: string }) => {
      let query = supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .is('read_at', null)
        .neq('sender_role', 'teacher')
      if (channelType) query = (query as any).eq('channel_type', channelType)
      await query
    },
  })
}
