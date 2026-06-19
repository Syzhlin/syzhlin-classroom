'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateClass, ClassWithStudent } from '@/lib/queries/useClasses'

type QuickMode = 'main' | 'reschedule' | 'makeup'

interface QuickStatusSheetProps {
  cls: ClassWithStudent | null
  open: boolean
  onClose: () => void
}

export function QuickStatusSheet({ cls, open, onClose }: QuickStatusSheetProps) {
  const [mode, setMode] = useState<QuickMode>('main')
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')

  const updateClass = useUpdateClass()

  if (!cls) return null

  const color = cls.students?.color ?? '#6366f1'

  const handleClose = () => {
    setMode('main')
    onClose()
  }

  const openTimePicker = (m: 'reschedule' | 'makeup') => {
    setNewDate(cls.date)
    setNewStart(cls.start_time.slice(0, 5))
    setNewEnd(cls.end_time.slice(0, 5))
    setMode(m)
  }

  const handleQuick = async (status: 'completed' | 'cancelled' | 'scheduled') => {
    await updateClass.mutateAsync({ id: cls.id, status })
    handleClose()
  }

  const handleTimeSave = async () => {
    await updateClass.mutateAsync({
      id: cls.id,
      date: newDate,
      start_time: newStart,
      end_time: newEnd,
      status: mode === 'makeup' ? 'makeup' : 'scheduled',
    })
    handleClose()
  }

  const statusLabel: Record<string, string> = {
    scheduled: '예정',
    completed: '완료',
    cancelled: '취소',
    makeup: '보강',
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <SheetContent className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 rounded-full" style={{ backgroundColor: color }} />
            <SheetTitle className="text-base">
              {cls.students?.name}
              <span className="text-sm font-normal text-gray-400 ml-2">
                {format(new Date(cls.date), 'M/d (EEE)', { locale: ko })} {cls.start_time.slice(0, 5)}
              </span>
            </SheetTitle>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            현재 상태: <span className="font-medium">{statusLabel[cls.status] ?? cls.status}</span>
          </p>
        </SheetHeader>

        {mode === 'main' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuick('completed')}
              disabled={updateClass.isPending}
              className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">✅</span>
              <span className="text-sm font-medium text-green-700">완료</span>
            </button>

            <button
              onClick={() => handleQuick('cancelled')}
              disabled={updateClass.isPending}
              className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl">❌</span>
              <span className="text-sm font-medium text-red-600">취소</span>
            </button>

            <button
              onClick={() => openTimePicker('reschedule')}
              className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <span className="text-2xl">📅</span>
              <span className="text-sm font-medium text-indigo-700">미룸</span>
            </button>

            <button
              onClick={() => openTimePicker('makeup')}
              className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-medium text-orange-600">보강</span>
            </button>

            {cls.status !== 'scheduled' && (
              <button
                onClick={() => handleQuick('scheduled')}
                disabled={updateClass.isPending}
                className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-600">↩ 예정으로 되돌리기</span>
              </button>
            )}
          </div>
        )}

        {(mode === 'reschedule' || mode === 'makeup') && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              {mode === 'reschedule' ? '📅 미룸 — 새 일정 입력' : '🔄 보강 — 새 일정 입력'}
            </p>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">날짜</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">시작</label>
                <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">종료</label>
                <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setMode('main')}>
                뒤로
              </Button>
              <Button className="flex-1" onClick={handleTimeSave} disabled={updateClass.isPending}>
                {updateClass.isPending ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
