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
 *  - 선생님이 결제를 요청했거나 회차를 모두 완료하면(미완납) 홈 진입 시 뜬다.
 *  - "나중에 다시 알림" → 이번만 닫고, 홈에 접속할 때마다 다시 뜬다.
 *  - "닫기" → 이 결제 건은 다시 안 뜬다(새 요청/상태 변화 시 다시 뜸).
 */
export default function PaymentRequestModal({ payment, role }: { payment: HomePayment; role?: string }) {
  const [show, setShow] = useState(false)

  const isParentSide = role === 'parent' || role === 'adult_learner'
  const sessionsDone = !!payment && payment.total_sessions > 0 && payment.completed_sessions >= payment.total_sessions
  const active = isParentSide && !!payment && payment.status !== '완납' && (sessionsDone || !!payment.payment_requested)
  const stateKey = payment ? `${payment.payment_requested ? 'req' : ''}-${payment.completed_sessions}/${payment.total_sessions}` : ''

  useEffect(() => {
    if (!active) { setShow(false); return }
    let closed: string | null = null
    try { closed = localStorage.getItem(CLOSED_KEY) } catch {}
    // "닫기"로 영구 닫은 상태(stateKey 동일)면 안 띄움. 그 외엔 매 접속마다 띄움.
    setShow(closed !== stateKey)
  }, [active, stateKey])

  if (!show || !active) return null

  function remindLater() {
    // 저장하지 않음 → 다음 홈 접속 때 다시 뜬다
    setShow(false)
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
          <h2 className="text-lg font-extrabold" style={{ color: 'var(--sz-text-deep)' }}>결제 요청이 왔어요!</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--sz-text-muted)' }}>
            {sessionsDone
              ? '이번 패키지 수업을 모두 완료했어요. 다음 수업을 위해 결제를 진행해 주세요.'
              : '선생님이 수업료 결제를 요청했어요. 결제 탭에서 확인해 주세요.'}
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
