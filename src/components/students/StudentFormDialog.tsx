'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateStudent, useUpdateStudent } from '@/lib/queries/useStudents'
import type { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']

export interface RecurringSlot {
  day: number
  start_time: string
  end_time: string
}

const COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#22c55e',
  '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7',
]
const GRADES = ['초1','초2','초3','초4','초5','초6','중1','중2','중3','고1','고2','고3','대학생','성인']
const SUBJECTS = ['영어', '중국어']
const DAYS = ['일','월','화','수','목','금','토']

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().optional(),
  parent_phone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  subjects: z.array(z.string()),
  hourly_rate: z.string().optional(),
  color: z.string(),
  notes: z.string().optional(),
  schedule_note: z.string().optional(),
})
type FormInput = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  student?: Student | null
}

export default function StudentFormDialog({ open, onClose, student }: Props) {
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const isEdit = !!student

  const [recurringSlots, setRecurringSlots] = useState<RecurringSlot[]>([])

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { color: '#6366f1', subjects: [] },
  })

  const selectedSubjects = watch('subjects') ?? []
  const selectedColor = watch('color')

  useEffect(() => {
    if (open) {
      if (student) {
        reset({
          name: student.name,
          phone: student.phone ?? '',
          parent_phone: student.parent_phone ?? '',
          school: student.school ?? '',
          grade: student.grade ?? '',
          subjects: student.subjects ?? [],
          hourly_rate: student.hourly_rate?.toString() ?? '',
          color: student.color ?? '#6366f1',
          notes: student.notes ?? '',
          schedule_note: student.schedule_note ?? '',
        })
        setRecurringSlots(student.recurring_schedule ?? [])
      } else {
        reset({ color: '#6366f1', subjects: [] })
        setRecurringSlots([])
      }
    }
  }, [open, student, reset])

  function toggleDay(day: number) {
    setRecurringSlots(prev => {
      if (prev.find(s => s.day === day)) return prev.filter(s => s.day !== day)
      return [...prev, { day, start_time: '18:00', end_time: '18:40' }].sort((a, b) => a.day - b.day)
    })
  }

  function updateSlotTime(day: number, field: 'start_time' | 'end_time', value: string) {
    setRecurringSlots(prev => prev.map(s => s.day === day ? { ...s, [field]: value } : s))
  }

  function toggleSubject(subject: string) {
    if (selectedSubjects.includes(subject)) {
      setValue('subjects', selectedSubjects.filter(s => s !== subject))
    } else {
      setValue('subjects', [...selectedSubjects, subject])
    }
  }

  async function onSubmit(data: FormInput) {
    const payload = {
      name: data.name,
      phone: data.phone || null,
      parent_phone: data.parent_phone || null,
      school: data.school || null,
      grade: data.grade || null,
      subjects: data.subjects,
      hourly_rate: data.hourly_rate ? parseInt(data.hourly_rate) : null,
      color: data.color,
      notes: data.notes || null,
      schedule_note: data.schedule_note || null,
      recurring_schedule: recurringSlots,
    }
    if (isEdit && student) {
      await updateStudent.mutateAsync({ id: student.id, ...payload })
    } else {
      await createStudent.mutateAsync(payload)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? '학생 수정' : '학생 추가'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
            <input {...register('name')} placeholder="홍길동" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* 학교 + 학년 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
              <input {...register('school')} placeholder="○○중학교" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
              <select {...register('grade')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">선택</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* 과목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">과목</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} type="button" onClick={() => toggleSubject(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedSubjects.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* 한달 수강료 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">한달 수강료 (원)</label>
            <input {...register('hourly_rate')} type="number" placeholder="50000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* 연락처 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학생 연락처</label>
              <input {...register('phone')} placeholder="010-0000-0000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학부모 연락처</label>
              <input {...register('parent_phone')} placeholder="010-0000-0000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* 캘린더 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">캘린더 색상</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setValue('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: selectedColor === c ? '#1f2937' : 'transparent' }} />
              ))}
            </div>
          </div>

          {/* 정기 수업 일정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정기 수업 일정</label>
            <p className="text-xs text-gray-400 mb-2">선택한 요일에 수업이 자동으로 계속 생성돼요 (직접 삭제하지 않는 한 유지)</p>
            <div className="flex gap-1.5 mb-3">
              {DAYS.map((label, idx) => {
                const active = recurringSlots.some(s => s.day === idx)
                return (
                  <button key={idx} type="button" onClick={() => toggleDay(idx)}
                    className={`w-9 h-9 rounded-full text-xs font-semibold border transition-colors ${
                      active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                    }`}>{label}</button>
                )
              })}
            </div>
            {recurringSlots.length > 0 && (
              <div className="space-y-2">
                {recurringSlots.map(slot => (
                  <div key={slot.day} className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-bold text-indigo-600 w-4">{DAYS[slot.day]}</span>
                    <input type="time" value={slot.start_time}
                      onChange={e => updateSlotTime(slot.day, 'start_time', e.target.value)}
                      className="text-xs border border-indigo-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    <span className="text-xs text-gray-400">~</span>
                    <input type="time" value={slot.end_time}
                      onChange={e => updateSlotTime(slot.day, 'end_time', e.target.value)}
                      className="text-xs border border-indigo-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea {...register('notes')} rows={2} placeholder="특이사항, 학습 목표 등" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {isSubmitting ? '저장 중...' : (isEdit ? '수정' : '추가')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
