'use client'
import { useState, useEffect } from 'react'
import { startOfWeek } from 'date-fns'
import { Plus } from 'lucide-react'
import { WeekNavigator } from '@/components/schedule/WeekNavigator'
import { WeekCalendar } from '@/components/schedule/WeekCalendar'
import { ClassFormDialog } from '@/components/schedule/ClassFormDialog'
import { ClassDetailSheet } from '@/components/schedule/ClassDetailSheet'
import { QuickStatusSheet } from '@/components/schedule/QuickStatusSheet'
import { MobileScheduleView } from '@/components/schedule/MobileScheduleView'
import type { ClassWithStudent } from '@/lib/queries/useClasses'
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
  const [isMobile, setIsMobile] = useState(false)

  const generateRecurring = useGenerateRecurringClasses()

  useEffect(() => {
    generateRecurring.mutate()
  }, [])

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleClassClick = (cls: ClassWithStudent) => { setSelectedClass(cls); setDetailOpen(true) }
  const handleNameClick = (cls: ClassWithStudent) => { setQuickClass(cls); setQuickOpen(true) }
  const handleSlotClick = (date: Date, hour: number) => {
    setSlotDate(date); setSlotHour(hour); setEditTarget(null); setFormOpen(true)
  }
  const handleAddClick = () => {
    setSlotDate(undefined); setSlotHour(undefined); setEditTarget(null); setFormOpen(true)
  }
  const handleEdit = (cls: ClassWithStudent) => { setEditTarget(cls); setFormOpen(true) }

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col md:h-screen"
      style={{ backgroundColor: 'var(--sz-bg-pastel)' }}>

      {/* ── 모바일: MobileScheduleView (리스트+주간표 통합) ── */}
      {isMobile && (
        <MobileScheduleView
          onClassClick={handleClassClick}
          onNameClick={handleNameClick}
          onAddClick={handleAddClick}
          onSlotClick={handleSlotClick}
        />
      )}

      {/* ── 데스크탑: 기존 주간표 ── */}
      {!isMobile && (
        <>
          <div className="flex flex-col gap-3 px-6 py-4"
            style={{ borderBottom: '1px solid rgba(175,196,216,0.2)', backgroundColor: 'var(--sz-card-pastel)' }}>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold" style={{ color: 'var(--sz-text-deep)' }}>수업 일정</h1>
              <button onClick={handleAddClick}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
                <Plus className="w-4 h-4" />수업 추가
              </button>
            </div>
            <WeekNavigator />
          </div>
          <div className="flex-1 overflow-auto">
            <WeekCalendar
              onClassClick={handleClassClick}
              onNameClick={handleNameClick}
              onSlotClick={handleSlotClick}
            />
          </div>
        </>
      )}

      {/* 공통 다이얼로그 */}
      <ClassFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        initialDate={slotDate}
        initialHour={slotHour}
        editTarget={editTarget}
      />
      <ClassDetailSheet
        cls={selectedClass}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
      />
      <QuickStatusSheet
        cls={quickClass}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </div>
  )
}
