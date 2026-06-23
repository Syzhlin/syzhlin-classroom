'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft, CalendarDays, CreditCard,
  MessageSquare, TrendingUp, BookOpen, Edit2,
  CheckCircle2, Clock, XCircle, RotateCcw, Wrench,
} from 'lucide-react'
import { useStudents } from '@/lib/queries/useStudents'
import { useAllSessionClasses } from '@/lib/queries/useClasses'
import { useStudentFeedbacks } from '@/lib/queries/useFeedback'
import { useStudentReports } from '@/lib/queries/useGrowthReports'
import { useStudentMaterials } from '@/lib/queries/useMaterials'
import { useStudentPayments } from '@/lib/queries/usePayments'
import StudentFormDialog from '@/components/students/StudentFormDialog'
import AccountLinkCard from '@/components/students/AccountLinkCard'
import type { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']

const SUBJECT_COLORS: Record<string, string> = {
  영어: 'bg-[var(--sz-sage-pale)] text-[var(--sz-sage)]',
  중국어: 'bg-[var(--sz-pink-pale)] text-[var(--sz-pink-soft)]',
}

const CLASS_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예정', color: 'text-blue-600 bg-blue-50' },
  completed: { label: '완료', color: 'text-green-600 bg-green-50' },
  cancelled: { label: '취소', color: 'text-red-500 bg-red-50' },
  postponed: { label: '연기', color: 'text-[var(--sz-text-muted)] bg-[rgba(175,196,216,0.1)]' },
  makeup:    { label: '보강', color: 'text-amber-600 bg-amber-50' },
}

const TABS = [
  { key: 'classes',   label: '수업이력',  icon: CalendarDays },
  { key: 'payments',  label: '결제',      icon: CreditCard },
  { key: 'feedback',  label: '피드백',    icon: MessageSquare },
  { key: 'reports',   label: '성장리포트', icon: TrendingUp },
  { key: 'materials', label: '자료',      icon: BookOpen },
] as const

