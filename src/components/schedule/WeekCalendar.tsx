'use client'
import { useState, useEffect, useMemo } from 'react'
import { addDays, format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useScheduleStore } from '@/store/scheduleStore'
import { useWeekClasses, useAllSessionClasses, buildSessionNumberMap, ClassWithStudent } from '@/lib/queries/useClasses'
import { useAllPayments } from '@/lib/queries/usePayments'
import { ClassBlock } from './ClassBlock'
import { Skeleton } from '@/components/ui/skeleton'

const HOUR_START = 15
const HOUR_END = 22
const HOUR_PX = 60
const TOTAL_HOURS = HOUR_END - HOUR_START

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number): number {
  return ((minutes - HOUR_START * 60) / 60) * HOUR_PX
}

interface WeekCalendarProps {
  onClassClick: (cls: ClassWithStudent) => void
  onNameClick: (cls: ClassWithStudent) => void
  onSlotClick: (date: Date, hour: number) => void
  compact?: boolean
}

export function WeekCalendar({ onClassClick, onNameClick, onSlotClick, compact }: WeekCalendarProps) {
  const { selectedWeekStart } = useScheduleStore()
  const { data: classes, isLoading } = useWeekClasses(selectedWeekStart)
  const { data: allSessionClasses } = useAllSessionClasses()

  // 클라이언트에서만 로컬 날짜 계산 (SSR UTC 불일치 방지)
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => {
    setToday(new Date())
    // 자정에 날짜 업데이트
    const now = new Date()
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [])

  const { data: allPayments } = useAllPayments()
  const paymentMap = useMemo(() => {
    const m: Record<string, number> = {}
    if (allPayments) {
      for (const p of allPayments) { m[`${p.student_id}:${p.year_month}`] = p.completed_sessions }
    }
    return m
  }, [allPayments])
  const sessionNumberMap = allSessionClasses ? buildSessionNumberMap(allSessionClasses, paymentMap) : {}
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i))
  const getClassesForDay = (day: Date) =>
    (classes ?? []).filter((c) => c.date === format(day, 'yyyy-MM-dd'))

  return (
    <div className={`flex h-full flex-col ${compact ? "" : "min-w-[760px] md:min-w-0"}`}>
      {/* 헤더 — 요일 */}
      <div className="flex sticky top-0 z-20" style={{borderBottom:"1px solid rgba(175,196,216,0.2)", backgroundColor:"var(--sz-card-pastel)"}}>
        <div className="w-14 shrink-0" />
        {weekDays.map((day, i) => {
          const isToday = today ? isSameDay(day, today) : false
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-100 first:border-l-0">
              <p className={`text-xs font-medium ${i >= 5 ? 'text-red-400' : 'text-[var(--sz-text-muted)]'}`}>
                {DAYS[i]}
              </p>
              <p className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${i >= 5 && !isToday ? 'text-red-500' : !isToday ? 'text-[var(--sz-text-deep)]' : 'text-white'}`}
                style={{ backgroundColor: isToday ? 'var(--sz-blue-soft)' : undefined }}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* 그리드 본체 */}
      <div className="flex flex-1 overflow-auto">
        <div className="w-14 shrink-0 relative" style={{ height: TOTAL_HOURS * HOUR_PX }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute right-2 text-[10px] leading-none" style={{color:"var(--sz-text-muted)", top: i * HOUR_PX - 6}}
            >
              {String(HOUR_START + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {weekDays.map((day, di) => {
          const dayClasses = getClassesForDay(day)
          return (
            <div
              key={di}
              className="flex-1 relative border-l first:border-l-0" style={{borderColor:"rgba(175,196,216,0.15)", height: TOTAL_HOURS * HOUR_PX}}
            >
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t" style={{borderColor:"rgba(175,196,216,0.15)", top: i * HOUR_PX}} />
              ))}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={`half-${i}`} className="absolute left-0 right-0 border-t" style={{borderColor:"rgba(175,196,216,0.07)", top: i * HOUR_PX + HOUR_PX / 2}} />
              ))}
              {Array.from({ length: TOTAL_HOURS * 2 }, (_, i) => (
                <div
                  key={`slot-${i}`}
                  className="absolute left-0 right-0 hover:bg-[var(--sz-blue-pale)] cursor-pointer transition-colors"
                  style={{ top: i * (HOUR_PX / 2), height: HOUR_PX / 2 }}
                  onClick={() => onSlotClick(day, HOUR_START + i * 0.5)}
                />
              ))}
              {isLoading
                ? di === 0 && [1, 2].map((k) => (
                    <Skeleton key={k} className="absolute mx-1 rounded-md" style={{ top: k * 100, height: 50, left: 4, right: 4 }} />
                  ))
                : dayClasses.map((cls) => {
                    const startMin = timeToMinutes(cls.start_time)
                    const endMin = timeToMinutes(cls.end_time)
                    const topPx = minutesToPx(startMin)
                    const heightPx = ((endMin - startMin) / 60) * HOUR_PX
                    return (
                      <ClassBlock
                        key={cls.id}
                        cls={cls}
                        topPx={topPx}
                        heightPx={heightPx}

                        onClick={() => onClassClick(cls)}
                        onNameClick={() => onNameClick(cls)}
                      />
                    )
                  })
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
