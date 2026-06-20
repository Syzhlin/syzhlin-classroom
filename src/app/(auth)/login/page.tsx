
'use client'

import { logActivity } from '@/lib/logActivity'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  { value: 'teacher',       label: '선생님',     emoji: '👩‍🏫' },
  { value: 'adult_learner', label: '성인 학습자', emoji: '📚' },
  { value: 'student',       label: '학생',        emoji: '🎒' },
  { value: 'parent',        label: '학부모',      emoji: '👨‍👧' },
] as const

type RoleValue = typeof ROLES[number]['value']

// ── Neumorphic base ──────────────────────────────────────────
const BASE = '#EEEAE4'
const SDK  = '#C6C2BB'   // shadow dark
const SLT  = 'rgba(255,255,255,0.95)'  // shadow light

const neuCard: React.CSSProperties = {
  backgroundColor: BASE,
  boxShadow: `20px 20px 56px ${SDK}, -10px -10px 28px ${SLT}`,
}
const neuRaised: React.CSSProperties = {
  backgroundColor: BASE,
  boxShadow: `5px 5px 12px ${SDK}, -5px -5px 12px ${SLT}`,
}
const neuInset: React.CSSProperties = {
  backgroundColor: BASE,
  boxShadow: `inset 3px 3px 8px ${SDK}, inset -3px -3px 8px ${SLT}`,
}
const neuActive: React.CSSProperties = {
  backgroundColor: BASE,
  boxShadow: `inset 3px 3px 7px ${SDK}, inset -2px -2px 6px ${SLT}`,
  outline: '1.5px solid #AFC4D8',
  outlineOffset: '-1.5px',
}
const neuBtn: React.CSSProperties = {
  backgroundColor: '#9BB5CE',
  boxShadow: `5px 5px 12px ${SDK}, -3px -3px 8px ${SLT}`,
  color: '#ffffff',
}

