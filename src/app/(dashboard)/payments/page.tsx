'use client'

import { useState } from 'react'
import { useMonthPayments, useUpdatePayment } from '@/lib/queries/usePayments'
import type { PaymentWithStudent } from '@/lib/queries/usePayments'
import { useSendMessage } from '@/lib/queries/useMessages'

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`
    months.push({ val, label })
  }
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-[rgba(175,196,216,0.3)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]"
    >
      {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
    </select>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    완납: 'bg-[var(--sz-sage-pale)] text-[var(--sz-sage)]',
    미납: 'bg-[var(--sz-pink-pale)] text-[var(--sz-pink-soft)]',
    부분납: 'bg-[var(--sz-peach-pale)] text-[var(--sz-peach)]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)]'}`}>
      {status}
    </span>
  )
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[rgba(175,196,216,0.1)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : '#6366f1' }}
        />
      </div>
      <span className="text-xs text-[var(--sz-text-muted)] tabular-nums whitespace-nowrap">
        {completed}/{total}회
      </span>
    </div>
  )
}

function PaymentCard({ payment, onEdit, onRequestToggle, onBonusChange }: { payment: PaymentWithStudent; onEdit: (p: PaymentWithStudent) => void; onRequestToggle: (p: PaymentWithStudent) => void; onBonusChange: (p: PaymentWithStudent, delta: number) => void }) {
  const remaining = payment.total_sessions - payment.completed_sessions
  const isOver = payment.completed_sessions > payment.planned_sessions

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: payment.student.color ?? '#6366f1' }}
          >
            {payment.student.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[var(--sz-text-deep)]">{payment.student.name}</span>
              {payment.bonus_sessions > 0 && (
                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                  +{payment.bonus_sessions}보너스
                </span>
              )}
              {isOver && (
                <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
                  초과진행
                </span>
              )}
            </div>
            {payment.student.schedule_note && (
              <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">{payment.student.schedule_note}</p>
            )}
          </div>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      {/* 보너스 조절 */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-[var(--sz-text-muted)] opacity-70">보너스</span>
        <div className="flex items-center gap-1">
        <button
            onClick={() => onBonusChange(payment, -1)}
            disabled={payment.bonus_sessions <= 0}
            className="min-h-10 min-w-10 rounded-md border border-[rgba(175,196,216,0.3)] text-[var(--sz-text-muted)] text-sm font-bold hover:bg-[rgba(175,196,216,0.1)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >−</button>
          <span className="text-sm font-semibold text-orange-600 w-5 text-center">{payment.bonus_sessions}</span>
          <button
            onClick={() => onBonusChange(payment, +1)}
            className="min-h-10 min-w-10 rounded-md border border-[rgba(175,196,216,0.4)] text-[var(--sz-blue-soft)] text-sm font-bold hover:bg-[var(--sz-blue-pale)] transition-colors flex items-center justify-center"
          >+</button>
        </div>
        <span className="text-xs text-[var(--sz-text-muted)] opacity-70">회 추가</span>
      </div>

      {/* 진행 현황 */}
      <div className="mt-4">
        <ProgressBar completed={payment.completed_sessions} total={payment.total_sessions} />
        <div className="flex justify-between mt-1.5 text-xs text-[var(--sz-text-muted)] opacity-70">
          <span>예정 {payment.planned_sessions}회 · 총 {payment.total_sessions}회</span>
          <span>{remaining > 0 ? `잔여 ${remaining}회` : '완료'}</span>
        </div>
      </div>

      {/* 결제 정보 */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold text-[var(--sz-text-deep)]">{payment.amount.toLocaleString()}원</p>
          <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">{payment.payment_period}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {payment.payment_link ? (
            <a
              href={payment.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-10 text-xs px-2.5 py-1.5 bg-[var(--sz-blue-pale)] text-[var(--sz-blue-soft)] rounded-lg hover:bg-indigo-100 transition-colors font-medium inline-flex items-center"
            >
              결제링크 →
            </a>
          ) : payment.payment_method === '계좌이체' ? (
            <span className="min-h-10 text-xs px-2.5 py-1.5 bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)] rounded-lg inline-flex items-center">계좌이체</span>
          ) : null}
          {payment.status === '완납' && (
            <span className="min-h-10 text-xs px-2.5 py-1.5 rounded-lg font-medium inline-flex items-center"
              style={{ backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }}>
              완납됨 ✓
            </span>
          )}
          {/* 결제 요청 버튼 — 완납이어도 다음 결제 요청을 보낼 수 있도록 항상 표시 */}
          <button
            onClick={() => onRequestToggle(payment)}
            className={`min-h-10 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              payment.payment_requested
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            {payment.payment_requested ? '요청 보냄 ✓' : '결제 요청 보내기'}
          </button>
          <button
            onClick={() => onEdit(payment)}
            className="min-h-10 text-xs px-2.5 py-1.5 border border-[rgba(175,196,216,0.3)] text-[var(--sz-text-muted)] rounded-lg hover:bg-[var(--sz-bg-pastel)] transition-colors"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ payment, onClose }: { payment: PaymentWithStudent; onClose: () => void }) {
  const updatePayment = useUpdatePayment()
  const [completed, setCompleted] = useState(payment.completed_sessions)
  const [bonus, setBonus] = useState(payment.bonus_sessions)
  const [status, setStatus] = useState(payment.status)
  const [amount, setAmount] = useState(payment.amount)

  async function handleSave() {
    await updatePayment.mutateAsync({
      id: payment.id,
      completed_sessions: completed,
      bonus_sessions: bonus,
      total_sessions: payment.planned_sessions + bonus,
      status,
      amount,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative sz-widget rounded-2xl shadow-xl w-[calc(100vw-2rem)] max-w-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--sz-text-deep)]">{payment.student.name} 수정</h2>
          <button onClick={onClose} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-[var(--sz-text-muted)] opacity-70 hover:bg-[rgba(175,196,216,0.1)] hover:text-[var(--sz-text-muted)] text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--sz-text-deep)] mb-1">진행 회차</label>
            <input
              type="number"
              value={completed}
              onChange={e => setCompleted(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[rgba(175,196,216,0.3)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--sz-text-deep)] mb-1">보너스 회차</label>
            <input
              type="number"
              value={bonus}
              onChange={e => setBonus(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[rgba(175,196,216,0.3)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--sz-text-deep)] mb-1">금액</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[rgba(175,196,216,0.3)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--sz-text-deep)] mb-1">결제 상태</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as '완납' | '미납' | '부분납')}
              className="w-full px-3 py-2 border border-[rgba(175,196,216,0.3)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]"
            >
              <option value="완납">완납</option>
              <option value="미납">미납</option>
              <option value="부분납">부분납</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 min-h-11 py-2.5 border border-[rgba(175,196,216,0.3)] text-[var(--sz-text-muted)] text-sm rounded-lg hover:bg-[var(--sz-bg-pastel)]">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={updatePayment.isPending}
            className="flex-1 min-h-11 py-2.5 bg-[var(--sz-blue-soft)] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-60"
          >
            {updatePayment.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [yearMonth, setYearMonth] = useState(defaultMonth)
  const [editTarget, setEditTarget] = useState<PaymentWithStudent | null>(null)

  const { data: payments, isLoading } = useMonthPayments(yearMonth)
  const updatePayment = useUpdatePayment()
  const sendMessage = useSendMessage()
  const [requestMsg, setRequestMsg] = useState('')

  async function handleRequestToggle(p: PaymentWithStudent) {
    const turningOn = !p.payment_requested
    await updatePayment.mutateAsync({ id: p.id, payment_requested: turningOn })
    // 결제 요청을 "보낼 때"만 학부모에게 자동 메시지 발송
    if (turningOn) {
      const [, mm] = yearMonth.split('-')
      const body = `[결제 안내] ${p.student.name} 학생 ${parseInt(mm)}월 수업료 ${p.amount.toLocaleString()}원 결제 안내드립니다. 앱 '결제' 탭에서 확인 부탁드려요. 🙏`
      try {
        await sendMessage.mutateAsync({ student_id: p.student_id, body, sender_role: 'teacher', channel_type: 'parent' })
        setRequestMsg(`${p.student.name} 학부모님께 결제 안내 메시지를 보냈어요 ✓`)
      } catch {
        setRequestMsg(`${p.student.name} 결제 요청은 표시됐지만 메시지 전송에 실패했어요.`)
      }
      setTimeout(() => setRequestMsg(''), 4000)
    }
  }

  async function handleBonusChange(p: PaymentWithStudent, delta: number) {
    const newBonus = Math.max(0, p.bonus_sessions + delta)
    await updatePayment.mutateAsync({
      id: p.id,
      bonus_sessions: newBonus,
      total_sessions: p.planned_sessions + newBonus,
    })
  }

  const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0
  const paidCount = payments?.filter(p => p.status === '완납').length ?? 0
  const totalSessions = payments?.reduce((sum, p) => sum + p.total_sessions, 0) ?? 0
  const completedSessions = payments?.reduce((sum, p) => sum + p.completed_sessions, 0) ?? 0

  const [year, month] = yearMonth.split('-')
  const displayMonth = `${year}년 ${parseInt(month)}월`

  return (
    <div className="w-full max-w-4xl p-4 sm:p-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:items-center sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--sz-text-deep)]">결제 관리</h1>
          <p className="mt-0.5 text-sm text-[var(--sz-text-muted)]">{displayMonth}</p>
        </div>
        <MonthPicker value={yearMonth} onChange={setYearMonth} />
      </div>

      {requestMsg && (
        <div className="mb-4 rounded-xl px-4 py-2.5 text-sm font-medium" style={{ backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }}>
          {requestMsg}
        </div>
      )}

      {/* 요약 카드 */}
      {!isLoading && payments && payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70">총 수입</p>
            <p className="mt-1 text-lg font-bold text-[var(--sz-text-deep)]">{totalAmount.toLocaleString()}원</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70">완납</p>
            <p className="mt-1 text-lg font-bold text-green-600">{paidCount}/{payments.length}명</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70">총 수업 수</p>
            <p className="mt-1 text-lg font-bold text-[var(--sz-text-deep)]">{totalSessions}회</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70">진행 완료</p>
            <p className="mt-1 text-lg font-bold text-[var(--sz-blue-soft)]">{completedSessions}회</p>
          </div>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-[rgba(175,196,216,0.1)] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && (!payments || payments.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">💳</div>
          <p className="font-medium text-[var(--sz-text-deep)]">{displayMonth} 결제 데이터가 없어요</p>
          <p className="mt-1 text-sm text-[var(--sz-text-muted)] opacity-70">다른 월을 선택하거나 결제 정보를 추가해주세요</p>
        </div>
      )}

      {/* 학생 카드 목록 */}
      {!isLoading && payments && payments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payments.map(p => (
            <PaymentCard key={p.id} payment={p} onEdit={setEditTarget} onRequestToggle={handleRequestToggle} onBonusChange={handleBonusChange} />
          ))}
        </div>
      )}

      {editTarget && (
        <EditModal payment={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  )
}
