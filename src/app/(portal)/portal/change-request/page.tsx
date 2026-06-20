'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { useMyChangeRequests, useSubmitChangeRequest } from '@/lib/queries/useChangeRequests'
import { usePortalClasses } from '@/lib/queries/useClasses'

const TYPE_LABELS = {
  reschedule: '일정 변경',
  cancel: '수업 취소',
  makeup: '보강 요청',
}

const STATUS_STYLES = {
  pending:  { label: '검토 중', bg: 'bg-amber-50', text: 'text-amber-600' },
  approved: { label: '승인됨', bg: 'bg-green-50', text: 'text-green-600' },
  rejected: { label: '거절됨', bg: 'bg-red-50', text: 'text-red-500' },
}

export default function ChangeRequestPage() {
  const { data: profile } = useProfile()
  const { selectedStudentId: studentId } = usePortalStudent()

  const { data: requests = [], isLoading } = useMyChangeRequests(studentId)
  const { data: classes = [] } = usePortalClasses(studentId)
  const submit = useSubmitChangeRequest()

  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'reschedule' | 'cancel' | 'makeup'>('reschedule')
  const [classId, setClassId] = useState('')
  const [preferredDates, setPreferredDates] = useState('')
  const [reason, setReason] = useState('')

  const scheduledClasses = classes.filter((c: any) => c.status === 'scheduled')

  async function handleSubmit() {
    if (!studentId) return
    await submit.mutateAsync({
      student_id: studentId,
      class_id: classId || undefined,
      request_type: type,
      preferred_dates: preferredDates || undefined,
      reason: reason || undefined,
    })
    setShowForm(false)
    setType('reschedule')
    setClassId('')
    setPreferredDates('')
    setReason('')
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">수업 변경 요청</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium"
        >
          + 요청하기
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800">새 요청</h2>

          <div>
            <p className="text-xs text-gray-500 mb-2">요청 유형</p>
            <div className="flex gap-2">
              {(['reschedule', 'cancel', 'makeup'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={"flex-1 py-2 text-xs font-medium rounded-xl border transition-colors " +
                    (type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600')}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {scheduledClasses.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">해당 수업 (선택)</p>
              <select value={classId} onChange={e => setClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">수업을 선택하세요</option>
                {scheduledClasses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.date} {c.start_time.slice(0, 5)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type !== 'cancel' && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                {type === 'reschedule' ? '희망 변경 날짜' : '보강 희망 날짜'}
              </p>
              <input type="text" value={preferredDates} onChange={e => setPreferredDates(e.target.value)}
                placeholder="예) 6/25(수) 오후 4시, 6/27(금) 오후 5시"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-2">사유 (선택)</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="변경이 필요한 이유를 알려주세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl">취소</button>
            <button onClick={handleSubmit} disabled={submit.isPending}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-60">
              {submit.isPending ? '제출 중...' : '요청 제출'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center pt-8">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm">아직 요청 내역이 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const s = STATUS_STYLES[req.status as keyof typeof STATUS_STYLES]
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{TYPE_LABELS[req.request_type as keyof typeof TYPE_LABELS]}</span>
                  <span className={"text-xs font-medium px-2.5 py-1 rounded-full " + s.bg + " " + s.text}>{s.label}</span>
                </div>
                {req.classes && (
                  <p className="text-xs text-gray-400 mb-1">수업: {req.classes.date} {req.classes.start_time.slice(0, 5)}</p>
                )}
                {req.preferred_dates && <p className="text-xs text-gray-600">📅 {req.preferred_dates}</p>}
                {req.reason && <p className="text-xs text-gray-500 mt-1">{req.reason}</p>}
                {req.teacher_note && (
                  <div className="mt-3 bg-indigo-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-indigo-500 font-medium mb-0.5">선생님 답변</p>
                    <p className="text-xs text-gray-700">{req.teacher_note}</p>
                  </div>
                )}
                <p className="text-[10px] text-gray-300 mt-2">{req.created_at.slice(0, 10)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
