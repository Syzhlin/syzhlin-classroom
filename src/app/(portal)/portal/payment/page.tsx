'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalPayment } from '@/lib/queries/usePayments'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; style: React.CSSProperties }> = {
  '완납': { bg: '', text: '', label: '완납', style: {backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)'} },
  '미납': { bg: '', text: '', label: '미납', style: {backgroundColor: 'var(--sz-pink-pale)', color: 'var(--sz-pink-soft)'} },
  '부분납': { bg: '', text: '', label: '부분납', style: {backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)'} },
}

const ACCOUNT = { bank: '카카오뱅크', number: '3333-05-6910585', name: '김세진' }

function AccountCopyButton() {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(ACCOUNT.number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: 'rgba(242,199,166,0.2)', border: '1px solid rgba(242,199,166,0.3)', borderRadius: '16px' }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-lg">🏦</span>
        <div className="text-left">
          <p className="text-xs text-gray-400">{ACCOUNT.bank} · {ACCOUNT.name}</p>
          <p className="text-sm font-semibold text-gray-800 tracking-wide">{ACCOUNT.number}</p>
        </div>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
        copied ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 border border-gray-200'
      }`}>
        {copied ? '복사됨 ✓' : '복사'}
      </span>
    </button>
  )
}

export default function PortalPaymentPage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { selectedStudentId: linkedId, linkedStudentName } = usePortalStudent()
  const [currentYearMonth, setCurrentYearMonth] = useState(format(new Date(), 'yyyy-MM'))
  useEffect(() => { setCurrentYearMonth(format(new Date(), 'yyyy-MM')) }, [])
  const { data: payment, isLoading: paymentLoading } = usePortalPayment(linkedId, currentYearMonth)

  if (profileLoading || paymentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full animate-spin" style={{border: '2px solid var(--sz-blue-soft)', borderTopColor: 'transparent'}} />
      </div>
    )
  }

  if (!linkedId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="font-semibold text-gray-800 text-lg">계정 연결 중</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          선생님이 계정을 연결 중입니다.
        </p>
      </div>
    )
  }

  const [year, month] = currentYearMonth.split('-')

  if (!payment) {
    return (
      <div className="max-w-lg mx-auto px-4" style={{ paddingTop: '20px' }}>
        <h2 className="text-xs font-bold mb-4" style={{ color: 'var(--sz-text-muted)' }}>
          {linkedStudentName ? `${linkedStudentName} · ` : ""}{year}년 {month}월 결제 현황
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          이번 달 결제 정보가 없습니다
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[payment.status] ?? { bg: '', text: '', label: payment.status, style: {backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)'} }
  const progress = payment.total_sessions > 0
    ? Math.round((payment.completed_sessions / payment.total_sessions) * 100)
    : 0

  // 결제하기 자동 활성화 조건:
  //  - 아직 완납이 아니고
  //  - (이번 패키지 수업을 모두 완료했거나 || 선생님이 결제를 요청했을 때)
  // 완납이 아니면(미납/부분납) 결제하기 활성화. 완납은 선생님 '완납 승인'으로만.
  const paymentActive = payment.status !== '완납'

  return (
    <div className="max-w-lg mx-auto px-4 space-y-4" style={{ paddingTop: '20px' }}>
      <h2 className="text-xs font-bold" style={{ color: 'var(--sz-text-muted)' }}>
        {linkedStudentName ? `${linkedStudentName} · ` : ""}{year}년 {month}월 결제 현황
      </h2>

      {/* Status card */}
      <div className="space-y-5" style={{ backgroundColor: '#FFFDF8', boxShadow: '7px 7px 20px rgba(100,88,65,0.09), -4px -4px 12px rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '28px', padding: '24px' }}>
        {/* 결제 활성화 안내 배너 — 수업 완료 또는 선생님 결제 요청 시 */}
        {paymentActive && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'var(--sz-pink-pale)', border: '1px solid rgba(242,199,166,0.45)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--sz-pink-soft)' }}>
              🔔 수업료 결제가 필요해요
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--sz-text-muted)' }}>
              다음 수업을 위해 아래 <strong>결제하기</strong>로 결제를 진행해 주세요.
            </p>
          </div>
        )}

        {/* Big status badge */}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-800">납부 상태</span>
          <span className="text-sm font-bold px-4 py-1.5 rounded-full" style={statusStyle.style}>
            {statusStyle.label}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
          <span className="text-sm text-gray-500">수업료</span>
          <span className="text-lg font-bold text-gray-900">
            {payment.amount.toLocaleString()}원
          </span>
        </div>

        {/* Session progress */}
        <div className="space-y-2 border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">수업 진행</span>
            <span className="text-sm font-medium text-gray-800">
              {payment.completed_sessions} / {payment.total_sessions}회
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: 'rgba(175,196,216,0.15)', boxShadow: 'inset 2px 2px 5px rgba(120,130,150,0.12), inset -2px -2px 5px rgba(255,255,255,0.9)' }}>
            <div
              style={{ height: '10px', borderRadius: '999px', transition: 'width 0.7s ease', width: `${progress}%`, background: 'linear-gradient(to right, var(--sz-blue-soft), #8BB8D8)', boxShadow: '0 2px 6px rgba(100,140,180,0.3)' }}
            />
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sz-text-muted)' }}>
            기본 {payment.planned_sessions}회{payment.bonus_sessions > 0 ? ` + 보강 ${payment.bonus_sessions}회` : ''} = 총 {payment.total_sessions}회
          </div>
        </div>

        {/* Payment period */}
        {payment.payment_period && (
          <div className="flex items-center justify-between border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
            <span className="text-sm text-gray-500">결제 기간</span>
            <span className="text-sm text-gray-700">{payment.payment_period}</span>
          </div>
        )}

        {/* Payment method */}
        {payment.payment_method && (
          <div className="flex items-center justify-between border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
            <span className="text-sm text-gray-500">결제 방법</span>
            <span className="text-sm text-gray-700">{payment.payment_method}</span>
          </div>
        )}

        {/* Payment link / 결제하기 — 링크가 있으면 링크로, 없으면 계좌 안내로 */}
        {(payment.payment_link || paymentActive) && (
          <div className="border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
            <a
              href={payment.payment_link || '#account-info'}
              {...(payment.payment_link ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`block w-full text-center py-2.5 text-sm font-medium rounded-xl transition-colors ${
                payment.status === '완납'
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-[var(--sz-navy)] text-white hover:bg-[var(--sz-navy-light)]'
              } ${paymentActive ? 'animate-pulse' : ''}`}
              style={paymentActive ? { boxShadow: '0 0 0 2px var(--sz-peach), 0 4px 12px rgba(242,199,166,0.4)' } : undefined}
            >
              {payment.status === '완납' ? '결제 링크 바로가기' : payment.payment_link ? '결제하기' : '결제하기 (계좌 안내)'}
            </a>
          </div>
        )}


        {/* 계좌 정보 */}
        <div id="account-info" className="border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
          <p className="text-xs text-gray-400 mb-2">입금 계좌</p>
          <AccountCopyButton />
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
            <p className="text-xs text-gray-400 leading-relaxed">{payment.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
