'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarDays, Users, CreditCard, BookOpen,
  TrendingUp, Mail, MessageSquare, ClipboardList,
  CheckCircle2, ChevronRight, Bot, Zap, History,
} from 'lucide-react'
import { useTodayBriefing } from '@/lib/queries/useTodayBriefing'
import { useStudents } from '@/lib/queries/useStudents'
import { useMonthPayments } from '@/lib/queries/usePayments'
import { useAllStudentMessages } from '@/lib/queries/useMessages'
import { useAllChangeRequests } from '@/lib/queries/useChangeRequests'
import { useAllSessionClasses } from '@/lib/queries/useClasses'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  postponed:  'bg-gray-100 text-gray-500',
  makeup:     'bg-amber-100 text-amber-700',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  completed: '완료',
  cancelled: '취소',
  postponed: '연기',
  makeup:    '보강',
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour >= 12 ? '오후' : '오전'} ${hour > 12 ? hour - 12 : hour}:${m}`
}

function SectionCard({
  href, icon: Icon, title, children, badge,
}: {
  href: string
  icon: React.ElementType
  title: string
  children: React.ReactNode
  badge?: number
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <Link
        href={href}
        className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </Link>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export default function DashboardPage() {
  // 클라이언트 로컬 시간 기준 (SSR UTC 불일치 방지)
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => { setNow(new Date()) }, [])
  const yearMonth = format(now, 'yyyy-MM')

  const { data: todayClasses = [], isLoading: loadingToday } = useTodayBriefing()
  const { data: students = [] } = useStudents()
  const { data: payments = [] } = useMonthPayments(yearMonth)
  const { data: messageThreads = [] } = useAllStudentMessages()
  const { data: changeRequests = [] } = useAllChangeRequests()
  const { data: allClasses = [] } = useAllSessionClasses()

  const paymentStats = useMemo(() => ({
    unpaid:  payments.filter(p => p.status === '미납').length,
    partial: payments.filter(p => p.status === '부분납').length,
    paid:    payments.filter(p => p.status === '완납').length,
  }), [payments])

  const totalUnread = messageThreads.reduce((s, t) => s + t.unread, 0)
  const pendingRequests = changeRequests.filter(r => r.status === 'pending')
  const completedToday = todayClasses.filter(c => c.status === 'completed').length
  const scheduledToday = todayClasses.filter(c => c.status === 'scheduled').length
  const thisMonthCompleted = allClasses.filter(
    c => c.status === 'completed' && c.date.startsWith(yearMonth)
  ).length

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* 헤더 */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {format(now, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">대시보드</h1>
      </div>

      {/* KPI 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-indigo-600 rounded-xl p-4 text-white">
          <p className="text-xs text-indigo-200 font-medium">오늘 수업</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">
            {todayClasses.length}
            <span className="text-base font-normal text-indigo-200">회</span>
          </p>
          <p className="text-xs text-indigo-200 mt-1">완료 {completedToday} · 예정 {scheduledToday}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">활성 학생</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-900">
            {students.length}
            <span className="text-base font-normal text-gray-400">명</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">이번 달 {thisMonthCompleted}회 완료</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">미납 현황</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-900">
            {paymentStats.unpaid + paymentStats.partial}
            <span className="text-base font-normal text-gray-400">건</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">미납 {paymentStats.unpaid} · 부분납 {paymentStats.partial}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">미확인 알림</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-900">
            {totalUnread + pendingRequests.length}
            <span className="text-base font-normal text-gray-400">건</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">문의 {totalUnread} · 변경요청 {pendingRequests.length}</p>
        </div>
      </div>

      {/* 섹션 카드 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* 빠른 실행 */}
        <SectionCard href="/schedule" icon={Zap} title="빠른 실행">
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/schedule', label: '수업 추가' },
              { href: '/students', label: '학생 관리' },
              { href: '/materials', label: '자료 업로드' },
              { href: '/feedback', label: '피드백 작성' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center justify-center rounded-lg bg-gray-50 px-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* GPT 바로가기 */}
        <SectionCard href="/feedback" icon={Bot} title="GPT 바로가기">
          <div className="space-y-2">
            <Link href="/feedback" className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50 px-3 py-3 text-sm font-medium text-violet-700">
              수업 피드백 AI 다듬기
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/reports" className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3 text-sm font-medium text-indigo-700">
              성장리포트 AI 생성
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </SectionCard>

        {/* 수업 일정 */}
        <SectionCard href="/schedule" icon={CalendarDays} title="수업 일정">
          {loadingToday ? (
            <p className="text-sm text-gray-400">로딩 중...</p>
          ) : todayClasses.length === 0 ? (
            <p className="text-sm text-gray-400">오늘 예정된 수업이 없어요</p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map(cls => (
                <div key={cls.id} className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cls.studentColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cls.studentName}</p>
                    <p className="text-xs text-gray-400">{formatTime(cls.start_time)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[cls.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[cls.status] ?? cls.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 학생 관리 */}
        <SectionCard href="/students" icon={Users} title="학생 관리">
          {students.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 학생이 없어요</p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold"
                    style={{ backgroundColor: s.color ?? '#6366f1' }}
                  >
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    {s.subjects && s.subjects.length > 0 && (
                      <p className="text-xs text-gray-400 truncate">{s.subjects.join(' · ')}</p>
                    )}
                  </div>
                </div>
              ))}
              {students.length > 5 && (
                <p className="text-xs text-gray-400 text-right">외 {students.length - 5}명</p>
              )}
            </div>
          )}
        </SectionCard>

        {/* 결제/정산 */}
        <SectionCard href="/payments" icon={CreditCard} title="결제/정산">
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">{yearMonth.replace('-', '년 ')}월 결제 정보 없음</p>
          ) : (
            <div className="space-y-2">
              {payments.filter(p => p.status !== '완납').slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 truncate flex-1">{p.student?.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${
                    p.status === '미납' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
              {paymentStats.unpaid + paymentStats.partial === 0 && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-sm font-medium">이번 달 전원 완납</p>
                </div>
              )}
              <div className="pt-1 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                <span>완납 {paymentStats.paid}명</span>
                <span>미납/부분납 {paymentStats.unpaid + paymentStats.partial}명</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* 수업 피드백 */}
        <SectionCard href="/feedback" icon={Mail} title="수업 피드백">
          <div className="space-y-2">
            {students.slice(0, 4).map(s => {
              const todayCls = todayClasses.find(c => c.student_id === s.id && c.status === 'completed')
              return (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                  <p className="text-sm text-gray-700 flex-1 truncate">{s.name}</p>
                  {todayCls
                    ? <span className="text-xs text-indigo-500 font-medium">작성 필요</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </div>
              )
            })}
            {completedToday > 0 && (
              <p className="text-xs text-amber-500 font-medium pt-1">
                오늘 완료 수업 {completedToday}건 피드백 확인
              </p>
            )}
            {students.length === 0 && <p className="text-sm text-gray-400">학생을 먼저 등록해 주세요</p>}
          </div>
        </SectionCard>

        {/* 성장리포트 */}
        <SectionCard href="/reports" icon={TrendingUp} title="성장리포트">
          {students.length === 0 ? (
            <p className="text-sm text-gray-400">학생을 먼저 등록해 주세요</p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                  <p className="text-sm text-gray-700 flex-1 truncate">{s.name}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 수업 자료 */}
        <SectionCard href="/materials" icon={BookOpen} title="수업 자료">
          {students.length === 0 ? (
            <p className="text-sm text-gray-400">학생을 먼저 등록해 주세요</p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                  <p className="text-sm text-gray-700 flex-1 truncate">{s.name}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 최근 활동 */}
        <SectionCard href="/messages" icon={History} title="최근 활동" badge={totalUnread + pendingRequests.length}>
          <div className="space-y-2">
            {messageThreads.slice(0, 2).map(t => (
              <div key={`message-${t.student.id}`} className="flex items-start gap-2.5">
                <div
                  className="mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: t.student.color ?? '#6366f1' }}
                >
                  {t.student.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{t.student.name} 문의</p>
                  <p className="truncate text-xs text-gray-400">{t.lastMsg.body}</p>
                </div>
              </div>
            ))}
            {pendingRequests.slice(0, 2).map(r => (
              <div key={`request-${r.id}`} className="flex items-start gap-2.5">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{r.students?.name} 변경요청</p>
                  <p className="truncate text-xs text-gray-400">
                    {r.request_type === 'reschedule' ? '일정 변경'
                      : r.request_type === 'cancel' ? '수업 취소' : '보강 요청'}
                  </p>
                </div>
              </div>
            ))}
            {messageThreads.length === 0 && pendingRequests.length === 0 && (
              <p className="text-sm text-gray-400">최근 확인할 활동이 없어요</p>
            )}
          </div>
        </SectionCard>

        {/* 문의함 */}
        <SectionCard href="/messages" icon={MessageSquare} title="문의함" badge={totalUnread}>
          {messageThreads.length === 0 ? (
            <p className="text-sm text-gray-400">새 문의가 없어요</p>
          ) : (
            <div className="space-y-2">
              {messageThreads.slice(0, 4).map(t => (
                <div key={t.student.id} className="flex items-start gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold mt-0.5"
                    style={{ backgroundColor: t.student.color ?? '#6366f1' }}
                  >
                    {t.student.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.student.name}</p>
                      {t.unread > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{t.lastMsg.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 변경요청 */}
        <SectionCard href="/requests" icon={ClipboardList} title="변경요청" badge={pendingRequests.length}>
          {changeRequests.length === 0 ? (
            <p className="text-sm text-gray-400">변경 요청이 없어요</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 bg-amber-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.students?.name}</p>
                    <p className="text-xs text-gray-400">
                      {r.request_type === 'reschedule' ? '일정 변경'
                        : r.request_type === 'cancel' ? '수업 취소' : '보강 요청'}
                      {r.classes && ` · ${r.classes.date}`}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    검토 중
                  </span>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-sm font-medium">모든 요청 처리 완료</p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
