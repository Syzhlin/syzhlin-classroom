'use client'
import { useState, useEffect } from 'react'
import { startOfWeek } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeekNavigator } from '@/components/schedule/WeekNavigator'
import { WeekCalendar } from '@/components/schedule/WeekCalendar'
import { ClassFormDialog } from '@/components/schedule/ClassFormDialog'
import { ClassDetailSheet } from '@/components/schedule/ClassDetailSheet'
import { QuickStatusSheet } from '@/components/schedule/QuickStatusSheet'
import type { ClassWithStudent } from '@/lib/queries/useClasses'
import { TodayBriefing } from '@/components/schedule/TodayBriefing'
import { useGenerateRecurringClasses } from '@/lib/queries/useRecurringClasses'

export default function SchedulePage() {
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassWithStudent | null>(null)
  const [quickClass, setQuickClass] = useState<ClassWithStudent | null>(null)
  const [editTarget, setEditTarget] = useState<ClassWithStudent | null>(null)
  const [slotDate, setSlotDate] = useState<Date | undefined>()
  const [slotHour, setSlotHour] = useState<number | undefined>()

  const generateRecurring = useGenerateRecurringClasses()

  // 페이지 로드 시 정기 수업 자동 생성 (12주치)
  useEffect(() => { generateRecurring.mutate() }, [])

  const handleClassClick = (cls: ClassWithStudent) => {
    setSelectedClass(cls)
    setDetailOpen(true)
  }

  const handleNameClick = (cls: ClassWithStudent) => {
    setQuickClass(cls)
    setQuickOpen(true)
  }

  const handleSlotClick = (date: Date, hour: number) => {
    setSlotDate(date)
    setSlotHour(hour)
    setEditTarget(null)
    setFormOpen(true)
  }

  const handleAddClick = () => {
    setSlotDate(undefined)
    setSlotHour(undefined)
    setEditTarget(null)
    setFormOpen(true)
  }

  const handleEdit = (cls: ClassWithStudent) => {
    setEditTarget(cls)
    setFormOpen(true)
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col bg-white md:h-screen">
      {/* 상단 헤더 */}
      <div className="flex flex-col gap-3 px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold text-gray-900">수업 일정</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <WeekNavigator />
          <Button onClick={handleAddClick} size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" />
            수업 추가
          </Button>
        </div>
      </div>

      {/* 오늘의 수업 브리핑 */}
      <TodayBriefing />

      {/* 캘린더 */}
      <div className="flex-1 overflow-auto">
        <WeekCalendar
          onClassClick={handleClassClick}
          onNameClick={handleNameClick}
          onSlotClick={handleSlotClick}
        />
      </div>

      {/* 수업 추가/수정 다이얼로그 */}
      <ClassFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        initialDate={slotDate}
        initialHour={slotHour}
        editTarget={editTarget}
      />

      {/* 수업 상세 */}
      <ClassDetailSheet
        cls={selectedClass}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
      />

      {/* 빠른 상태 변경 (이름 클릭) */}
      <QuickStatusSheet
        cls={quickClass}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </div>
  )
}
