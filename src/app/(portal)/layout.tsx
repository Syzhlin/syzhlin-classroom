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

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      playPageTransitionSound()
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const btn = target.closest('button')
      const link = target.closest('a')
      if (!btn && !link) return
      if (btn?.getAttribute('aria-label') === 'back' || btn?.dataset.sound === 'back') {
        playBackSound()
        return
      }
      playClickSound()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  const navItems = [
    {
      href: '/portal/home',
      label: '홈',
      icon: <HomeIcon />,
      roles: ['teacher', 'adult_learner', 'student', 'parent'],
    },
    {
      href: '/portal/schedule',
      label: '일정',
      icon: <CalendarIcon />,
      roles: ['teacher', 'adult_learner', 'parent'],
    },
    {
      href: '/portal/change-request',
      label: '변경요청',
      icon: <EditIcon />,
      roles: [],
    },
    {
      href: '/portal/payment',
      label: '결제',
      icon: <CardIcon />,
      roles: ['adult_learner', 'parent'],
    },
    {
      href: '/portal/report',
      label: '리포트',
      icon: <ChartIcon />,
      roles: ['parent', 'adult_learner'],
    },
    {
      href: '/portal/inquiry',
      label: '문의',
      icon: <ChatIcon />,
      roles: ['teacher', 'adult_learner', 'student', 'parent'],
    },
    {
      href: '/portal/parent',
      label: '자료',
      icon: <FolderIcon />,
      roles: ['parent'],
    },
    {
      href: '/portal/passport',
      label: '여권',
      icon: <PassportIcon />,
      roles: ['student', 'adult_learner'],
    },
    {
      href: '/portal/game',
      label: '게임',
      icon: <GameIcon />,
      roles: [],
    },
    {
      href: '/portal/homework',
      label: '숙제',
      icon: <HomeworkIcon />,
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
    <div
      className="flex flex-col"
      style={{
        backgroundColor: 'var(--sz-bg-pastel)',
        height: pathname === '/portal/inquiry' ? '100dvh' : undefined,
        minHeight: pathname === '/portal/inquiry' ? undefined : '100dvh',
        overflow: pathname === '/portal/inquiry' ? 'hidden' : undefined,
      }}
    >
      {/* 소프트 민트-크림 배경 그라데이션 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background: `radial-gradient(circle at 12% 8%, rgba(195,225,215,0.36) 0%, transparent 32%), radial-gradient(circle at 88% 12%, rgba(242,232,208,0.30) 0%, transparent 28%), radial-gradient(circle at 50% 85%, rgba(205,218,235,0.20) 0%, transparent 38%)`,
        }}
      />
      {/* Top header */}
      <header
        className="px-4 pt-3 pb-2 sticky top-0 z-10"
        style={{
          backgroundColor: 'rgba(255,253,246,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(175,196,216,0.2)',
        }}
      >
        {/* 첫째 줄: 로고 + 앱명 / 로그아웃 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--sz-blue-soft)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <span
              className="font-bold text-sm"
              style={{ color: 'var(--sz-text-deep)' }}
            >
              Syzhlin Class
            </span>
          </div>
          <div className="flex items-center gap-2">
            {profile?.display_name && (
              <span className="text-xs" style={{ color: 'var(--sz-text-muted)' }}>{profile.display_name}</span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-all"
              style={{ color: 'var(--sz-text-muted)', backgroundColor: 'rgba(0,0,0,0.04)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              로그아웃
            </button>
          </div>
        </div>

        {/* 둘째 줄: 자녀 선택 칩 (형제 있을 때만) */}
        <SiblingSwitch />
      </header>

      {/* Main content */}
      <main
        className={`flex-1 transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{
          paddingBottom: pathname === '/portal/inquiry' ? '0' : 'calc(140px + env(safe-area-inset-bottom))',
          display: pathname === '/portal/inquiry' ? 'flex' : undefined,
          flexDirection: pathname === '/portal/inquiry' ? 'column' : undefined,
          overflow: pathname === '/portal/inquiry' ? 'hidden' : undefined,
        }}
      >
        <div
          key={pathname}
          className="page-enter"
          style={pathname === '/portal/inquiry' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}
        >
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav
          className="fixed bottom-0 left-0 right-0 flex z-10"
          style={{
            backgroundColor: 'rgba(255,253,246,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(175,196,216,0.25)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-1 pt-2 pb-2.5 relative transition-all"
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span
                    className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ backgroundColor: 'var(--sz-blue-soft)' }}
                  />
                )}
                <span
                  className="flex items-center justify-center w-9 h-7 rounded-2xl transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(175,196,216,0.28)' : 'transparent',
                    color: isActive ? 'var(--sz-blue-soft)' : 'var(--sz-text-muted)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className="text-[9px] font-bold tracking-tight"
                  style={{
                    color: isActive ? 'var(--sz-blue-soft)' : 'var(--sz-text-muted)',
                  }}
                >
                  {item.label}
                </span>
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

  const allStudents = [
    { id: profile.linked_student_id, name: linkedStudentName ?? profile.display_name ?? '내 아이' },
    ...siblings,
  ]

  return (
    <div className="flex items-center gap-1.5 mt-2 pb-1 overflow-x-auto">
      {allStudents.map(s => (
        <button
          key={s.id}
          onClick={() => { playSiblingSwapSound(); setSelectedStudentId(s.id) }}
          className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: selectedStudentId === s.id
              ? 'var(--sz-blue-soft)'
              : 'rgba(175,196,216,0.2)',
            color: selectedStudentId === s.id ? '#fff' : 'var(--sz-text-deep)',
            boxShadow: selectedStudentId === s.id
              ? '0 2px 8px rgba(175,196,216,0.5)'
              : 'none',
          }}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}

/* ── Soft Rounded Icons ── */
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="3"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function PassportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
function GameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4"/>
      <path d="M12 9v6M9 12h6"/>
    </svg>
  )
}
function HomeworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
