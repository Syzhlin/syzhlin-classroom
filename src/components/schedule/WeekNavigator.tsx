'use client'
import { addWeeks, subWeeks, startOfWeek, format, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScheduleStore } from '@/store/scheduleStore'

export function WeekNavigator() {
  const { selectedWeekStart, setWeekStart } = useScheduleStore()
  const weekEnd = addDays(selectedWeekStart, 6)

  const label = `${format(selectedWeekStart, 'yyyy년 M월 d일', { locale: ko })} ~ ${format(weekEnd, 'M월 d일', { locale: ko })}`

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
      <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(selectedWeekStart, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:min-w-[240px]">
        <CalendarDays className="h-4 w-4 text-indigo-600" />
        <span className="truncate text-sm font-medium text-gray-700">{label}</span>
      </div>
      <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(selectedWeekStart, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-gray-500"
        onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
      >
        오늘
      </Button>
    </div>
  )
}
