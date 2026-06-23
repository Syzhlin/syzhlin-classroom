'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { useMessages } from '@/lib/queries/useMessages'
import { usePortalPayment } from '@/lib/queries/usePayments'

type NotiItem = {
  id: string
  title: string
  body: string
  time?: string
  href: string
  unread: boolean
}

/**
 * 학부모/학생 포털 알림 벨.
 * 별도 notifications 테이블 없이 기존 데이터(선생님 메시지 + 결제 상태)를 모아 알림으로 보여준다.
 *  - 선생님이 보낸 안 읽은 메시지(결제 안내 등) → 문의함으로 이동
 *  - 결제가 필요한 상태(회차 완료/결제 요청) → 결제 페이지로 이동
 */
export default function PortalNotificationBell() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { selectedStudentId } = usePortalStudent()
  const role = profile?.role
  const [open, setOpen] = useState(false)

  const channelType = role === 'student' ? 'student' : 'parent'
  const { data: messages = [] } = useMessages(selectedStudentId, channelType)
  const yearMonth = format(new Date(), 'yyyy-MM')
  const { data: payment } = usePortalPayment(selectedStudentId, yearMonth)

  // 알림 표시 대상 역할 (선생님 본인 화면 제외)
  if (!role || role === 'teacher') return null

  const items: NotiItem[] = []

  // 1) 선생님이 보낸 안 읽은 메시지
  for (const m of messages) {
    if (m.sender_role === 'teacher' && !m.read_at) {
      items.push({
        id: `msg-${m.id}`,
        title: '선생님 메시지',
        body: m.body,
        time: m.created_at,
        href: '/portal/inquiry',
        unread: true,
      })
    }
  }

  // 2) 결제 안내 (회차 완료 또는 결제 요청, 미완납)
  if ((role === 'parent' || role === 'adult_learner') && payment && payment.status !== '완납') {
    const sessionsDone = payment.total_sessions > 0 && payment.completed_sessions >= payment.total_sessions
    if (sessionsDone || payment.payment_requested) {
      items.push({
        id: 'pay',
        title: '결제 안내',
        body: sessionsDone ? '이번 패키지 수업을 모두 완료했어요. 결제를 진행해 주세요.' : '선생님이 결제를 요청했어요.',
        href: '/portal/payment',
        unread: true,
      })
    }
  }

  // 최신순 정렬
  items.sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''))
  const unreadCount = items.length

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* 배경 클릭 닫기 */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="relative z-50">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-label="알림"
          className="relative flex items-center justify-center w-9 h-9 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
        >
          <span style={{ fontSize: '16px' }}>🔔</span>
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
              style={{ backgroundColor: 'var(--sz-pink-soft)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl overflow-hidden shadow-2xl z-50"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(175,196,216,0.3)' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(175,196,216,0.2)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--sz-text-deep)' }}>알림</p>
              <p className="text-[11px]" style={{ color: 'var(--sz-text-muted)' }}>새 알림 {unreadCount}건</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-center text-xs py-8" style={{ color: 'var(--sz-text-muted)' }}>새 알림이 없어요</p>
              ) : (
                items.map(it => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => go(it.href)}
                    className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-[var(--sz-bg-pastel)]"
                    style={{ borderColor: 'rgba(175,196,216,0.12)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold" style={{ color: 'var(--sz-text-deep)' }}>{it.title}</p>
                      {it.time && (
                        <span className="text-[10px]" style={{ color: 'var(--sz-text-muted)' }}>
                          {new Date(it.time).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'var(--sz-text-muted)' }}>
                      {it.body}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
