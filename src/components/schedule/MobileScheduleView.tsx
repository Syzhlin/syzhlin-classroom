'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, addDays, isToday, isTomorrow, parseISO, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, BookOpen, ClipboardList } from 'lucide-react'
import { useScheduleStore } from '@/store/scheduleStore'
import { useWeekClasses, useAllSessionClasses, buildSessionNumberMap, useUpdateClass } from '@/lib/queries/useClasses'
import type { ClassWithStudent } from '@/lib/queries/useClasses'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', completed: '완료', cancelled: '취소', makeup: '보강', postponed: '미룸',
}
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  scheduled: { backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' },
  completed: { backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' },
  cancelled: { backgroundColor: 'var(--sz-pink-pale)', color: 'var(--sz-pink-soft)' },
  makeup:    { backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)' },
  postponed: { backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' },
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour >= 12 ? '오후' : '오전'} ${hour > 12 ? hour - 12 : hour}:${m}`
}

function formatDayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return '오늘'
  if (isTomorrow(d)) return '내일'
  return format(d, 'M월 d일 (E)', { locale: ko })
}

function ClassCard({ cls, sessionNumber, onNameClick, onClick }: {
  cls: ClassWithStudent; sessionNumber?: number
  onNameClick: () => void; onClick: () => void
}) {
  const updateClass = useUpdateClass()
  const color = cls.students?.color ?? '#AFC4D8'
  const subject = cls.students?.subjects?.[0] ?? ''
  const statusStyle = STATUS_STYLE[cls.status] ?? STATUS_STYLE.scheduled

  return (
    <div
      className="sz-widget rounded-2xl p-4 flex gap-3 active:scale-[0.99] transition-transform cursor-pointer"
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); onNameClick() }}
            className="text-base font-bold"
            style={{ color: 'var(--sz-text-deep)' }}
          >
            {cls.students?.name}
          </button>
          {sessionNumber != null && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}22`, color }}>
              {sessionNumber}회차
            </span>
          )}
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={statusStyle}>
            {STATUS_LABEL[cls.status] ?? cls.status}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--sz-text-muted)' }}>
          {subject && <span>{subject} · </span>}
          {formatTime(cls.start_time)} ~ {formatTime(cls.end_time)}
        </p>
        <div className="flex gap-2 mt-3">
          {cls.status === 'scheduled' && (
            <button
              onClick={(e) => { e.stopPropagation(); updateClass.mutate({ id: cls.id, status: 'completed' }) }}
              disabled={updateClass.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }}
            >완료</button>
          )}
          <Link href="/feedback" onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
            style={{ backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)' }}>
            <ClipboardList className="w-3 h-3" />피드백
          </Link>
          <Link href="/materials" onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
            style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}>
            <BookOpen className="w-3 h-3" />자료
          </Link>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-5">
      <span className="text-sm font-bold" style={{ color: 'var(--sz-text-deep)' }}>{label}</span>
      {count > 0 && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyState({ label, onAdd }: { label?: string; onAdd?: () => void }) {
  return (
    <div className="sz-widget rounded-2xl p-5 text-center">
      {!label && <div className="text-3xl mb-2">📭</div>}
      <p className="text-sm" style={{ color: 'var(--sz-text-muted)' }}>
        {label ?? '오늘 예정된 수업이 없어요'}
      </p>
      {onAdd && (
        <button onClick={onAdd}
          className="mt-3 text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
          + 수업 추가
        </button>
      )}
    </div>
  )
}

export function MobileScheduleView({ onClassClick, onNameClick, onAddClick }: {
  onClassClick: (cls: ClassWithStudent) => void
  onNameClick: (cls: ClassWithStudent) => void
  onAddClick: () => void
}) {
  const { selectedWeekStart, setWeekStart } = useScheduleStore()
  const { data: weekClasses = [] } = useWeekClasses(selectedWeekStart)
  const { data: allSessionClasses } = useAllSessionClasses()
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => { setToday(new Date()) }, [])

  const sessionMap = useMemo(() =>
    allSessionClasses ? buildSessionNumberMap(allSessionClasses) : {},
    [allSessionClasses]
  )

  const weekEnd = addDays(selectedWeekStart, 6)
  const weekLabel = `${format(selectedWeekStart, 'M월 d일', { locale: ko })} ~ ${format(weekEnd, 'M월 d일', { locale: ko })}`

  const todayStr = today ? format(today, 'yyyy-MM-dd') : ''
  const tomorrowStr = today ? format(addDays(today, 1), 'yyyy-MM-dd') : ''
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
  const weekStartStr = format(selectedWeekStart, 'yyyy-MM-dd')

  const active = (c: ClassWithStudent) => c.status !== 'cancelled' && c.status !== 'postponed'
  const todayList = weekClasses.filter(c => c.date === todayStr && active(c))
  const tomorrowList = weekClasses.filter(c => c.date === tomorrowStr && active(c))
  const restList = weekClasses
    .filter(c => c.date !== todayStr && c.date !== tomorrowStr && c.date >= weekStartStr && c.date <= weekEndStr && active(c))
    .sort((a, b) => a.date === b.date ? a.start_time.localeCompare(b.start_time) : a.date.localeCompare(b.date))

  const restByDay: Record<string, ClassWithStudent[]> = {}
  for (const c of restList) {
    if (!restByDay[c.date]) restByDay[c.date] = []
    restByDay[c.date].push(c)
  }

  const weekCount = weekClasses.filter(active).length

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sz-bg-pastel)' }}>

      {/* 헤더 */}
      <div className="px-4 pt-4 pb-3 sticky top-0 z-10"
        style={{ backgroundColor: 'rgba(244,241,232,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(175,196,216,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--sz-text-deep)' }}>수업 일정</h1>
            {today && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>
                {format(today, 'M월 d일 EEEE', { locale: ko })}
              </p>
            )}
          </div>
          <button onClick={onAddClick}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl text-white"
            style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
            <Plus className="w-4 h-4" />추가
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(new Date(selectedWeekStart.getTime() - 7 * 86400000))}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex-1 text-center text-sm font-semibold" style={{ color: 'var(--sz-text-deep)' }}>
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekStart(new Date(selectedWeekStart.getTime() + 7 * 86400000))}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="text-xs font-semibold px-3 h-8 rounded-xl"
            style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}>
            오늘
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="sz-widget rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--sz-blue-soft)' }}>{todayList.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>오늘 수업</p>
        </div>
        <div className="sz-widget rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--sz-sage)' }}>{weekCount}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>이번 주 수업</p>
        </div>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-auto px-4"
        style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>

        <SectionHeader label="오늘" count={todayList.length} />
        {todayList.length === 0
          ? <EmptyState onAdd={onAddClick} />
          : <div className="space-y-2">{todayList.map(cls => (
              <ClassCard key={cls.id} cls={cls} sessionNumber={sessionMap[cls.id]}
                onClick={() => onClassClick(cls)} onNameClick={() => onNameClick(cls)} />
            ))}</div>
        }

        {today && (
          <>
            <SectionHeader label="내일" count={tomorrowList.length} />
            {tomorrowList.length === 0
              ? <EmptyState label="내일 예정된 수업이 없어요" />
              : <div className="space-y-2">{tomorrowList.map(cls => (
                  <ClassCard key={cls.id} cls={cls} sessionNumber={sessionMap[cls.id]}
                    onClick={() => onClassClick(cls)} onNameClick={() => onNameClick(cls)} />
                ))}</div>
            }
          </>
        )}

        {Object.keys(restByDay).length > 0 && (
          <>
            <SectionHeader label="이번 주 남은 수업" count={restList.length} />
            <div className="space-y-4">
              {Object.entries(restByDay).map(([dateStr, classes]) => (
                <div key={dateStr}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--sz-text-muted)' }}>
                    {formatDayLabel(dateStr)}
                  </p>
                  <div className="space-y-2">{classes.map(cls => (
                    <ClassCard key={cls.id} cls={cls} sessionNumber={sessionMap[cls.id]}
                      onClick={() => onClassClick(cls)} onNameClick={() => onNameClick(cls)} />
                  ))}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