type TabKey = typeof TABS[number]['key']

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour >= 12 ? '오후' : '오전'} ${hour > 12 ? hour - 12 : hour}:${m}`
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-[var(--sz-text-muted)] opacity-70">{message}</p>
    </div>
  )
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab] = useState<TabKey>('classes')
  const [editOpen, setEditOpen] = useState(false)

  const { data: students = [] } = useStudents()
  const student = students.find(s => s.id === id) ?? null

  const { data: allClasses = [] } = useAllSessionClasses()
  const studentClasses = allClasses
    .filter(c => c.student_id === id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time))

  const { data: feedbacks = [] } = useStudentFeedbacks(id)
  const { data: reports = [] } = useStudentReports(id)
  const { data: materials = [] } = useStudentMaterials(id)
  const { data: payments = [] } = useStudentPayments(id)

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-[var(--sz-text-muted)] opacity-70">학생 정보를 찾을 수 없어요</p>
        <Link href="/students" className="mt-3 text-sm text-[var(--sz-blue-soft)] hover:underline">목록으로 돌아가기</Link>
      </div>
    )
  }

  const completedCount = studentClasses.filter(c => c.status === 'completed').length
  const scheduledCount = studentClasses.filter(c => c.status === 'scheduled').length

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-5">

      {/* 뒤로가기 */}
      <Link href="/students" className="inline-flex items-center gap-1 text-sm text-[var(--sz-text-muted)] hover:text-[var(--sz-text-deep)] transition-colors">
        <ChevronLeft className="w-4 h-4" />
        학생 목록
      </Link>

      {/* 학생 헤더 카드 */}
      <div className="sz-widget rounded-2xl shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold shadow-sm"
            style={{ backgroundColor: student.color ?? '#6366f1' }}
          >
            {student.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-[var(--sz-text-deep)]">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {student.grade && (
                    <span className="text-xs text-[var(--sz-text-muted)] bg-[rgba(175,196,216,0.1)] px-2 py-0.5 rounded-full">{student.grade}</span>
                  )}
                  {student.school && (
                    <span className="text-xs text-[var(--sz-text-muted)]">{student.school}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--sz-text-muted)] border border-[rgba(175,196,216,0.3)] rounded-lg hover:bg-[var(--sz-bg-pastel)] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                수정
              </button>
            </div>

            {student.subjects && student.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {student.subjects.map(s => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[s] ?? 'bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)]'}`}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {(student.phone || student.parent_phone) && (
              <p className="mt-2 text-xs text-[var(--sz-text-muted)] opacity-70">
                {student.phone && `📱 ${student.phone}`}
                {student.phone && student.parent_phone && '  ·  '}
                {student.parent_phone && `👨‍👩‍👧 ${student.parent_phone}`}
              </p>
            )}

            {student.schedule_note && (
              <p className="mt-1.5 text-xs text-[var(--sz-blue-soft)] font-medium">🕐 {student.schedule_note}</p>
            )}
          </div>
        </div>

        {/* 미니 KPI */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-xl font-bold text-[var(--sz-text-deep)]">{completedCount}</p>
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">완료 수업</p>
          </div>
          <div className="text-center border-x border-gray-50">
            <p className="text-xl font-bold text-[var(--sz-text-deep)]">{scheduledCount}</p>
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">예정 수업</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[var(--sz-text-deep)]">{reports.length}</p>
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">성장리포트</p>
          </div>
        </div>

        {!!student.hourly_rate && (
          <p className="mt-3 text-xs text-[var(--sz-text-muted)] text-right">한달 {student.hourly_rate.toLocaleString()}원</p>
        )}
      </div>

      {/* 계정 연결 */}
      <AccountLinkCard studentId={student.id} studentName={student.name} />

      {/* 탭 네비 */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key
                ? 'bg-[var(--sz-blue-soft)] text-white'
                : 'text-[var(--sz-text-muted)] hover:text-[var(--sz-text-deep)] hover:bg-[rgba(175,196,216,0.1)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="sz-widget rounded-2xl shadow-sm overflow-hidden">

        {/* 수업이력 */}
        {tab === 'classes' && (
          studentClasses.length === 0 ? <EmptyState message="수업 이력이 없어요" /> : (
            <div className="divide-y divide-gray-50">
              {studentClasses.map(cls => {
                const st = CLASS_STATUS[cls.status] ?? CLASS_STATUS.scheduled
                return (
                  <div key={cls.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--sz-text-deep)]">
                        {format(new Date(cls.date), 'M월 d일 (EEE)', { locale: ko })}
                      </p>
                      <p className="text-xs text-[var(--sz-text-muted)] opacity-70">{formatTime(cls.start_time)} – {formatTime(cls.end_time)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* 결제 */}
        {tab === 'payments' && (
          payments.length === 0 ? <EmptyState message="결제 이력이 없어요" /> : (
            <div className="divide-y divide-gray-50">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-[var(--sz-text-deep)]">{p.year_month.replace('-', '년 ')}월</p>
                    <p className="text-xs text-[var(--sz-text-muted)] opacity-70">
                      {p.completed_sessions}/{p.planned_sessions}회
                      {p.payment_method && ` · ${p.payment_method}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--sz-text-deep)]">{p.amount.toLocaleString()}원</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === '완납' ? 'bg-[var(--sz-sage-pale)] text-[var(--sz-sage)]'
                        : p.status === '미납' ? 'bg-[var(--sz-pink-pale)] text-[var(--sz-pink-soft)]'
                        : 'bg-[var(--sz-peach-pale)] text-[var(--sz-peach)]'
                    }`}>
                      {p.status === '미납' ? '결제 필요' : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 피드백 */}
        {tab === 'feedback' && (
          feedbacks.length === 0 ? <EmptyState message="작성된 피드백이 없어요" /> : (
            <div className="divide-y divide-gray-50">
              {feedbacks.map((f: any) => (
                <div key={f.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-[var(--sz-text-deep)]">
                      {f.classes?.date
                        ? format(new Date(f.classes.date), 'M월 d일 (EEE)', { locale: ko })
                        : '날짜 미상'}
                    </p>
                    {f.classes?.start_time && (
                      <p className="text-xs text-[var(--sz-text-muted)] opacity-70">{formatTime(f.classes.start_time)}</p>
                    )}
                  </div>
                  {f.topic && <p className="text-xs text-[var(--sz-blue-soft)] font-medium mb-1">📌 {f.topic}</p>}
                  {f.good_points && <p className="text-xs text-[var(--sz-text-muted)] mb-1">✅ {f.good_points}</p>}
                  {f.practice_needed && <p className="text-xs text-[var(--sz-text-muted)] mb-1">🔧 {f.practice_needed}</p>}
                  {f.parent_summary && (
                    <p className="text-xs text-[var(--sz-text-muted)] mt-2 p-2 bg-[var(--sz-bg-pastel)] rounded-lg">{f.parent_summary}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* 성장리포트 */}
        {tab === 'reports' && (
          reports.length === 0 ? <EmptyState message="작성된 성장리포트가 없어요" /> : (
            <div className="divide-y divide-gray-50">
              {reports.map(r => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-[var(--sz-text-deep)]">{r.period} 리포트</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'published' ? 'bg-[var(--sz-sage-pale)] text-[var(--sz-sage)]'
                        : r.status === 'saved' ? 'bg-[var(--sz-blue-pale)] text-[var(--sz-blue-soft)]'
                        : 'bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)]'
                    }`}>
                      {r.status === 'published' ? '공개' : r.status === 'saved' ? '저장됨' : '초안'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mb-3">{r.lesson_count}회 수업 기준</p>
                  <div className="grid grid-cols-5 gap-2">
                    {([
                      { label: '표현', score: r.score_expression },
                      { label: '이해', score: r.score_comprehension },
                      { label: '유창', score: r.score_reading_fluency },
                      { label: '문장', score: r.score_sentence_building },
                      { label: '의욕', score: r.score_willingness },
                    ] as { label: string; score: number | null }[]).map(({ label, score }) => score != null && (
                      <div key={label} className="text-center">
                        <div className="text-sm font-bold text-[var(--sz-blue-soft)]">{score}</div>
                        <div className="h-1 bg-[rgba(175,196,216,0.1)] rounded-full mt-0.5">
                          <div className="h-1 bg-indigo-400 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
                        </div>
                        <div className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  {r.teacher_comment && (
                    <p className="text-xs text-[var(--sz-text-muted)] mt-3 p-2.5 bg-[var(--sz-blue-pale)] rounded-lg">{r.teacher_comment}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* 자료 */}
        {tab === 'materials' && (
          materials.length === 0 ? <EmptyState message="등록된 수업 자료가 없어요" /> : (
            <div className="divide-y divide-gray-50">
              {materials.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--sz-blue-pale)] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--sz-text-deep)] truncate">{m.title}</p>
                    <p className="text-xs text-[var(--sz-text-muted)] opacity-70">
                      {m.created_at ? format(new Date(m.created_at), 'M월 d일', { locale: ko }) : ''}
                      {m.file_type && ` · ${m.file_type.toUpperCase()}`}
                    </p>
                  </div>
                  {m.file_url && (
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-[var(--sz-blue-soft)] hover:underline px-2 py-1 rounded hover:bg-[var(--sz-blue-pale)]"
                    >
                      열기
                    </a>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <StudentFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        student={student}
      />
    </div>
  )
}
