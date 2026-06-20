'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type LogRow = {
  id: string
  created_at: string
  user_code: string | null
  user_role: string | null
  student_name: string | null
  action: string
  detail: string | null
}

const ACTION_LABEL: Record<string, string> = {
  login: '🔑 로그인',
  logout: '🚪 로그아웃',
  page_view: '👁 페이지 방문',
  sibling_switch: '🔄 아이 전환',
  change_request: '📝 변경요청',
  inquiry_sent: '💬 문의 전송',
  material_viewed: '📎 자료 열람',
}

const ACTION_CHIP_LABEL: Record<string, string> = {
  all: '전체',
  login: '로그인',
  page_view: '페이지 방문',
  change_request: '변경요청',
  inquiry_sent: '문의 전송',
}

const ROLE_LABEL: Record<string, string> = {
  parent: '학부모',
  student: '학생',
  adult_learner: '성인학습자',
  teacher: '선생님',
}

const ROLE_COLOR: Record<string, string> = {
  parent: 'bg-blue-50 text-blue-600',
  student: 'bg-green-50 text-green-600',
  adult_learner: 'bg-purple-50 text-purple-600',
  teacher: 'bg-orange-50 text-orange-600',
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return format(d, 'MM/dd (EEE) HH:mm:ss', { locale: ko })
  } catch { return iso }
}

function formatTimeShort(iso: string) {
  try {
    const d = new Date(iso)
    return format(d, 'MM/dd (EEE) HH:mm', { locale: ko })
  } catch { return iso }
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
    setLogs(data ?? [])
    setLoading(false)
  }

  const filtered = logs.filter(log => {
    const matchAction = filter === 'all' || log.action === filter
    const matchSearch = !search ||
      (log.user_code ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (log.student_name ?? '').includes(search) ||
      (log.detail ?? '').includes(search)
    return matchAction && matchSearch
  })

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-28">
      {/* 헤더: 제목 + 새로고침 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[var(--sz-text-deep)]">활동 로그</h1>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)] rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          새로고침
        </button>
      </div>

      {/* 검색창 — 모바일 풀너비 */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sz-text-muted)] opacity-70" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="코드·이름·내용 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 text-sm border border-[rgba(175,196,216,0.3)] rounded-2xl outline-none focus:border-indigo-400 bg-white"
          style={{ height: '44px' }}
        />
      </div>

      {/* 필터 칩 — 가로 스크롤 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {Object.entries(ACTION_CHIP_LABEL).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
              filter === key
                ? 'bg-[var(--sz-blue-soft)] text-white'
                : 'bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)] hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--sz-text-muted)] opacity-70">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--sz-text-muted)] opacity-70">로그가 없습니다</div>
      ) : (
        <>
          {/* 모바일 카드 리스트 (md 미만) */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(log => (
              <div
                key={log.id}
                className="bg-white border border-gray-100 rounded-[20px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                {/* 상단: 시간 + 액션 배지 */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs text-[var(--sz-text-muted)] opacity-70 font-mono">{formatTimeShort(log.created_at)}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--sz-blue-pale)] text-[var(--sz-blue-soft)] font-medium whitespace-nowrap">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                </div>
                {/* 코드 + 역할 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-[var(--sz-text-deep)] text-sm break-all">{log.user_code ?? '-'}</span>
                  {log.user_role && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLOR[log.user_role] ?? 'bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)]'}`}>
                      {ROLE_LABEL[log.user_role] ?? log.user_role}
                    </span>
                  )}
                </div>
                {/* 상세 내용 */}
                {(log.student_name || log.detail) && (
                  <p className="text-xs text-[var(--sz-text-muted)] leading-relaxed break-words">
                    {log.student_name ? <span className="font-medium text-[var(--sz-text-deep)]">[{log.student_name}] </span> : null}
                    {log.detail}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 데스크톱 테이블 (md 이상) */}
          <div className="hidden md:block sz-widget rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--sz-bg-pastel)] border-b border-[rgba(175,196,216,0.15)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sz-text-muted)] w-44">시간 (KST)</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sz-text-muted)] w-24">코드</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sz-text-muted)] w-24">역할</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sz-text-muted)] w-28">액션</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sz-text-muted)]">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--sz-bg-pastel)] transition-colors">
                    <td className="px-4 py-2.5 text-xs text-[var(--sz-text-muted)] font-mono whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-[var(--sz-text-deep)] break-all">{log.user_code ?? '-'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${ROLE_COLOR[log.user_role ?? ''] ?? 'bg-[rgba(175,196,216,0.1)] text-[var(--sz-text-muted)]'}`}>
                        {ROLE_LABEL[log.user_role ?? ''] ?? (log.user_role ?? '-')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--sz-text-muted)] whitespace-nowrap">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--sz-text-muted)] break-words max-w-[200px]">
                      {log.student_name ? <span className="font-medium text-[var(--sz-text-deep)]">[{log.student_name}] </span> : null}
                      {log.detail ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 text-xs text-[var(--sz-text-muted)] opacity-70 border-t border-gray-50">
              총 {filtered.length}개 ({logs.length}개 중)
            </div>
          </div>

          {/* 모바일 카운트 */}
          <p className="md:hidden text-xs text-[var(--sz-text-muted)] opacity-70 text-center mt-3">
            총 {filtered.length}개 ({logs.length}개 중)
          </p>
        </>
      )}
    </div>
  )
}
