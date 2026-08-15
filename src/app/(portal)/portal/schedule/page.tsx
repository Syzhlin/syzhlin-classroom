'use client'

import { useState, useMemo } from 'react'
import {
  parseISO, isBefore, startOfDay, format, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth,
  isToday, isBefore as dfIsBefore, isSameDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalClasses } from '@/lib/queries/useClasses'
import { useSubmitChangeRequest } from '@/lib/queries/useChangeRequests'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예정', color: '' },
  completed: { label: '완료', color: '' },
  cancelled: { label: '취소', color: '' },
  makeup:    { label: '보강', color: '' },
}

const DAY_LABELS  = ['일', '월', '화', '수', '목', '금', '토']
const TYPE_LABELS: Record<'reschedule' | 'cancel' | 'makeup', string> = {
  reschedule: '일정 변경',
  cancel:     '수업 취소',
  makeup:     '보강 요청',
}

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

// ── 읽기 전용 월간 캘린더 ────────────────────────────────────
function MonthlyCalendar({
  classes,
  onDayClick,
  selectedDate,
}: {
  classes: ClassItem[]
  onDayClick: (date: string) => void
  selectedDate: string | null
}) {
  const [viewMonth, setViewMonth] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end   = endOfMonth(viewMonth)
    const cells: (Date | null)[] = []
    for (let i = 0; i < getDay(start); i++) cells.push(null)
    eachDayOfInterval({ start, end }).forEach(d => cells.push(d))
    return cells
  }, [viewMonth])

  // 날짜별 수업 맵
  const classDateMap = useMemo(() => {
    const map: Record<string, ClassItem[]> = {}
    for (const cls of classes) {
      if (!map[cls.date]) map[cls.date] = []
      map[cls.date].push(cls)
    }
    return map
  }, [classes])

  return (
    <div style={{ backgroundColor: '#FFFDF8', boxShadow: '7px 7px 20px rgba(100,88,65,0.09), -4px -4px 12px rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '24px', padding: '16px' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(m => subMonths(m, 1))}
          className="p-1.5 rounded-xl transition-colors" style={{backgroundColor: "transparent"}} onMouseEnter={e=>(e.currentTarget.style.backgroundColor="var(--sz-blue-pale)")} onMouseLeave={e=>(e.currentTarget.style.backgroundColor="transparent")}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-900">
          {format(viewMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <button
          onClick={() => setViewMonth(m => addMonths(m, 1))}
          className="p-1.5 rounded-xl transition-colors" style={{backgroundColor: "transparent"}} onMouseEnter={e=>(e.currentTarget.style.backgroundColor="var(--sz-blue-pale)")} onMouseLeave={e=>(e.currentTarget.style.backgroundColor="transparent")}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-semibold py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />
          const ds = format(d, 'yyyy-MM-dd')
          const hasClass = !!classDateMap[ds]
          const clsItems = classDateMap[ds] ?? []
          const isSelected = selectedDate === ds
          const isTodayDate = isToday(d)
          const inMonth = isSameMonth(d, viewMonth)
          const dow = getDay(d)

          // 수업 상태 색상 (첫 번째 수업 기준)
          const dotColor = clsItems[0]?.students?.color ?? '#6366f1'

          return (
            <button
              key={ds}
              onClick={() => hasClass && onDayClick(ds)}
              className={[
                'relative flex flex-col items-center justify-center h-10 w-full rounded-xl text-xs font-medium transition-colors',
                hasClass ? 'cursor-pointer hover:bg-[var(--sz-blue-pale)]' : 'cursor-default',
                isSelected ? 'text-white' : '',
                !isSelected && isTodayDate ? 'ring-2 ring-inset' : '',
                !isSelected && !hasClass && dow === 0 ? 'text-red-400' : '',
                !isSelected && !hasClass && dow === 6 ? 'text-blue-400' : '',
                !isSelected && hasClass ? 'text-gray-800 font-semibold' : '',
                !isSelected && !hasClass ? 'text-gray-400' : '',
                !inMonth ? 'opacity-30' : '',
              ].filter(Boolean).join(' ')}
            >
              <span>{d.getDate()}</span>
              {hasClass && (
                <div className="flex gap-0.5 mt-0.5">
                  {clsItems.slice(0, 3).map((cls, idx) => (
                    <div
                      key={idx}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isSelected ? 'white' : (cls.students?.color ?? '#6366f1') }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── DateTimePicker (변경요청용) ───────────────────────────────
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
      <div>
        <p className="text-xs text-gray-500 mb-2">희망 날짜 <span className="text-gray-400">(복수 선택 가능)</span></p>
        <div className="rounded-2xl p-3" style={{backgroundColor: "rgba(175,196,216,0.1)"}}>
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
                    isPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--sz-gold-light)]',
                    isSelected ? 'text-white' : '',
                    !isSelected && !isPast && dow === 0 ? 'text-red-500' : '',
                    !isSelected && !isPast && dow === 6 ? 'text-blue-500' : '',
                    !isSelected && !isPast && dow !== 0 && dow !== 6 ? 'text-gray-700' : '',
                    !isInMonth ? 'opacity-40' : '',
                    isToday(d) && !isSelected ? 'ring-1 ring-inset ring-[var(--sz-gold)]' : '',
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
              <span key={ds} className="flex items-center gap-1 text-xs bg-[var(--sz-gold-light)] text-[var(--sz-navy)] px-2.5 py-1 rounded-full font-medium">
                {format(parseISO(ds), 'M/d(EEE)', { locale: ko })}
                <button onClick={() => onToggleDate(ds)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
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
                    ? 'bg-[var(--sz-navy)] text-white border-[var(--sz-navy)]'
                    : 'border-gray-200 text-gray-600 hover:border-[var(--sz-beige)] hover:text-[var(--sz-navy)]'
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
        className="relative rounded-t-2xl w-full max-h-[90vh] overflow-y-auto pb-8" style={{backgroundColor: "var(--sz-paper)"}}
        onClick={e => e.stopPropagation()}
      >
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
          <div className="bg-[var(--sz-gold-light)] rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-[var(--sz-navy)]">{formatClassDate(cls.date)}</p>
            <p className="text-xs text-[var(--sz-navy)] mt-0.5">{cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">요청 유형</p>
            <div className="flex gap-2">
              {(['reschedule', 'cancel', 'makeup'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                    type === t ? 'bg-[var(--sz-navy)] text-white border-[var(--sz-navy)]' : 'border-gray-200 text-gray-600'
                  }`}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          {type !== 'cancel' && (
            <DateTimePicker
              selectedDates={selectedDates}
              selectedTimes={selectedTimes}
              onToggleDate={toggleDate}
              onToggleTime={toggleTime}
            />
          )}
          <div>
            <p className="text-xs text-gray-500 mb-2">사유 <span className="text-gray-400">(선택)</span></p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="변경이 필요한 이유를 알려주세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--sz-navy)]"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl">
              취소
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submit.isPending || done}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                done ? 'bg-green-500 text-white' : 'bg-[var(--sz-navy)] text-white disabled:opacity-60'
              }`}
            >
              {done
                ? <span className="flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> 제출 완료</span>
                : submit.isPending ? '제출 중...' : '요청 제출'
              }
            </button>
          </div>
        </div>
        {showConfirm && (
          <div className="absolute inset-0 bg-black/30 rounded-t-2xl flex items-center justify-center p-6 z-10">
            <div className="bg-white rounded-2xl p-6 w-full shadow-xl space-y-4">
              <div className="text-center space-y-1">
                <p className="text-2xl">📋</p>
                <p className="text-base font-bold text-gray-900">변경을 요청하시겠습니까?</p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-[var(--sz-navy)]">{TYPE_LABELS[type]}</span> 요청이 선생님께 전달됩니다
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
                  className="flex-1 py-2.5 bg-[var(--sz-navy)] text-white text-sm font-medium rounded-xl disabled:opacity-60"
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
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null)

  const role = profile?.role
  const isParent = role === 'parent'
  const canRequest = role === 'parent' || role === 'adult_learner'

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[var(--sz-navy)] border-t-transparent rounded-full animate-spin" />
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
        <div className="w-6 h-6 border-2 border-[var(--sz-navy)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const today = startOfDay(new Date())
  const allClasses = classes ?? []
  const upcoming = allClasses.filter(c => !isBefore(parseISO(c.date), today) && (c.status === 'scheduled' || c.status === 'makeup'))
  const past = allClasses.filter(c => isBefore(parseISO(c.date), today) || c.status === 'completed' || c.status === 'cancelled').slice(-5).reverse()

  function groupByDate(items: typeof upcoming) {
    const map: Record<string, typeof upcoming> = {}
    for (const item of items) {
      if (!map[item.date]) map[item.date] = []
      map[item.date].push(item)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }

  // 캘린더에서 선택된 날짜의 수업
  const selectedDayClasses = selectedCalDate
    ? allClasses.filter(c => c.date === selectedCalDate)
    : []

  function ClassRow({ cls, showRequest, studentName }: { cls: ClassItem; showRequest: boolean; studentName?: string }) {
    const statusInfo = STATUS_LABELS[cls.status] ?? { label: cls.status, color: '' }
          const statusStyle = cls.status === 'scheduled'
            ? { backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }
            : cls.status === 'completed'
            ? { backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }
            : cls.status === 'cancelled'
            ? { backgroundColor: 'var(--sz-pink-pale)', color: 'var(--sz-pink-soft)' }
            : { backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)' }
    const studentColor = cls.students?.color ?? '#6366f1'
    return (
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: studentColor }} />
        <div className="flex-1 min-w-0">
          {studentName && (
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--sz-blue-soft)' }}>{studentName}</p>
          )}
          <p className="text-sm font-medium text-gray-800">{cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}</p>
          {cls.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{cls.notes}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={statusStyle}>
            {statusInfo.label}
          </span>
          {showRequest && cls.status === 'scheduled' && (
            <button
              onClick={() => setRequestTarget(cls)}
              className="text-xs px-3 py-1 rounded-full font-semibold transition-all active:scale-95"
              style={{ backgroundColor: 'var(--sz-blue-soft)', color: '#fff' }}
            >
              변경 요청
            </button>
          )}
        </div>
      </div>
    )
  }

  // 학부모 / 성인학습자: 캘린더 메인 레이아웃
  const { linkedStudentName } = usePortalStudent()
  if (isParent || role === 'adult_learner') {
    const upcomingGroups = groupByDate(upcoming).slice(0, 2) // 가장 가까운 2개 날짜
    const pastGroups = groupByDate(past)
    const studentName = linkedStudentName ?? undefined

    return (
      <div className="max-w-lg mx-auto px-4 space-y-4" style={{ paddingTop: '20px' }}>
        {/* 월간 캘린더 */}
        <MonthlyCalendar
          classes={allClasses as ClassItem[]}
          onDayClick={ds => setSelectedCalDate(prev => prev === ds ? null : ds)}
          selectedDate={selectedCalDate}
        />

        {/* 선택된 날짜 수업 디테일 */}
        {selectedCalDate && selectedDayClasses.length > 0 && (
          <div className="overflow-hidden" style={{ backgroundColor: '#FFFDF8', boxShadow: '5px 5px 16px rgba(100,88,65,0.08), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '16px' }}>
            <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ backgroundColor: 'rgba(175,196,216,0.1)', borderColor: 'rgba(175,196,216,0.2)' }}>
              <span className="text-xs font-semibold text-[var(--sz-navy)]">{formatClassDate(selectedCalDate)}</span>
              <button onClick={() => setSelectedCalDate(null)} className="text-[var(--sz-warm-gray)] hover:text-[var(--sz-navy)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {selectedDayClasses.map(cls => (
                <ClassRow key={cls.id} cls={cls as ClassItem} showRequest={canRequest} studentName={studentName} />
              ))}
            </div>
          </div>
        )}

        {/* 다가오는 수업 (2개 날짜) */}
        <section>
          <h2 className="text-xs font-bold mb-3" style={{ color: 'var(--sz-text-muted)', letterSpacing: '0.06em' }}>다가오는 수업</h2>
          {upcomingGroups.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ backgroundColor: '#FFFDF8', border: '1px solid rgba(175,196,216,0.2)', borderRadius: '20px', color: 'var(--sz-text-muted)' }}>
              예정된 수업이 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingGroups.map(([date, items]) => (
                <div key={date} className="overflow-hidden" style={{ backgroundColor: '#FFFDF8', boxShadow: '5px 5px 16px rgba(100,88,65,0.08), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '16px' }}>
                  <div className="px-4 py-2.5 border-b" style={{ backgroundColor: 'rgba(175,196,216,0.1)', borderColor: 'rgba(175,196,216,0.2)' }}>
                    <span className="text-xs font-semibold text-gray-600">{formatClassDate(date)}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(cls => <ClassRow key={cls.id} cls={cls as ClassItem} showRequest={canRequest} studentName={studentName} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 지난 수업 */}
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
            pastGroups.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ backgroundColor: '#FFFDF8', border: '1px solid rgba(175,196,216,0.2)', borderRadius: '20px', color: 'var(--sz-text-muted)' }}>지난 수업이 없습니다</div>
            ) : (
              <div className="space-y-3">
                {pastGroups.map(([date, items]) => (
                  <div key={date} className="overflow-hidden" style={{ backgroundColor: '#FFFDF8', boxShadow: '5px 5px 16px rgba(100,88,65,0.07), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '16px', opacity: 0.8 }}>
                    <div className="px-4 py-2.5 border-b" style={{ backgroundColor: 'rgba(175,196,216,0.1)', borderColor: 'rgba(175,196,216,0.2)' }}>
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

  // 학생 / 성인학습자: 기존 리스트 레이아웃
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <section>
        <h2 className="text-xs font-bold mb-3" style={{ color: 'var(--sz-text-muted)', letterSpacing: '0.06em' }}>다가오는 수업</h2>
        {groupByDate(upcoming).length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ backgroundColor: '#FFFDF8', border: '1px solid rgba(175,196,216,0.2)', borderRadius: '20px', color: 'var(--sz-text-muted)' }}>
            예정된 수업이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {groupByDate(upcoming).map(([date, items]) => (
              <div key={date} className="overflow-hidden" style={{ backgroundColor: '#FFFDF8', boxShadow: '5px 5px 16px rgba(100,88,65,0.08), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '16px' }}>
                <div className="px-4 py-2.5 border-b" style={{ backgroundColor: 'rgba(175,196,216,0.1)', borderColor: 'rgba(175,196,216,0.2)' }}>
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
            <div className="p-6 text-center text-sm" style={{ backgroundColor: '#FFFDF8', border: '1px solid rgba(175,196,216,0.2)', borderRadius: '20px', color: 'var(--sz-text-muted)' }}>지난 수업이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {groupByDate(past).map(([date, items]) => (
                <div key={date} className="overflow-hidden" style={{ backgroundColor: '#FFFDF8', boxShadow: '5px 5px 16px rgba(100,88,65,0.07), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '16px', opacity: 0.8 }}>
                  <div className="px-4 py-2.5 border-b" style={{ backgroundColor: 'rgba(175,196,216,0.1)', borderColor: 'rgba(175,196,216,0.2)' }}>
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
