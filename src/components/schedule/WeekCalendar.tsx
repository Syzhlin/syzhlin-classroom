'use client'
import { addDays, format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useScheduleStore } from '@/store/scheduleStore'
import { useWeekClasses, useAllSessionClasses, buildSessionNumberMap, ClassWithStudent } from '@/lib/queries/useClasses'
import { ClassBlock } from './ClassBlock'
import { Skeleton } from '@/components/ui/skeleton'

const HOUR_START = 15  // 15:00 (오후 3시)
const HOUR_END = 22    // 22:00
const HOUR_PX = 60     // 1시간 = 60px
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
}

export function WeekCalendar({ onClassClick, onNameClick, onSlotClick }: WeekCalendarProps) {
  const { selectedWeekStart } = useScheduleStore()
  const { data: classes, isLoading } = useWeekClasses(selectedWeekStart)
  const { data: allSessionClasses } = useAllSessionClasses()
  const today = new Date()

  const sessionNumberMap = allSessionClasses ? buildSessionNumberMap(allSessionClasses) : {}

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i))

  const getClassesForDay = (day: Date) =>
    (classes ?? []).filter((c) => c.date === format(day, 'yyyy-MM-dd'))

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 — 요일 */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="w-14 shrink-0" /> {/* 시간 컬럼 여백 */}
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-100 first:border-l-0">
              <p className={`text-xs font-medium ${i >= 5 ? 'text-red-400' : 'text-gray-500'}`}>
                {DAYS[i]}
              </p>
              <p className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full
                ${isToday ? 'bg-indigo-600 text-white' : i >= 5 ? 'text-red-500' : 'text-gray-800'}`}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* 그리드 본체 */}
      <div className="flex flex-1 overflow-auto">
        {/* 시간축 */}
        <div className="w-14 shrink-0 relative" style={{ height: TOTAL_HOURS * HOUR_PX }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute right-2 text-[10px] text-gray-400 leading-none"
              style={{ top: i * HOUR_PX - 6 }}
            >
              {String(HOUR_START + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 날짜별 컬럼 */}
        {weekDays.map((day, di) => {
          const dayClasses = getClassesForDay(day)
          return (
            <div
              key={di}
              className="flex-1 relative border-l border-gray-100 first:border-l-0"
              style={{ height: TOTAL_HOURS * HOUR_PX }}
            >
              {/* 시간 구분선 */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: i * HOUR_PX }}
                />
              ))}

              {/* 30분 구분선 */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={`half-${i}`}
                  className="absolute left-0 right-0 border-t border-gray-50"
                  style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                />
              ))}

              {/* 클릭 가능 영역 */}
              {Array.from({ length: TOTAL_HOURS * 2 }, (_, i) => (
                <div
                  key={`slot-${i}`}
                  className="absolute left-0 right-0 hover:bg-indigo-50 cursor-pointer"
                  style={{ top: i * (HOUR_PX / 2), height: HOUR_PX / 2 }}
                  onClick={() => onSlotClick(day, HOUR_START + i * 0.5)}
                />
              ))}

              {/* 수업 블록 */}
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
                        sessionNumber={sessionNumberMap[cls.id]}
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
