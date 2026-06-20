import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { ClassWithStudent } from './useClasses'

export interface BriefingClass {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  student_id: string
  studentName: string
  studentColor: string
  // 결제
  completedSessions: number
  totalSessions: number
  paymentStatus: string | null
  // 자료
  hasMaterials: boolean
}

export function useTodayBriefing() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['today-briefing'],
    queryFn: async (): Promise<BriefingClass[]> => {
      // 클라이언트 로컬 시간 기준 (SSR UTC 불일치 방지)
      const today = format(new Date(), 'yyyy-MM-dd')
      const yearMonth = format(new Date(), 'yyyy-MM')

      // 1. 오늘 수업 목록
      const { data: classes, error: classErr } = await supabase
        .from('classes')
        .select('*, students(id, name, color)')
        .eq('date', today)
        .order('start_time')
      if (classErr) throw classErr
      if (!classes || classes.length === 0) return []
      const typedClasses = (classes as unknown as ClassWithStudent[])

      const studentIds = [...new Set(typedClasses.map(c => c.student_id))]

      // 2. 이달 결제 정보
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, completed_sessions, total_sessions, status')
        .eq('year_month', yearMonth)
        .in('student_id', studentIds)

      const paymentMap = Object.fromEntries(
        (payments ?? []).map(p => [p.student_id, p])
      )

      // 3. 수업자료 유무
      const { data: materials } = await supabase
        .from('class_materials')
        .select('student_id')
        .in('student_id', studentIds)

      const materialStudentIds = new Set((materials ?? []).map(m => (m as { student_id: string }).student_id))

      // 합치기
      return typedClasses.map(cls => {
        const student = cls.students
        const payment = paymentMap[cls.student_id]
        return {
          id: cls.id,
          date: cls.date,
          start_time: cls.start_time,
          end_time: cls.end_time,
          status: cls.status,
          notes: cls.notes,
          student_id: cls.student_id,
          studentName: student?.name ?? '알 수 없음',
          studentColor: student?.color ?? '#6366f1',
          completedSessions: payment?.completed_sessions ?? 0,
          totalSessions: payment?.total_sessions ?? 0,
          paymentStatus: payment?.status ?? null,
          hasMaterials: materialStudentIds.has(cls.student_id),
        }
      })
    },
  })
}
