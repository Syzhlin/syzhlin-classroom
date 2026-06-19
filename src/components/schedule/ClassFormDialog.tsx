'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudents } from '@/lib/queries/useStudents'
import { useCreateClass, useUpdateClass, ClassWithStudent } from '@/lib/queries/useClasses'

const classSchema = z.object({
  student_id: z.string().uuid('학생을 선택해주세요'),
  date: z.string().min(1, '날짜를 입력해주세요'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, '시간 형식 오류'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, '시간 형식 오류'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'makeup']),
  notes: z.string().optional(),
}).refine((d) => d.start_time < d.end_time, {
  message: '종료 시간은 시작 시간보다 늦어야 합니다',
  path: ['end_time'],
})

type ClassFormData = z.infer<typeof classSchema>

const TIME_OPTIONS = Array.from({ length: (22 - 7) * 2 + 1 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const STATUS_OPTIONS = [
  { value: 'scheduled', label: '예정' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
  { value: 'makeup', label: '보강' },
]

interface ClassFormDialogProps {
  open: boolean
  onClose: () => void
  initialDate?: Date
  initialHour?: number
  editTarget?: ClassWithStudent | null
}

export function ClassFormDialog({ open, onClose, initialDate, initialHour, editTarget }: ClassFormDialogProps) {
  const { data: students } = useStudents()
  const createClass = useCreateClass()
  const updateClass = useUpdateClass()

  const isEdit = !!editTarget

  const defaultDate = initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  const defaultStart = initialHour != null
    ? `${String(Math.floor(initialHour)).padStart(2, '0')}:${initialHour % 1 === 0.5 ? '30' : '00'}`
    : '16:00'
  const defaultEnd = initialHour != null
    ? `${String(Math.floor(initialHour) + 1).padStart(2, '0')}:${initialHour % 1 === 0.5 ? '30' : '00'}`
    : '17:00'

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      date: defaultDate,
      start_time: defaultStart,
      end_time: defaultEnd,
      status: 'scheduled',
    },
  })

  useEffect(() => {
    if (!open) return
    if (editTarget) {
      reset({
        student_id: editTarget.student_id,
        date: editTarget.date,
        start_time: editTarget.start_time.slice(0, 5),
        end_time: editTarget.end_time.slice(0, 5),
        status: editTarget.status as ClassFormData['status'],
        notes: editTarget.notes ?? '',
      })
    } else {
      reset({
        date: defaultDate,
        start_time: defaultStart,
        end_time: defaultEnd,
        status: 'scheduled',
        notes: '',
        student_id: undefined,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget, open])

  const onSubmit = async (data: ClassFormData) => {
    try {
      if (isEdit && editTarget) {
        await updateClass.mutateAsync({
          id: editTarget.id,
          student_id: data.student_id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          status: data.status,
          notes: data.notes ?? null,
        })
      } else {
        await createClass.mutateAsync({
          student_id: data.student_id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          status: data.status,
          notes: data.notes ?? null,
        })
      }
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  const watchedStudentId = watch('student_id')
  const watchedStatus = watch('status')
  const watchedStartTime = watch('start_time')
  const watchedEndTime = watch('end_time')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '수업 수정' : '수업 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 학생 */}
          <div className="space-y-1.5">
            <Label>학생</Label>
            <Select value={watchedStudentId ?? ''} onValueChange={(v) => setValue('student_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="학생 선택..." />
              </SelectTrigger>
              <SelectContent>
                {(!students || students.length === 0) && (
                  <div className="px-2 py-4 text-center text-sm text-gray-400">
                    등록된 학생이 없습니다
                  </div>
                )}
                {students?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.student_id && <p className="text-xs text-red-500">{errors.student_id.message}</p>}
          </div>

          {/* 날짜 */}
          <div className="space-y-1.5">
            <Label>날짜</Label>
            <input
              type="date"
              {...register('date')}
              className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>시작 시간</Label>
              <Select value={watchedStartTime ?? ''} onValueChange={(v) => setValue('start_time', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>종료 시간</Label>
              <Select value={watchedEndTime ?? ''} onValueChange={(v) => setValue('end_time', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.end_time && <p className="text-xs text-red-500">{errors.end_time.message}</p>}
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1.5">
            <Label>상태</Label>
            <Select value={watchedStatus ?? 'scheduled'} onValueChange={(v) => setValue('status', v as ClassFormData['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label>메모 <span className="text-gray-400 font-normal">(선택)</span></Label>
            <Textarea {...register('notes')} placeholder="수업 메모를 입력하세요..." rows={2} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>취소</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEdit ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
