'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Pencil, Trash2, Clock, BookOpen, StickyNote, CalendarClock } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useDeleteClass, useUpdateClass, useCompleteClass, usePostponeClass, ClassWithStudent } from '@/lib/queries/useClasses'
import { useDeleteFutureClasses } from '@/lib/queries/useRecurringClasses'
import { FeedbackModal } from './FeedbackModal'

const STATUS_CONFIG = {
  scheduled: { label: '예정', variant: 'default' as const },
  completed: { label: '완료', variant: 'success' as const },
  cancelled: { label: '취소', variant: 'outline' as const },
  makeup: { label: '보강', variant: 'warning' as const },
  postponed: { label: '미룸', variant: 'outline' as const },
}

type RescheduleType = 'reschedule' | 'makeup'

interface ClassDetailSheetProps {
  cls: ClassWithStudent | null
  open: boolean
  onClose: () => void
  onEdit: (cls: ClassWithStudent) => void
}

export function ClassDetailSheet({ cls, open, onClose, onEdit }: ClassDetailSheetProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleType, setRescheduleType] = useState<RescheduleType>('reschedule')
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')

  const deleteClass = useDeleteClass()
  const updateClass = useUpdateClass()
  const completeClass = useCompleteClass()
  const postponeClass = usePostponeClass()
  const deleteFuture = useDeleteFutureClasses()
  const [confirmDeleteFuture, setConfirmDeleteFuture] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  if (!cls) return null

  const statusConfig = STATUS_CONFIG[cls.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled
  const color = cls.students?.color ?? '#6366f1'
  const subjects = cls.students?.subjects?.join(', ') ?? '-'

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteClass.mutateAsync(cls.id)
    setConfirmDelete(false)
    onClose()
  }

  const openReschedule = () => {
    setNewDate(cls.date)
    setNewStart(cls.start_time.slice(0, 5))
    setNewEnd(cls.end_time.slice(0, 5))
    setRescheduleType('reschedule')
    setShowReschedule(true)
  }

  const handleReschedule = async () => {
    await updateClass.mutateAsync({
      id: cls.id,
      date: newDate,
      start_time: newStart,
      end_time: newEnd,
      status: rescheduleType === 'makeup' ? 'makeup' : 'scheduled',
    })
    setShowReschedule(false)
    onClose()
  }

  const handlePostpone = async () => {
    await postponeClass.mutateAsync({
      id: cls.id,
      student_id: cls.student_id,
      teacher_id: cls.teacher_id,
      date: cls.date,
      start_time: cls.start_time,
      end_time: cls.end_time,
    })
    onClose()
  }

  const handleQuickStatus = async (status: 'completed' | 'cancelled' | 'scheduled') => {
    if (status === 'completed') {
      // 완료는 정산 completed_sessions +1 및 포털 갱신까지 처리하는 전용 mutation 사용
      await completeClass.mutateAsync({ id: cls.id, student_id: cls.student_id, date: cls.date })
    } else {
      await updateClass.mutateAsync({ id: cls.id, status })
    }
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => {
      if (!v) { setConfirmDelete(false); setShowReschedule(false); onClose() }
    }}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <SheetTitle className="text-xl">{cls.students?.name}</SheetTitle>
              <p className="text-sm text-gray-500 mt-0.5">{subjects}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* 날짜/시간 */}
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {format(new Date(cls.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
              </p>
              <p className="text-sm text-gray-500">
                {cls.start_time.slice(0, 5)} ~ {cls.end_time.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* 상태 */}
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>

          {/* 메모 */}
          {cls.notes && (
            <div className="flex items-start gap-3">
              <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">{cls.notes}</p>
            </div>
          )}

          <Separator />

          {/* 빠른 상태 변경 — 모든 상태에서 가능 */}
          <div className="flex gap-2 flex-wrap">
            {cls.status !== 'completed' && (
              <Button size="sm" variant="outline"
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleQuickStatus('completed')} disabled={updateClass.isPending || completeClass.isPending}>
                ✓ 완료
              </Button>
            )}
            {cls.status !== 'cancelled' && (
              <Button size="sm" variant="outline"
                className="flex-1 text-gray-500"
                onClick={() => handleQuickStatus('cancelled')} disabled={updateClass.isPending}>
                ✕ 취소
              </Button>
            )}
            {cls.status !== 'scheduled' && cls.status !== 'postponed' && (
              <Button size="sm" variant="outline"
                className="flex-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => handleQuickStatus('scheduled')} disabled={updateClass.isPending}>
                ↩ 예정
              </Button>
            )}
            {(cls.status === 'scheduled' || cls.status === 'makeup') && (
              <Button size="sm" variant="outline"
                className="flex-1 text-gray-500 border-gray-200 hover:bg-gray-50"
                onClick={handlePostpone} disabled={postponeClass.isPending}>
                ⏩ 미루기
              </Button>
            )}
          </div>

          {/* 시간 변경 */}
          {!showReschedule ? (
            <Button className="w-full" variant="outline" onClick={openReschedule}>
              <CalendarClock className="w-4 h-4 mr-2" />
              시간 변경
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
              {/* 유형 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRescheduleType('reschedule')}
                  className={`flex-1 py-1.5 text-sm rounded-md border font-medium transition-all ${
                    rescheduleType === 'reschedule'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  미룸
                </button>
                <button
                  onClick={() => setRescheduleType('makeup')}
                  className={`flex-1 py-1.5 text-sm rounded-md border font-medium transition-all ${
                    rescheduleType === 'makeup'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  보강
                </button>
              </div>

              <p className="text-[11px] text-gray-400">
                {rescheduleType === 'reschedule'
                  ? '기존 수업 시간을 변경합니다'
                  : '보강 수업으로 표시됩니다'}
              </p>

              {/* 날짜 */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* 시간 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">시작</label>
                  <Input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">종료</label>
                  <Input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowReschedule(false)}>
                  닫기
                </Button>
                <Button size="sm" className="flex-1" onClick={handleReschedule} disabled={updateClass.isPending}>
                  {updateClass.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}

          {cls.status !== 'cancelled' && (
            <Button className="w-full bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" variant="outline"
              onClick={() => setFeedbackOpen(true)}>
              💌 학생 피드백(편지) 작성
            </Button>
          )}

          <Button className="w-full" variant="outline" onClick={() => { onEdit(cls); onClose() }}>
            <Pencil className="w-4 h-4 mr-2" />
            전체 수정
          </Button>

          {/* 앞으로 수업 삭제 */}
          {!confirmDeleteFuture ? (
            <Button className="w-full text-orange-600 border-orange-200 hover:bg-orange-50" variant="outline"
              onClick={() => setConfirmDeleteFuture(true)}>
              앞으로 수업 모두 삭제
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-center text-orange-600 font-medium">오늘 이후 예정된 수업을 모두 삭제할까요?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmDeleteFuture(false)}>취소</Button>
                <Button size="sm" variant="destructive" className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={deleteFuture.isPending}
                  onClick={async () => {
                    await deleteFuture.mutateAsync(cls.student_id)
                    setConfirmDeleteFuture(false)
                    onClose()
                  }}>
                  {deleteFuture.isPending ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-center text-red-600 font-medium">정말 삭제할까요?</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>취소</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleteClass.isPending}>
                  {deleteClass.isPending ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" variant="ghost" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2 text-red-400" />
              <span className="text-red-400">수업 삭제</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