export default function LoginPage() {
  const [role,         setRole]         = useState<RoleValue>('teacher')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [code,         setCode]         = useState('')
  const [rememberMe,   setRememberMe]   = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const router      = useRouter()
  const queryClient = useQueryClient()
  const supabase    = createClient()
  const isTeacher   = role === 'teacher'

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

  function handleRoleChange(r: RoleValue) {
    setRole(r); setError(null); setEmail(''); setPassword(''); setCode('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true)
    try {
      if (isTeacher) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다' : error.message)
          return
        }
        const { data: { user: u } } = await supabase.auth.getUser()
        if (u) {
          const { data: p } = await supabase.from('profiles').select('role').eq('id', u.id).single()
          if (p && p.role !== 'teacher') {
            await supabase.auth.signOut()
            setError('이 계정은 선생님 계정이 아닙니다. 올바른 역할을 선택해주세요.')
            return
          }
        }
        if (rememberMe) localStorage.setItem('syzhlin_remember', JSON.stringify({ role: 'teacher', value: email }))
        else localStorage.removeItem('syzhlin_remember')
      } else {
        const upperCode = code.trim().toUpperCase()
        if (!upperCode) { setError('로그인 코드를 입력해주세요'); return }
        const { data: loginCode, error: codeErr } = await supabase.from('login_codes').select('*').eq('code', upperCode).single()
        if (codeErr || !loginCode) { setError('코드를 찾을 수 없습니다. 선생님께 확인해주세요.'); return }
        const derivedEmail = `${upperCode.toLowerCase()}@syzhlin.classroom`
        const derivedPassword = `${upperCode}_syzhlin!`
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: derivedEmail, password: derivedPassword })
        if (signInErr) { setError('로그인에 실패했습니다. 선생님께 문의해주세요.'); return }
        const { data: { user: cu } } = await supabase.auth.getUser()
        if (cu) {
          const { data: p } = await supabase.from('profiles').select('role').eq('id', cu.id).single()
          if (p && p.role !== role) {
            await supabase.auth.signOut()
            const L: Record<string, string> = { teacher:'선생님', adult_learner:'성인 학습자', student:'학생', parent:'학부모' }
            setError(`이 코드는 '${L[p.role] ?? p.role}' 계정입니다.`)
            return
          }
        }
        if (rememberMe) localStorage.setItem('syzhlin_remember', JSON.stringify({ role, value: upperCode }))
        else localStorage.removeItem('syzhlin_remember')
      }
      const loginRole = isTeacher ? 'teacher' : role
      await logActivity({ userRole: loginRole, action: 'login', detail: `${loginRole} 로그인` })
      queryClient.clear()
      router.push('/'); router.refresh()
    } finally { setLoading(false) }
  }

  return (
    <div
      className="w-full max-w-[400px] rounded-[32px] overflow-hidden"
      style={{ ...neuCard, margin: '0 auto' }}
    >
      {/* ── 아이콘 + 타이틀 ── */}
      <div className="pt-8 pb-5 px-7 flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={neuRaised}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#7B9EC0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: '#1E2D4E' }}>
            Syzhlin Classroom
          </h1>
          <p className="mt-1 text-[9px] tracking-[0.22em] uppercase font-medium"
            style={{ color: '#8B9BB0' }}>
            Premium English Classroom
          </p>
        </div>
      </div>

      {/* ── 역할 선택 ── */}
      <div className="px-7 pb-5">
        <p className="text-[11px] font-medium text-center mb-3" style={{ color: '#9AA4B0' }}>
          누구신가요?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRoleChange(r.value)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
              style={role === r.value ? neuActive : neuRaised}
            >
              <span className="text-[20px] leading-none">{r.emoji}</span>
              <span
                className="text-[9px] font-semibold text-center leading-tight"
                style={{ color: role === r.value ? '#4A7FA5' : '#8B9BB0' }}
              >
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 구분선 ── */}
      <div className="flex items-center px-7 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(175,196,216,0.2)' }} />
        <div className="mx-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(175,196,216,0.4)' }} />
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(175,196,216,0.2)' }} />
      </div>

      {/* ── 폼 ── */}
      <div className="px-7 pb-8">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-xs font-medium text-center"
            style={{ backgroundColor: 'rgba(220,100,100,0.08)', color: '#C0605A' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isTeacher ? (
            <>
              {/* 이메일 */}
              <div>
                <p className="text-[10px] font-semibold mb-1.5 ml-1" style={{ color: '#9AA4B0' }}>이메일</p>
                <div className="flex items-center gap-3 rounded-full px-4 py-3" style={neuInset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#9BB5CE" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="m2 7 10 7 10-7"/>
                  </svg>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="example@email.com"
                    required
                    className="flex-1 bg-transparent outline-none placeholder:text-[#B8C4D0]"
                    style={{ fontSize: '16px', color: '#1E2D4E', border: 'none' }}
                  />
                </div>
              </div>
              {/* 비밀번호 */}
              <div>
                <p className="text-[10px] font-semibold mb-1.5 ml-1" style={{ color: '#9AA4B0' }}>비밀번호</p>
                <div className="flex items-center gap-3 rounded-full px-4 py-3" style={neuInset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#9BB5CE" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="flex-1 bg-transparent outline-none placeholder:text-[#B8C4D0]"
                    style={{ fontSize: '16px', color: '#1E2D4E', border: 'none' }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="shrink-0 opacity-50 hover:opacity-80 transition-opacity">
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B9EC0" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B9EC0" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-[10px] font-semibold mb-1.5 ml-1" style={{ color: '#9AA4B0' }}>로그인 코드</p>
              <div className="flex items-center gap-3 rounded-full px-4 py-3" style={neuInset}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#9BB5CE" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="text" value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="예: LEEMOO"
                  autoComplete="off" autoCapitalize="characters" required
                  className="flex-1 bg-transparent outline-none font-mono tracking-widest text-center placeholder:text-[#B8C4D0] placeholder:tracking-wide placeholder:font-normal"
                  style={{ fontSize: '16px', color: '#1E2D4E', border: 'none' }}
                />
              </div>
              <p className="mt-2 text-[10px] text-center" style={{ color: '#B8C4D0' }}>
                선생님께 받은 코드를 입력하세요
              </p>
            </div>
          )}

          {/* Remember-me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
              style={rememberMe ? { ...neuActive, backgroundColor: '#9BB5CE' } : neuRaised}
              onClick={() => setRememberMe(v => !v)}
            >
              {rememberMe && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3"/>
                </svg>
              )}
            </div>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="sr-only" />
            <span className="text-[11px]" style={{ color: '#9AA4B0' }}>
              {isTeacher ? '이메일 저장' : '코드 저장'}
            </span>
          </label>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-semibold text-[15px] tracking-wide transition-all active:scale-[0.98] mt-2"
            style={loading ? { ...neuBtn, opacity: 0.6 } : neuBtn}
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
