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
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 flex-col" style={{backgroundColor: "var(--sz-card-pastel)", borderRight: "1px solid rgba(175,196,216,0.25)", boxShadow: "2px 0 20px rgba(46,53,69,0.04)"}}>
      <div className="h-16 flex items-center px-6" style={{borderBottom: "1px solid rgba(175,196,216,0.2)"}}>
        <span className="text-lg font-bold" style={{color: "var(--sz-text-deep)"}}>syzhlin classroom</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              backgroundColor: pathname === href ? 'var(--sz-blue-pale)' : 'transparent',
              color: pathname === href ? 'var(--sz-blue-soft)' : 'var(--sz-text-muted)',
            }}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {href === '/messages' && totalUnread > 0 && (
              <span className="text-xs text-white px-1.5 py-0.5 rounded-full font-semibold" style={{backgroundColor: "var(--sz-blue-soft)"}}>{totalUnread}</span>
            )}
            {href === '/requests' && pendingRequests > 0 && (
              <span className="text-xs text-white px-1.5 py-0.5 rounded-full font-semibold" style={{backgroundColor: "var(--sz-peach)"}}>{pendingRequests}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4" style={{borderTop: "1px solid rgba(175,196,216,0.2)"}}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-sm font-medium transition-all" style={{color: "var(--sz-text-muted)"}} onMouseEnter={e=>{e.currentTarget.style.backgroundColor="var(--sz-pink-pale)";e.currentTarget.style.color="var(--sz-pink-soft)"}} onMouseLeave={e=>{e.currentTarget.style.backgroundColor="transparent";e.currentTarget.style.color="var(--sz-text-muted)"}}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
