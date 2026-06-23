'use client'

import { useState, useEffect } from 'react'
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
}

const DISMISS_KEY = 'sz_dismissed_notifications'

function loadDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * 학부모/학생 포털 알림 벨.
 * 별도 notifications 테이블 없이 기존 데이터(선생님 메시지 + 결제 상태)를 모아 알림으로 보여준다.
 * 알림을 누르면(이동) 또는 ✕로 종에서 삭제(localStorage에 기억)할 수 있다.
 */
export default function PortalNotificationBell() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { selectedStudentId, linkedStudentName } = usePortalStudent()
  const role = profile?.role
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => { setDismissed(loadDismissed()) }, [])

  const channelType = role === 'student' ? 'student' : 'parent'
  const { data: messages = [] } = useMessages(selectedStudentId, channelType)
  const yearMonth = format(new Date(), 'yyyy-MM')
  const { data: payment } = usePortalPayment(selectedStudentId, yearMonth)

  if (!role || role === 'teacher') return null

  const allItems: NotiItem[] = []

  // 1) 선생님이 보낸 안 읽은 메시지
  for (const m of messages) {
    if (m.sender_role === 'teacher' && !m.read_at) {
      allItems.push({
        id: `msg-${m.id}`,
        title: '선생님 메시지',
        body: m.body,
        time: m.created_at,
        href: '/portal/inquiry',
      })
    }
  }

  // 2) 결제 안내 (회차 완료 또는 결제 요청, 미완납) — 상태가 바뀌면 id도 바뀌어 다시 뜸
  if ((role === 'parent' || role === 'adult_learner') && payment && payment.status !== '완납') {
    const nm = (linkedStudentName && linkedStudentName.trim()) ? linkedStudentName.trim() : '자녀'
    allItems.push({
      id: `pay-${selectedStudentId ?? ''}-${payment.status}-${payment.completed_sessions}/${payment.total_sessions}`,
      title: '결제 안내',
      body: `${nm} 수업료 결제 요청이 왔어요. 결제 탭에서 확인해 주세요.`,
      href: '/portal/payment',
    })
  }

  // 삭제된 알림 제외
  const items = allItems.filter(it => !dismissed.includes(it.id))
  items.sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''))
  const unreadCount = items.length

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = Array.from(new Set([...prev, id])).slice(-200)
      try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function go(it: NotiItem) {
    dismiss(it.id)
    setOpen(false)
    router.push(it.href)
  }

  return (
    <>
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
                  <div
                    key={it.id}
                    className="flex items-start gap-2 px-3 py-3 border-b"
                    style={{ borderColor: 'rgba(175,196,216,0.12)' }}
                  >
                    <button
                      type="button"
                      onClick={() => go(it)}
                      className="flex-1 text-left min-w-0"
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
                    <button
                      type="button"
                      onClick={() => dismiss(it.id)}
                      aria-label="알림 삭제"
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--sz-bg-pastel)]"
                      style={{ color: 'var(--sz-text-muted)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => items.forEach(it => dismiss(it.id))}
                className="w-full py-2.5 text-[11px] font-bold border-t"
                style={{ color: 'var(--sz-blue-soft)', borderColor: 'rgba(175,196,216,0.2)' }}
              >
                모두 지우기
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
