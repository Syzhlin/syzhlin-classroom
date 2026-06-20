'use client'
import { useState, useEffect } from 'react'
import { startOfWeek } from 'date-fns'
import { Plus, List, CalendarDays } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const generateRecurring = useGenerateRecurringClasses()

  useEffect(() => {
    generateRecurring.mutate()
  }, [])

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setViewMode('calendar')
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

      {/* ── 모바일: 리스트 뷰 ── */}
      {isMobile && viewMode === 'list' && (
        <>
          <MobileScheduleView
            onClassClick={handleClassClick}
            onNameClick={handleNameClick}
            onAddClick={handleAddClick}
          />
          {/* 주간표 전환 탭 — 하단 탭바 위 */}
          <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 flex justify-center z-20 pointer-events-none">
            <button
              onClick={() => setViewMode('calendar')}
              className="pointer-events-auto flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full shadow-lg"
              style={{ backgroundColor: 'var(--sz-card-pastel)', color: 'var(--sz-blue-soft)', boxShadow: '0 4px 16px rgba(46,53,69,0.12)' }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              주간표 보기
            </button>
          </div>
        </>
      )}

      {/* ── 모바일: 캘린더 뷰 ── */}
      {isMobile && viewMode === 'calendar' && (
        <>
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-4 py-3 sticky top-0 z-10"
            style={{ backgroundColor: 'rgba(244,241,232,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(175,196,216,0.15)' }}>
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl mr-1"
              style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}>
              <List className="w-3.5 h-3.5" />리스트
            </button>
            <WeekNavigator />
            <button onClick={handleAddClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white flex-shrink-0"
              style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
              <Plus className="w-4 h-4" />
            </button>
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
