'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarDays, Users, CreditCard, LayoutDashboard,
  BookOpen, MessageSquare, ClipboardList, TrendingUp,
  Mail, MoreHorizontal, X, LogOut, Activity
} from 'lucide-react'
import { useAllStudentMessages } from '@/lib/queries/useMessages'
import { useAllChangeRequests } from '@/lib/queries/useChangeRequests'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const primaryNav = [
  { href: '/',         label: '홈',    icon: LayoutDashboard },
  { href: '/schedule', label: '일정',  icon: CalendarDays },
  { href: '/students', label: '학생',  icon: Users },
  { href: '/payments', label: '정산',  icon: CreditCard },
]

const moreNav = [
  { href: '/materials',      label: '수업 자료 관리', icon: BookOpen },
  { href: '/reports',        label: '성장 리포트', icon: TrendingUp },
  { href: '/feedback',       label: '수업 피드백', icon: Mail },
  { href: '/messages',       label: '문의함',     icon: MessageSquare },
  { href: '/requests',       label: '일정 변경 요청', icon: ClipboardList },
  { href: '/activity-logs',  label: '활동 로그',  icon: Activity },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)
  const { data: threads = [] } = useAllStudentMessages()
  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0)
  const { data: changeReqs = [] } = useAllChangeRequests()
  const pendingRequests = changeReqs.filter(r => r.status === 'pending').length

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isMoreActive = moreNav.some(item => pathname === item.href)

  return (
    <>
      {/* 더보기 시트 */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMore(false)} />
          <div className="relative rounded-t-3xl px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-10" style={{backgroundColor: "var(--sz-card-pastel)", boxShadow: "0 -4px 24px rgba(46,53,69,0.06)"}}>
            {/* 핸들바 */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full" style={{backgroundColor: "rgba(175,196,216,0.4)"}} />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{color: "var(--sz-text-muted)"}}>더보기</span>
              <button onClick={() => setShowMore(false)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full" style={{color: "var(--sz-text-muted)", backgroundColor: "rgba(175,196,216,0.15)"}}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 min-[390px]:grid-cols-4 gap-2.5 mb-4">
              {moreNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-center'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {href === '/messages' && totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-semibold" style={{backgroundColor: "var(--sz-blue-soft)"}}>{totalUnread}</span>
                    )}
                    {href === '/requests' && pendingRequests > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-semibold" style={{backgroundColor: "var(--sz-peach)"}}>{pendingRequests}</span>
                    )}
                  </div>
                  <span className="text-xs">{label}</span>
                </Link>
              ))}
            </div>
            <div className="border-t pt-3 mt-1" style={{borderColor: "rgba(175,196,216,0.15)"}}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-colors"
                style={{color: "var(--sz-text-muted)"}}
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center pb-[env(safe-area-inset-bottom)]" style={{backgroundColor: "rgba(255,253,246,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(175,196,216,0.25)"}}>
        {primaryNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 min-h-16 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: pathname === href ? 'var(--sz-blue-soft)' : 'var(--sz-text-muted)' }}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 min-h-16 flex flex-col items-center justify-center gap-1 text-xs font-semibold relative transition-colors"
          style={{ color: isMoreActive ? 'var(--sz-blue-soft)' : 'var(--sz-text-muted)' }}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {(totalUnread > 0 || pendingRequests > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{backgroundColor: "var(--sz-pink-soft)"}} />
            )}
          </div>
          더보기
        </button>
      </nav>
    </>
  )
}
