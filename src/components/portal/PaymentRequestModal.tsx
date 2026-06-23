'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type HomePayment = {
  status: string
  completed_sessions: number
  total_sessions: number
  payment_requested?: boolean
} | null | undefined

const CLOSED_KEY = 'sz_pay_modal_closed'

/**
 * 결제 요청 팝업 (학부모 홈).
 *  - 결제 상태가 '완납'이 아니면(=미납/부분납) 홈 진입 시 뜬다. (완납은 선생님이 '완납 승인'을 눌러야만)
 *  - 자녀별로 뜨며, 선택한 자녀 이름으로 안내한다. (예: "Colin 수업료 요청이 왔습니다!")
 *  - "나중에 다시 알림" → 이번만 닫고, 홈에 접속할 때마다 다시 뜬다.
 *  - "닫기" → 이 결제 건은 다시 안 뜬다(상태가 바뀌면 다시 뜸).
 */
export default function PaymentRequestModal({ payment, role, studentName, studentKey }: { payment: HomePayment; role?: string; studentName?: string; studentKey?: string }) {
  const [show, setShow] = useState(false)

  const isParentSide = role === 'parent' || role === 'adult_learner'
  // 팝업은 선생님이 '결제 요청'을 눌렀을 때(payment_requested)만 뜬다. 완납이면 안 뜸.
  const active = isParentSide && !!payment && payment.status !== '완납' && !!payment.payment_requested
  // 자녀+요청상태별 키 → 자녀가 바뀌거나 요청/상태가 바뀌면 다시 뜬다.
  const stateKey = payment ? `${studentKey ?? ''}-${payment.status}-req${payment.payment_requested ? 1 : 0}` : ''

  useEffect(() => {
    if (!active) { setShow(false); return }
    let closed: string | null = null
    try { closed = localStorage.getItem(CLOSED_KEY) } catch {}
    setShow(closed !== stateKey)
  }, [active, stateKey])

  if (!show || !active) return null

  const name = (studentName && studentName.trim()) ? studentName.trim() : '자녀'

  function remindLater() {
    setShow(false) // 저장 안 함 → 다음 홈 접속 때 다시 뜸
  }

  function closeForever() {
    try { localStorage.setItem(CLOSED_KEY, stateKey) } catch {}
    setShow(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(31,42,68,0.45)' }}
      onClick={remindLater}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ backgroundColor: '#FFFDF8', boxShadow: '0 20px 50px rgba(31,42,68,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">💳</div>
          <h2 className="text-lg font-extrabold" style={{ color: 'var(--sz-text-deep)' }}>{name} 수업료 요청이 왔습니다!</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--sz-text-muted)' }}>
            선생님이 {name} 수업료 결제를 기다리고 있어요. 결제 탭에서 확인해 주세요.
          </p>
        </div>

        <Link
          href="/portal/payment"
          onClick={() => setShow(false)}
          className="block w-full text-center mt-5 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--sz-navy)' }}
        >
          결제하러 가기 →
        </Link>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={remindLater}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}
          >
            나중에 다시 알림
          </button>
          <button
            type="button"
            onClick={closeForever}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: 'rgba(175,196,216,0.18)', color: 'var(--sz-text-muted)' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
