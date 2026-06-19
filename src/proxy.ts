import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (중요: await 필수)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 미인증 사용자 → /login 리다이렉트
  if (!user) {
    if (!pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 인증된 사용자: login 페이지 접근 시 → 루트로 (루트에서 역할에 따라 라우팅)
  if (pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 역할 기반 라우팅을 위해 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 프로필 없음 → role-select로 (단, 이미 role-select이면 통과)
  if (!profile) {
    if (!pathname.startsWith('/role-select') && !pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/role-select'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const role = profile.role

  // teacher가 portal에 접근 → /schedule로
  if (pathname.startsWith('/portal') && role === 'teacher') {
    const url = request.nextUrl.clone()
    url.pathname = '/schedule'
    return NextResponse.redirect(url)
  }

  // non-teacher가 dashboard 경로에 접근 → /portal/schedule로
  const dashboardPaths = ['/schedule', '/students', '/payments']
  if (role !== 'teacher' && dashboardPaths.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
