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
import type { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']

const SUBJECT_COLORS: Record<string, string> = {
  영어: 'bg-green-100 text-green-700',
  중국어: 'bg-red-100 text-red-700',
}

const CLASS_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예정', color: 'text-blue-600 bg-blue-50' },
  completed: { label: '완료', color: 'text-green-600 bg-green-50' },
  cancelled: { label: '취소', color: 'text-red-500 bg-red-50' },
  postponed: { label: '연기', color: 'text-gray-500 bg-gray-100' },
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
      <p className="text-sm text-gray-400">{message}</p>
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
        <p className="text-gray-400">학생 정보를 찾을 수 없어요</p>
        <Link href="/students" className="mt-3 text-sm text-indigo-600 hover:underline">목록으로 돌아가기</Link>
      </div>
    )
  }

  const completedCount = studentClasses.filter(c => c.status === 'completed').length
  const scheduledCount = studentClasses.filter(c => c.status === 'scheduled').length

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-5">

      {/* 뒤로가기 */}
      <Link href="/students" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        학생 목록
      </Link>

      {/* 학생 헤더 카드 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
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
                <h1 className="text-lg font-bold text-gray-900">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {student.grade && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{student.grade}</span>
                  )}
                  {student.school && (
                    <span className="text-xs text-gray-500">{student.school}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                수정
              </button>
            </div>

            {student.subjects && student.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {student.subjects.map(s => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[s] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {(student.phone || student.parent_phone) && (
              <p className="mt-2 text-xs text-gray-400">
                {student.phone && `📱 ${student.phone}`}
                {student.phone && student.parent_phone && '  ·  '}
                {student.parent_phone && `👨‍👩‍👧 ${student.parent_phone}`}
              </p>
            )}

            {student.schedule_note && (
              <p className="mt-1.5 text-xs text-indigo-600 font-medium">🕐 {student.schedule_note}</p>
            )}
          </div>
        </div>

        {/* 미니 KPI */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">완료 수업</p>
          </div>
          <div className="text-center border-x border-gray-50">
            <p className="text-xl font-bold text-gray-900">{scheduledCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">예정 수업</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{reports.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">성장리포트</p>
          </div>
        </div>

        {!!student.hourly_rate && (
          <p className="mt-3 text-xs text-gray-500 text-right">한달 {student.hourly_rate.toLocaleString()}원</p>
        )}
      </div>

      {/* 탭 네비 */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* 수업이력 */}
        {tab === 'classes' && (
          studentClasses.length === 0 ? <EmptyState message="수업 이력이 없어요" /> : (
            <div className="divide-y divide-gray-50">
              {studentClasses.map(cls => {
                const st = CLASS_STATUS[cls.status] ?? CLASS_STATUS.scheduled
                return (
                  <div key={cls.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {format(new Date(cls.date), 'M월 d일 (EEE)', { locale: ko })}
                      </p>
                      <p className="text-xs text-gray-400">{formatTime(cls.start_time)} – {formatTime(cls.end_time)}</p>
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
                    <p className="text-sm font-medium text-gray-800">{p.year_month.replace('-', '년 ')}월</p>
                    <p className="text-xs text-gray-400">
                      {p.completed_sessions}/{p.planned_sessions}회
                      {p.payment_method && ` · ${p.payment_method}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{p.amount.toLocaleString()}원</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === '완납' ? 'bg-green-100 text-green-700'
                        : p.status === '미납' ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
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
                    <p className="text-sm font-semibold text-gray-800">
                      {f.classes?.date
                        ? format(new Date(f.classes.date), 'M월 d일 (EEE)', { locale: ko })
                        : '날짜 미상'}
                    </p>
                    {f.classes?.start_time && (
                      <p className="text-xs text-gray-400">{formatTime(f.classes.start_time)}</p>
                    )}
                  </div>
                  {f.topic && <p className="text-xs text-indigo-600 font-medium mb-1">📌 {f.topic}</p>}
                  {f.good_points && <p className="text-xs text-gray-600 mb-1">✅ {f.good_points}</p>}
                  {f.practice_needed && <p className="text-xs text-gray-600 mb-1">🔧 {f.practice_needed}</p>}
                  {f.parent_summary && (
                    <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg">{f.parent_summary}</p>
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
                    <p className="text-sm font-semibold text-gray-800">{r.period} 리포트</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'published' ? 'bg-green-100 text-green-700'
                        : r.status === 'saved' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.status === 'published' ? '공개' : r.status === 'saved' ? '저장됨' : '초안'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{r.lesson_count}회 수업 기준</p>
                  <div className="grid grid-cols-5 gap-2">
                    {([
                      { label: '표현', score: r.score_expression },
                      { label: '이해', score: r.score_comprehension },
                      { label: '유창', score: r.score_reading_fluency },
                      { label: '문장', score: r.score_sentence_building },
                      { label: '의욕', score: r.score_willingness },
                    ] as { label: string; score: number | null }[]).map(({ label, score }) => score != null && (
                      <div key={label} className="text-center">
                        <div className="text-sm font-bold text-indigo-600">{score}</div>
                        <div className="h-1 bg-gray-100 rounded-full mt-0.5">
                          <div className="h-1 bg-indigo-400 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  {r.teacher_comment && (
                    <p className="text-xs text-gray-600 mt-3 p-2.5 bg-indigo-50 rounded-lg">{r.teacher_comment}</p>
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400">
                      {m.created_at ? format(new Date(m.created_at), 'M월 d일', { locale: ko }) : ''}
                      {m.file_type && ` · ${m.file_type.toUpperCase()}`}
                    </p>
                  </div>
                  {m.file_url && (
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-indigo-600 hover:underline px-2 py-1 rounded hover:bg-indigo-50"
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
