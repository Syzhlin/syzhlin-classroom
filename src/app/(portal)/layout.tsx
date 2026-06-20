'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/lib/queries/useProfile'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PortalStudentProvider, usePortalStudent } from '@/contexts/PortalStudentContext'
import { useEffect, useRef } from 'react'
import { playClickSound, playPageTransitionSound, playBackSound, playSiblingSwapSound } from '@/lib/sounds'
import { logActivity } from '@/lib/logActivity'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalStudentProvider>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </PortalStudentProvider>
  )
}

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  const { isTransitioning } = usePortalStudent()
  const role = profile?.role
  const prevPathname = useRef(pathname)

  // 페이지 전환음 + 방문 로그
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      playPageTransitionSound()
      prevPathname.current = pathname
    }
    if (!profile) return
    const pageLabel: Record<string, string> = {
      '/portal/home': '홈',
      '/portal/schedule': '일정',
      '/portal/payment': '결제',
      '/portal/report': '리포트',
      '/portal/inquiry': '문의',
      '/portal/parent': '자료',
    }
    logActivity({
      userRole: profile.role ?? undefined,
      action: 'page_view',
      detail: pageLabel[pathname] ?? pathname,
    })
  }, [pathname, profile])

  // 전역 버튼 클릭음
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const btn = target.closest('button')
      const link = target.closest('a')
      if (!btn && !link) return

      // 뒤로가기 버튼
      if (btn?.getAttribute('aria-label') === 'back' || btn?.dataset.sound === 'back') {
        playBackSound()
        return
      }
      // 일반 클릭음
      playClickSound()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  const navItems = [
    {
      href: '/portal/home',
      label: '홈',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      roles: ['teacher', 'adult_learner', 'student', 'parent'],
    },
        {
      href: '/portal/schedule',
      label: '일정',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      roles: ['teacher', 'adult_learner', 'student', 'parent'],
    },
    {
      href: '/portal/change-request',
      label: '변경요청',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      roles: [],
    },
        {
      href: '/portal/payment',
      label: '결제',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
      roles: ['adult_learner', 'parent'],
    },
    {
      href: '/portal/report',
      label: '리포트',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
          <line x1="2" y1="20" x2="22" y2="20"/>
        </svg>
      ),
      roles: ['parent', 'adult_learner'],
    },
        {
      href: '/portal/inquiry',
      label: '문의',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      roles: ['teacher', 'adult_learner', 'student', 'parent'],
    },
        {
      href: '/portal/parent',
      label: '자료',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      roles: ['parent'],
    },
    {
      href: '/portal/passport',
      label: '여권',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
      ),
      roles: ['student', 'adult_learner'],
    },
    {
      href: '/portal/game',
      label: '게임',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M12 12h.01"/>
          <path d="M7 12h.01"/>
          <path d="M17 12h.01"/>
          <path d="M12 9v6"/>
        </svg>
      ),
      roles: ['student'],
    },
    {
      href: '/portal/homework',
      label: '숙제',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
      roles: ['student'],
    },
  ]

  const visibleNavItems = navItems.filter(
    (item) => !role || item.roles.includes(role)
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    queryClient.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: "var(--sz-cream)"}}>
      {/* Top header */}
      <header className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{backgroundColor: "var(--sz-paper)", borderColor: "var(--sz-beige)"}}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{backgroundColor: "var(--sz-navy)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span className="font-bold text-sm" style={{color: "var(--sz-navy)"}}>Syzhlin Class</span>
        </div>
        <SiblingSwitch />
        <div className="flex items-center gap-3">
          {profile?.display_name && (
            <span className="text-sm text-gray-500">{profile.display_name}</span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg" style={{color: "var(--sz-warm-gray)"}}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            로그아웃
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-1 pb-20 transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t flex z-10" style={{backgroundColor: "var(--sz-paper)", borderColor: "var(--sz-beige)"}}>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive ? 'sz-text-navy' : 'sz-text-warm-gray'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function SiblingSwitch() {
  const { data: profile } = useProfile()
  const { selectedStudentId, setSelectedStudentId, siblings, hasSiblings, linkedStudentName } = usePortalStudent()
  if (!hasSiblings || !profile?.linked_student_id) return null

  // 현재 선택된 학생 이름 가져오기
  const allStudents = [
    { id: profile.linked_student_id, name: linkedStudentName ?? profile.display_name ?? '내 아이' },
    ...siblings,
  ]
  const current = allStudents.find(s => s.id === selectedStudentId)

  return (
    <div className="flex items-center gap-1 mx-auto">
      {allStudents.map(s => (
        <button
          key={s.id}
          onClick={() => { playSiblingSwapSound(); setSelectedStudentId(s.id) }}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            selectedStudentId === s.id
              ? 'sz-btn-navy'
              : 'sz-btn-outline'
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}
