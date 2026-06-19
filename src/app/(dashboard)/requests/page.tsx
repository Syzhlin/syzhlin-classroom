'use client'

import { useState } from 'react'
import { useAllChangeRequests, useHandleChangeRequest } from '@/lib/queries/useChangeRequests'

const TYPE_LABELS = { reschedule: '일정 변경', cancel: '수업 취소', makeup: '보강 요청' }
const STATUS_STYLES = {
  pending:  { label: '검토 중', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: '승인됨', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rejected: { label: '거절됨', bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-200' },
}

export default function RequestsPage() {
  const { data: requests = [], isLoading } = useAllChangeRequests()
  const handle = useHandleChangeRequest()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')

  const filtered = filter === 'pending' ? requests.filter(r => r.status === 'pending') : requests
  const pendingCount = requests.filter(r => r.status === 'pending').length

  async function respond(id: string, status: 'approved' | 'rejected') {
    await handle.mutateAsync({ id, status, teacher_note: note || undefined })
    setActiveId(null)
    setNote('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5 sm:mb-6">
        <h1 className="text-lg font-bold text-gray-900">수업 변경 요청</h1>
        {pendingCount > 0 && (
          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">{pendingCount}건</span>
        )}
        <div className="ml-auto flex gap-2">
          {(['pending', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"min-h-10 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors " +
                (filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500')}>
              {f === 'pending' ? '검토 중' : '전체'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm">{filter === 'pending' ? '처리할 요청이 없어요' : '요청 내역이 없어요'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const s = STATUS_STYLES[req.status]
            const isActive = activeId === req.id
            return (
              <div key={req.id} className={"rounded-2xl border p-4 bg-white " + (req.status === 'pending' ? 'border-amber-200' : 'border-gray-100')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: req.students?.color ?? '#6366f1' }}>
                      {req.students?.name?.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-gray-800">{req.students?.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{TYPE_LABELS[req.request_type]}</span>
                    </div>
                  </div>
                  <span className={"text-xs font-medium px-2.5 py-1 rounded-full " + s.bg + " " + s.text}>{s.label}</span>
                </div>

                {req.classes && (
                  <p className="text-xs text-gray-400 mt-2 ml-9">📅 수업: {req.classes.date} {req.classes.start_time.slice(0, 5)}</p>
                )}
                {req.preferred_dates && (
                  <p className="text-xs text-gray-600 mt-1 ml-9">희망: {req.preferred_dates}</p>
                )}
                {req.reason && (
                  <p className="text-xs text-gray-500 mt-1 ml-9">{req.reason}</p>
                )}
                {req.teacher_note && (
                  <p className="text-xs text-indigo-500 mt-1 ml-9">답변: {req.teacher_note}</p>
                )}
                <p className="text-[10px] text-gray-300 mt-1.5 ml-9">{req.created_at.slice(0, 10)}</p>

                {req.status === 'pending' && (
                  <div className="mt-3 ml-9">
                    {isActive ? (
                      <div className="space-y-2">
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                          placeholder="답변 메시지 (선택)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <div className="flex gap-2">
                          <button onClick={() => respond(req.id, 'rejected')} disabled={handle.isPending}
                            className="flex-1 min-h-11 py-2 border border-red-200 text-red-600 text-xs rounded-xl hover:bg-red-50">
                            거절
                          </button>
                          <button onClick={() => respond(req.id, 'approved')} disabled={handle.isPending}
                            className="flex-1 min-h-11 py-2 bg-indigo-600 text-white text-xs rounded-xl">
                            {handle.isPending ? '처리 중...' : '승인'}
                          </button>
                          <button onClick={() => { setActiveId(null); setNote('') }}
                            className="min-h-11 px-3 py-2 border border-gray-200 text-gray-400 text-xs rounded-xl">취소</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActiveId(req.id)}
                        className="min-h-10 text-xs text-indigo-600 font-medium hover:underline">
                        답변하기 →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
