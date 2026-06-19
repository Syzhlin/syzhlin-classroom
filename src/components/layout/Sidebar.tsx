'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, Users, CreditCard, LayoutDashboard, LogOut, BookOpen, MessageSquare, ClipboardList, TrendingUp, Mail } from 'lucide-react'
import { useAllStudentMessages } from '@/lib/queries/useMessages'
import { useAllChangeRequests } from '@/lib/queries/useChangeRequests'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/',          label: '대시보드',   icon: LayoutDashboard },
  { href: '/schedule',  label: '수업 일정',  icon: CalendarDays },
  { href: '/students',  label: '학생 관리',  icon: Users },
  { href: '/payments',  label: '결제/정산',  icon: CreditCard },
  { href: '/materials', label: '수업 자료',  icon: BookOpen },
  { href: '/reports',   label: '성장리포트', icon: TrendingUp },
  { href: '/feedback',  label: '수업 피드백', icon: Mail },
  { href: '/messages',  label: '문의함',     icon: MessageSquare },
  { href: '/requests',  label: '변경요청',   icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: threads = [] } = useAllStudentMessages()
  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0)
  const { data: changeReqs = [] } = useAllChangeRequests()
  const pendingRequests = changeReqs.filter(r => r.status === 'pending').length

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-lg font-bold text-indigo-600">syzhlin classroom</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {href === '/messages' && totalUnread > 0 && (
              <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">{totalUnread}</span>
            )}
            {href === '/requests' && pendingRequests > 0 && (
              <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{pendingRequests}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
