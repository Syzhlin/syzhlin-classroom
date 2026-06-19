'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarDays, Users, CreditCard, LayoutDashboard,
  BookOpen, MessageSquare, ClipboardList, TrendingUp,
  Mail, MoreHorizontal, X, LogOut
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
  { href: '/materials', label: '수업 자료',  icon: BookOpen },
  { href: '/reports',   label: '성장리포트', icon: TrendingUp },
  { href: '/feedback',  label: '수업 피드백', icon: Mail },
  { href: '/messages',  label: '문의함',     icon: MessageSquare },
  { href: '/requests',  label: '변경요청',   icon: ClipboardList },
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
          <div className="relative bg-white rounded-t-2xl px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500">더보기</span>
              <button onClick={() => setShowMore(false)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
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
                    'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl px-1 text-center',
                    pathname === href ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {href === '/messages' && totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">{totalUnread}</span>
                    )}
                    {href === '/requests' && pendingRequests > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">{pendingRequests}</span>
                    )}
                  </div>
                  <span className="text-xs">{label}</span>
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-red-500 bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 flex items-center pb-[env(safe-area-inset-bottom)]">
        {primaryNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 min-h-16 flex flex-col items-center justify-center gap-1 text-xs font-medium',
              pathname === href ? 'text-indigo-600' : 'text-gray-400'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setShowMore(true)}
          className={cn(
            'flex-1 min-h-16 flex flex-col items-center justify-center gap-1 text-xs font-medium relative',
            isMoreActive ? 'text-indigo-600' : 'text-gray-400'
          )}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {(totalUnread > 0 || pendingRequests > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
          더보기
        </button>
      </nav>
    </>
  )
}
