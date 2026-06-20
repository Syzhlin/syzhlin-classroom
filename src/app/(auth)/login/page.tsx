'use client'

import { logActivity } from '@/lib/logActivity'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  { value: 'teacher',       label: '선생님',      emoji: '👩‍🏫', color: 'indigo' },
  { value: 'adult_learner', label: '성인 학습자',  emoji: '📚', color: 'emerald' },
  { value: 'student',       label: '학생',         emoji: '🎒', color: 'sky' },
  { value: 'parent',        label: '학부모',       emoji: '👨‍👧', color: 'amber' },
] as const

type RoleValue = typeof ROLES[number]['value']

const COLOR_ACTIVE: Record<string, string> = {
  indigo:  'border-[var(--sz-navy)] bg-[var(--sz-gold-light)] text-[var(--sz-navy)]',
  emerald: 'border-[var(--sz-navy)] bg-[var(--sz-gold-light)] text-[var(--sz-navy)]',
  sky:     'border-[var(--sz-navy)] bg-[var(--sz-gold-light)] text-[var(--sz-navy)]',
  amber:   'border-[var(--sz-navy)] bg-[var(--sz-gold-light)] text-[var(--sz-navy)]',
}
const BTN_COLOR: Record<string, string> = {
  indigo:  'bg-[var(--sz-navy)] hover:bg-[var(--sz-navy-light)]',
  emerald: 'bg-[var(--sz-navy)] hover:bg-[var(--sz-navy-light)]',
  sky:     'bg-[var(--sz-navy)] hover:bg-[var(--sz-navy-light)]',
  amber:   'bg-[var(--sz-navy)] hover:bg-[var(--sz-navy-light)]',
}

function getColorForRole(role: RoleValue) {
  return ROLES.find(r => r.value === role)?.color ?? 'indigo'
}

