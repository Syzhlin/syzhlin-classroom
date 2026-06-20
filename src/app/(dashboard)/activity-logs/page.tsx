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

const ROLE_LABEL: Record<string, string> = {
  parent: '학부모',
  student: '학생',
  adult_learner: '성인학습자',
  teacher: '선생님',
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
    const { data } = await supabase
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

  function formatTime(iso: string) {
    try {
      const d = new Date(iso)
      // KST (UTC+9) 변환
      const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
      return format(kst, 'MM/dd (EEE) HH:mm:ss', { locale: ko })
    } catch { return iso }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">활동 로그</h1>
        <button
          onClick={fetchLogs}
          className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
        >
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'login', 'page_view', 'change_request', 'inquiry_sent'].map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === a ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {a === 'all' ? '전체' : ACTION_LABEL[a] ?? a}
          </button>
        ))}
        <input
          type="text"
          placeholder="코드·이름·내용 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-400 w-48"
        />
      </div>

      {/* 로그 테이블 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">로그가 없습니다</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-44">시간 (KST)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-24">코드</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-24">역할</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-28">액션</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-gray-800">{log.user_code ?? '-'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.user_role === 'parent' ? 'bg-blue-50 text-blue-600' :
                      log.user_role === 'student' ? 'bg-green-50 text-green-600' :
                      log.user_role === 'adult_learner' ? 'bg-purple-50 text-purple-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {ROLE_LABEL[log.user_role ?? ''] ?? (log.user_role ?? '-')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {log.student_name ? <span className="font-medium text-gray-700">[{log.student_name}] </span> : null}
                    {log.detail ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-xs text-gray-400 border-t border-gray-50">
            총 {filtered.length}개 ({logs.length}개 중)
          </div>
        </div>
      )}
    </div>
  )
}
