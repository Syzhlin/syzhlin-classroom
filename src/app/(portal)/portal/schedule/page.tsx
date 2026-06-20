'use client'

import { useState, useMemo } from 'react'
import {
  parseISO, isBefore, startOfDay, format, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth,
  isToday, isBefore as dfIsBefore,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalClasses } from '@/lib/queries/useClasses'
import { useSubmitChangeRequest } from '@/lib/queries/useChangeRequests'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예정', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-600' },
  makeup:    { label: '보강', color: 'bg-amber-100 text-amber-700' },
}

const DAY_LABELS  = ['일', '월', '화', '수', '목', '금', '토']
const TYPE_LABELS: Record<'reschedule' | 'cancel' | 'makeup', string> = {
  reschedule: '일정 변경',
  cancel:     '수업 취소',
  makeup:     '보강 요청',
}

// 시간 슬롯 (오전 9시 ~ 오후 10시, 30분 단위)
const TIME_SLOTS: string[] = []
for (let h = 9; h <= 22; h++) {
  TIME_SLOTS.push(`${h}:00`)
  if (h < 22) TIME_SLOTS.push(`${h}:30`)
}

function formatTimeSlot(slot: string) {
  const [h] = slot.split(':').map(Number)
  const min = slot.split(':')[1]
  return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h}:${min}`
}

function formatClassDate(dateStr: string) {
  const d = parseISO(dateStr)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_LABELS[d.getDay()]})`
}

type ClassItem = {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  students?: { color?: string }
}