export default function LoginPage() {
  const [role,        setRole]        = useState<RoleValue>('teacher')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [code,        setCode]        = useState('')
  const [rememberMe,  setRememberMe]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const color = getColorForRole(role)
  const isTeacher = role === 'teacher'

  // remember-me 복원
  useEffect(() => {
    const saved = localStorage.getItem('syzhlin_remember')
    if (!saved) return
    try {
      const { role: r, value } = JSON.parse(saved)
      if (r) setRole(r)
      if (r === 'teacher') setEmail(value ?? '')
      else setCode(value ?? '')
      setRememberMe(true)
    } catch { /* ignore */ }
  }, [])

  // 역할 변경 시 입력 초기화
  function handleRoleChange(r: RoleValue) {
    setRole(r)
    setError(null)
    setEmail('')
    setPassword('')
    setCode('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isTeacher) {
        // 선생님: 이메일 + 비밀번호
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다' : error.message)
          return
        }
        // role 검증 - 선생님 계정인지 확인
        const { data: { user: signedInUser } } = await supabase.auth.getUser()
        if (signedInUser) {
          const { data: profileData } = await supabase
            .from('profiles').select('role').eq('id', signedInUser.id).single()
          if (profileData && profileData.role !== 'teacher') {
            await supabase.auth.signOut()
            setError('이 계정은 선생님 계정이 아닙니다. 올바른 역할을 선택해주세요.')
            return
          }
        }
        // remember-me
        if (rememberMe) {
          localStorage.setItem('syzhlin_remember', JSON.stringify({ role: 'teacher', value: email }))
        } else {
          localStorage.removeItem('syzhlin_remember')
        }
      } else {
        // 학생/학부모/성인학습자: 코드 입력
        const upperCode = code.trim().toUpperCase()
        if (!upperCode) { setError('로그인 코드를 입력해주세요'); return }

        // 코드 확인
        const { data: loginCode, error: codeErr } = await supabase
          .from('login_codes')
          .select('*')
          .eq('code', upperCode)
          .single()

        if (codeErr || !loginCode) {
          setError('코드를 찾을 수 없습니다. 선생님께 확인해주세요.')
          return
        }

        // 코드로 생성된 이메일/비밀번호로 로그인
        const derivedEmail = `${upperCode.toLowerCase()}@syzhlin.classroom`
        const derivedPassword = `${upperCode}_syzhlin!`

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: derivedEmail,
          password: derivedPassword,
        })
        if (signInErr) {
          setError('로그인에 실패했습니다. 선생님께 문의해주세요.')
          return
        }

        // role 검증 - 선택한 역할과 실제 프로필 role 일치 확인
        const { data: { user: codeUser } } = await supabase.auth.getUser()
        if (codeUser) {
          const { data: profileData } = await supabase
            .from('profiles').select('role').eq('id', codeUser.id).single()
          if (profileData && profileData.role !== role) {
            await supabase.auth.signOut()
            const roleLabels: Record<string, string> = {
              teacher: '선생님', adult_learner: '성인 학습자', student: '학생', parent: '학부모'
            }
            setError(`이 코드는 '${roleLabels[profileData.role] ?? profileData.role}' 계정입니다. 올바른 역할을 선택해주세요.`)
            return
          }
        }

        // remember-me
        if (rememberMe) {
          localStorage.setItem('syzhlin_remember', JSON.stringify({ role, value: upperCode }))
        } else {
          localStorage.removeItem('syzhlin_remember')
        }
      }

      // 로그인 성공 로그
      const loginRole = isTeacher ? 'teacher' : role
      await logActivity({
        userRole: loginRole,
        action: 'login',
        detail: `${loginRole} 로그인`,
      })
      queryClient.clear()
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{backgroundColor: "var(--sz-paper)", borderColor: "#DDD4C8", border: "1px solid #DDD4C8", boxShadow: "0 4px 32px rgba(100,80,50,0.10), 0 1px 4px rgba(100,80,50,0.06)"}}>
      {/* 로고 */}
      <div className="px-8 pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{backgroundColor: "var(--sz-navy)"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight" style={{color: "var(--sz-navy)", letterSpacing: "-0.01em"}}>Syzhlin Classroom</h1>
        <p className="mt-1 text-xs tracking-widest uppercase" style={{color: "var(--sz-warm-gray)", letterSpacing: "0.12em"}}>Premium English Classroom</p>
      </div>

      {/* 역할 선택 */}
      <div className="px-8 pb-4">
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">누구신가요?</p>
        <div className="grid grid-cols-4 gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRoleChange(r.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                role === r.value
                  ? COLOR_ACTIVE[r.color]
                  : 'border-[var(--sz-beige)] text-[var(--sz-warm-gray)] hover:border-[var(--sz-navy)] hover:text-[var(--sz-navy)]'
              }`}
            >
              <span className="text-xl">{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t mx-8" style={{borderColor: "var(--sz-beige)"}} />

      {/* 로그인 폼 */}
      <div className="px-8 py-6">
        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isTeacher ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="example@email.com"
                  required
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sz-navy)] focus:border-transparent" style={{borderColor: "var(--sz-beige)", backgroundColor: "var(--sz-cream)"}}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sz-navy)] focus:border-transparent" style={{borderColor: "var(--sz-beige)", backgroundColor: "var(--sz-cream)"}}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">로그인 코드</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="예: LEEMOO"
                autoComplete="off"
                autoCapitalize="off"
                required
                className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[var(--sz-navy)] focus:border-transparent" style={{borderColor: "var(--sz-beige)", backgroundColor: "var(--sz-cream)"}}
              />
              <p className="mt-1.5 text-xs text-gray-400 text-center">선생님께 받은 코드를 입력하세요</p>
            </div>
          )}

          {/* remember-me */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[var(--sz-navy)] focus:ring-[var(--sz-navy)]"
            />
            <span className="text-sm text-gray-600">
              {isTeacher ? '이메일 저장' : '코드 저장'}
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 tracking-wide ${BTN_COLOR[color]}`}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
