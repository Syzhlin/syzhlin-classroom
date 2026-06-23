import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { PASSPORT_START_DATE } from '@/lib/cities'

export type FeedbackRow = {
  id: string
  class_id: string
  student_id: string
  topic: string | null
  expressions: string[] | null
  good_points: string | null
  practice_needed: string | null
  homework_text: string | null
  has_homework: boolean
  parent_summary: string | null
  created_at: string
}

/** 학생의 피드백 목록 (선생님용) */
export function useStudentFeedbacks(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['feedbacks', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_feedback')
        .select('*, classes(date, start_time)')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

/** 수업 하나의 피드백 */
export function useClassFeedback(classId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['feedback', classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from('class_feedback')
        .select('*')
        .eq('class_id', classId!)
        .maybeSingle()
      return data as FeedbackRow | null
    },
  })
}

/** 피드백 저장 (upsert) */
export function useUpsertFeedback() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: {
      class_id: string
      student_id: string
      topic?: string
      expressions?: string[]
      good_points?: string
      practice_needed?: string
      homework_text?: string
      has_homework?: boolean
      parent_summary?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('class_feedback')
        .upsert({ ...input, teacher_id: user.id }, { onConflict: 'class_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', vars.class_id] })
      queryClient.invalidateQueries({ queryKey: ['feedbacks', vars.student_id] })
      queryClient.invalidateQueries({ queryKey: ['portal-home'] })
    },
  })
}

/** 학부모 포털용 - 최근 피드백 + 다음 수업 + 이번 달 결제 */
export function usePortalHome(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['portal-home', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd') // 로컬 시간 기준
      const yearMonth = format(new Date(), 'yyyy-MM')

      type SimpleClass = { id: string; date: string; start_time: string; end_time: string; status: string }
      type ClassWithFeedback = SimpleClass & { class_feedback: FeedbackRow[] }

      // 최근 완료 수업
      const { data: recentClassesRaw } = await supabase
        .from('classes')
        .select('id, date, start_time, end_time, status')
        .eq('student_id', studentId!)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(5)

      const recentClasses = (recentClassesRaw ?? []) as SimpleClass[]

      // 최근 수업 피드백 가져오기
      let recentWithFeedback: ClassWithFeedback[] = recentClasses.map(c => ({ ...c, class_feedback: [] }))
      if (recentClasses.length > 0) {
        const classIds = recentClasses.map(c => c.id)
        const { data: feedbacks } = await supabase
          .from('class_feedback')
          .select('*')
          .in('class_id', classIds)
        const feedbackMap = new Map<string, FeedbackRow>()
        ;(feedbacks ?? []).forEach(f => feedbackMap.set(f.class_id, f as FeedbackRow))
        recentWithFeedback = recentClasses.map(c => ({
          ...c,
          class_feedback: feedbackMap.has(c.id) ? [feedbackMap.get(c.id)!] : [],
        }))
      }

      // 다음 예정 수업
      const { data: nextClassesRaw } = await supabase
        .from('classes')
        .select('id, date, start_time, end_time, status')
        .eq('student_id', studentId!)
        .eq('status', 'scheduled')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(3)

      const nextClasses = (nextClassesRaw ?? []) as SimpleClass[]

      // 이번 달 결제 (잔여 회차)
      const { data: payment } = await supabase
        .from('payments')
        .select('planned_sessions, completed_sessions, bonus_sessions, total_sessions, status, amount, payment_requested')
        .eq('student_id', studentId!)
        .eq('year_month', yearMonth)
        .maybeSingle()

      return {
        recentClasses: recentWithFeedback,
        nextClasses,
        payment,
      }
    },
  })
}

/** 학부모 포털용 - 성장 리포트 데이터 */
export function useGrowthReport(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['growth-report', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      // 완료된 수업 전체 + 학생 여권 시작일
      const [{ data: completedClasses }, { data: studentRow }] = await Promise.all([
        supabase
          .from('classes')
          .select('id, date, start_time, end_time')
          .eq('student_id', studentId!)
          .eq('status', 'completed')
          .order('date', { ascending: true }),
        supabase
          .from('students')
          .select('passport_start_date')
          .eq('id', studentId!)
          .single(),
      ])

      const classes = (completedClasses ?? []) as Array<{ id: string; date: string; start_time: string; end_time: string }>

      // 피드백 전체
      const { data: feedbacks } = await supabase
        .from('class_feedback')
        .select('*')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: true })

      const fbList = (feedbacks ?? []) as FeedbackRow[]

      // 월별 수업 수 집계
      const monthMap = new Map<string, number>()
      classes.forEach(c => {
        const ym = c.date.slice(0, 7) // "2025-03"
        monthMap.set(ym, (monthMap.get(ym) ?? 0) + 1)
      })
      const monthlyData = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ym, count]) => ({
          month: ym.slice(5) + '월', // "03월"
          ym,
          count,
        }))

      // 배운 표현 전체 (중복 제거)
      const expressionSet = new Set<string>()
      fbList.forEach(f => (f.expressions ?? []).forEach(e => expressionSet.add(e)))
      const expressions = Array.from(expressionSet)

      // 숙제 있는 수업
      const homeworkCount = fbList.filter(f => f.has_homework).length

      // 여권 스탬프: 학생별 passport_start_date(포함) 이후 완료된 수업만 카운트.
      // 값이 없으면 앱 기본값 PASSPORT_START_DATE(6/22) 폴백.
      // date는 'yyyy-MM-dd' 문자열이라 사전식 비교로 안전하게 날짜 비교됨.
      const passportStart = (studentRow as { passport_start_date: string | null } | null)?.passport_start_date ?? PASSPORT_START_DATE
      const passportClasses = classes.filter(c => c.date >= passportStart).length
      return {
        totalClasses: classes.length,
        passportClasses,
        totalFeedbacks: fbList.length,
        monthlyData,
        expressions,
        homeworkCount,
        recentFeedbacks: fbList.slice(-5).reverse(),
      }
    },
  })
}