// ── 달력 + 시간 선택 ─────────────────────────────────────────
function DateTimePicker({
  selectedDates, selectedTimes, onToggleDate, onToggleTime,
}: {
  selectedDates: string[]
  selectedTimes: string[]
  onToggleDate: (d: string) => void
  onToggleTime: (t: string) => void
}) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const today = startOfDay(new Date())

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end   = endOfMonth(viewMonth)
    const cells: (Date | null)[] = []
    for (let i = 0; i < getDay(start); i++) cells.push(null)
    eachDayOfInterval({ start, end }).forEach(d => cells.push(d))
    return cells
  }, [viewMonth])

  return (
    <div className="space-y-4">
      {/* 달력 */}
      <div>
        <p className="text-xs text-gray-500 mb-2">희망 날짜 <span className="text-gray-400">(복수 선택 가능)</span></p>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="p-1 rounded-lg hover:bg-gray-200">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {format(viewMonth, 'yyyy년 M월', { locale: ko })}
            </span>
            <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="p-1 rounded-lg hover:bg-gray-200">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={d} className={`text-center text-[10px] font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, i) => {
              if (!d) return <div key={`e-${i}`} />
              const ds = format(d, 'yyyy-MM-dd')
              const isPast = dfIsBefore(d, today)
              const isSelected = selectedDates.includes(ds)
              const isInMonth = isSameMonth(d, viewMonth)
              const dow = getDay(d)
              return (
                <button
                  key={ds}
                  disabled={isPast}
                  onClick={() => onToggleDate(ds)}
                  className={[
                    'h-8 w-full rounded-lg text-xs font-medium transition-colors',
                    isPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-50',
                    isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700' : '',
                    !isSelected && !isPast && dow === 0 ? 'text-red-500' : '',
                    !isSelected && !isPast && dow === 6 ? 'text-blue-500' : '',
                    !isSelected && !isPast && dow !== 0 && dow !== 6 ? 'text-gray-700' : '',
                    !isInMonth ? 'opacity-40' : '',
                    isToday(d) && !isSelected ? 'ring-1 ring-inset ring-indigo-300' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
        {selectedDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedDates.map(ds => (
              <span key={ds} className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                {format(parseISO(ds), 'M/d(EEE)', { locale: ko })}
                <button onClick={() => onToggleDate(ds)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 시간 토글 */}
      <div>
        <p className="text-xs text-gray-500 mb-2">희망 시간 <span className="text-gray-400">(복수 선택 가능)</span></p>
        <div className="grid grid-cols-4 gap-1.5">
          {TIME_SLOTS.map(slot => {
            const isSelected = selectedTimes.includes(slot)
            return (
              <button
                key={slot}
                onClick={() => onToggleTime(slot)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {formatTimeSlot(slot)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 변경요청 바텀 시트 ────────────────────────────────────────
function ChangeRequestSheet({ cls, studentId, onClose }: {
  cls: ClassItem
  studentId: string
  onClose: () => void
}) {
  const submit = useSubmitChangeRequest()
  const [type, setType] = useState<'reschedule' | 'cancel' | 'makeup'>('reschedule')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  function toggleDate(d: string) {
    setSelectedDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleTime(t: string) {
    setSelectedTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function buildPreferredDates() {
    if (!selectedDates.length && !selectedTimes.length) return undefined
    const dates = selectedDates.map(ds => format(parseISO(ds), 'M/d(EEE)', { locale: ko })).join(', ')
    const times = selectedTimes.map(formatTimeSlot).join(', ')
    if (dates && times) return `${dates} / ${times}`
    return dates || times
  }

  async function handleSubmit() {
    await submit.mutateAsync({
      student_id: studentId,
      class_id: cls.id,
      request_type: type,
      preferred_dates: buildPreferredDates(),
      reason: reason || undefined,
    })
    setDone(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div
        className="relative bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto pb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">수업 변경 요청</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 대상 수업 */}
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-indigo-800">{formatClassDate(cls.date)}</p>
            <p className="text-xs text-indigo-600 mt-0.5">{cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}</p>
          </div>

          {/* 요청 유형 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">요청 유형</p>
            <div className="flex gap-2">
              {(['reschedule', 'cancel', 'makeup'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                    type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600'
                  }`}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 달력 + 시간 (취소 제외) */}
          {type !== 'cancel' && (
            <DateTimePicker
              selectedDates={selectedDates}
              selectedTimes={selectedTimes}
              onToggleDate={toggleDate}
              onToggleTime={toggleTime}
            />
          )}

          {/* 사유 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">사유 <span className="text-gray-400">(선택)</span></p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="변경이 필요한 이유를 알려주세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl">
              취소
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submit.isPending || done}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                done ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white disabled:opacity-60'
              }`}
            >
              {done
                ? <span className="flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> 제출 완료</span>
                : submit.isPending ? '제출 중...' : '요청 제출'
              }
            </button>
          </div>
        </div>

        {/* 확인 팝업 (바텀 시트 위에 오버레이) */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/30 rounded-t-2xl flex items-center justify-center p-6 z-10">
            <div className="bg-white rounded-2xl p-6 w-full shadow-xl space-y-4">
              <div className="text-center space-y-1">
                <p className="text-2xl">📋</p>
                <p className="text-base font-bold text-gray-900">변경을 요청하시겠습니까?</p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-indigo-600">{TYPE_LABELS[type]}</span> 요청이 선생님께 전달됩니다
                </p>
                {buildPreferredDates() && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mt-2 text-left">
                    📅 {buildPreferredDates()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl"
                >
                  돌아가기
                </button>
                <button
                  onClick={async () => { setShowConfirm(false); await handleSubmit() }}
                  disabled={submit.isPending}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-60"
                >
                  {submit.isPending ? '제출 중...' : '네, 요청할게요'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function PortalSchedulePage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { selectedStudentId: linkedId } = usePortalStudent()
  const { data: classes, isLoading: classesLoading } = usePortalClasses(linkedId)
  const [showPast, setShowPast] = useState(false)
  const [requestTarget, setRequestTarget] = useState<ClassItem | null>(null)

  const role = profile?.role
  const canRequest = role === 'parent' || role === 'adult_learner'

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!linkedId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="font-semibold text-gray-800 text-lg">계정 연결 중</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          선생님이 계정을 연결 중입니다.<br />연결이 완료되면 수업 일정을 확인할 수 있어요.
        </p>
      </div>
    )
  }

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const today = startOfDay(new Date())
  const upcoming = (classes ?? []).filter(c => !isBefore(parseISO(c.date), today))
  const past = (classes ?? []).filter(c => isBefore(parseISO(c.date), today)).slice(-5).reverse()

  function groupByDate(items: typeof upcoming) {
    const map: Record<string, typeof upcoming> = {}
    for (const item of items) {
      if (!map[item.date]) map[item.date] = []
      map[item.date].push(item)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }

  function ClassRow({ cls, showRequest }: { cls: ClassItem; showRequest: boolean }) {
    const statusInfo = STATUS_LABELS[cls.status] ?? { label: cls.status, color: 'bg-gray-100 text-gray-600' }
    const studentColor = cls.students?.color ?? '#6366f1'
    return (
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: studentColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}</p>
          {cls.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{cls.notes}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {showRequest && cls.status === 'scheduled' && (
            <button
              onClick={() => setRequestTarget(cls)}
              className="text-xs text-indigo-500 border border-indigo-200 px-2.5 py-0.5 rounded-full hover:bg-indigo-50 transition-colors"
            >
              변경요청
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">다가오는 수업</h2>
        {groupByDate(upcoming).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">
            예정된 수업이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {groupByDate(upcoming).map(([date, items]) => (
              <div key={date} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">{formatClassDate(date)}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(cls => <ClassRow key={cls.id} cls={cls as ClassItem} showRequest={canRequest} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button
          onClick={() => setShowPast(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3"
        >
          지난 수업
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${showPast ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showPast && (
          groupByDate(past).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">지난 수업이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {groupByDate(past).map(([date, items]) => (
                <div key={date} className="bg-white rounded-xl border border-gray-100 overflow-hidden opacity-70">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-600">{formatClassDate(date)}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(cls => <ClassRow key={cls.id} cls={cls as ClassItem} showRequest={false} />)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {requestTarget && linkedId && (
        <ChangeRequestSheet cls={requestTarget} studentId={linkedId} onClose={() => setRequestTarget(null)} />
      )}
    </div>
  )
}
