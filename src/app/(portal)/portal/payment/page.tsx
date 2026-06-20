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
      className="w-full flex items-center justify-between rounded-2xl px-4 py-3"
      style={{backgroundColor: 'var(--sz-peach-pale)', borderRadius: '16px'}}
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
  const { selectedStudentId: linkedId } = usePortalStudent()
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
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-sm font-semibold text-[var(--sz-text-muted)] mb-4">
          {year}년 {month}월 결제 현황
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

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h2 className="text-sm font-semibold text-[var(--sz-text-muted)]">
        {year}년 {month}월 결제 현황
      </h2>

      {/* Status card */}
      <div className="sz-widget rounded-3xl p-6 space-y-5" style={{backgroundColor: 'var(--sz-card-pastel)'}}>
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
          <div className="w-full rounded-full h-2" style={{backgroundColor: 'rgba(175,196,216,0.15)'}}>
            <div
              className="h-2 rounded-full transition-all"
              style={{backgroundColor: "var(--sz-navy)", width: `${progress}%`}}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>예정 {payment.planned_sessions}회</span>
            {payment.bonus_sessions > 0 && <span>보강 +{payment.bonus_sessions}회</span>}
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

        {/* Payment link */}
        {payment.payment_link && (
          <div className="border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
            <a
              href={payment.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-center py-2.5 text-sm font-medium rounded-xl transition-colors ${
                payment.status === '완납'
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-[var(--sz-navy)] text-white hover:bg-[var(--sz-navy-light)]'
              }`}
            >
              {payment.status === '완납' ? '결제 링크 바로가기' : '결제하기'}
            </a>
          </div>
        )}


        {/* 계좌 정보 */}
        <div className="border-t pt-4" style={{borderColor: 'rgba(175,196,216,0.15)'}}>
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
