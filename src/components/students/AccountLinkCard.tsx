'use client'
import { useState } from 'react'
import { Link2, Link2Off, UserCircle2 } from 'lucide-react'
import { usePortalProfiles, useLinkProfile } from '@/lib/queries/useAccountLink'

const ROLE_LABEL: Record<string, string> = {
  adult_learner: '성인학습자',
  parent: '학부모',
  student: '학생',
}

interface AccountLinkCardProps {
  studentId: string
  studentName: string
}

export default function AccountLinkCard({ studentId, studentName }: AccountLinkCardProps) {
  const { data: profiles = [], isLoading, error } = usePortalProfiles()
  const linkProfile = useLinkProfile()
  const [selectedId, setSelectedId] = useState('')

  const linked = profiles.filter(p => p.linked_student_id === studentId)
  const available = profiles.filter(p => p.linked_student_id === null)

  const profileLabel = (p: { display_name: string | null; role: string }) =>
    `${p.display_name ?? '(이름 없음)'} · ${ROLE_LABEL[p.role] ?? p.role}`

  const handleLink = async () => {
    if (!selectedId) return
    await linkProfile.mutateAsync({ profileId: selectedId, studentId })
    setSelectedId('')
  }

  const handleUnlink = async (profileId: string) => {
    await linkProfile.mutateAsync({ profileId, studentId: null })
  }

  return (
    <div className="sz-widget rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-[var(--sz-blue-soft)]" />
        <h2 className="text-sm font-bold text-[var(--sz-text-deep)]">계정 연결</h2>
      </div>

      {isLoading ? (
        <div className="h-10 rounded-lg bg-[rgba(175,196,216,0.1)] animate-pulse" />
      ) : error ? (
        <p className="text-xs text-red-500 leading-relaxed">
          포털 계정을 불러올 수 없어요. <code>supabase-account-link-migration.sql</code> 을 Supabase에서 실행했는지 확인해주세요.
        </p>
      ) : (
        <div className="space-y-3">
          {/* 현재 연결된 계정 */}
          {linked.length > 0 ? (
            <div className="space-y-2">
              {linked.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--sz-sage-pale)]">
                  <span className="flex items-center gap-2 text-sm text-[var(--sz-text-deep)] min-w-0">
                    <UserCircle2 className="w-4 h-4 flex-shrink-0 text-[var(--sz-sage)]" />
                    <span className="truncate">{profileLabel(p)}</span>
                  </span>
                  <button
                    onClick={() => handleUnlink(p.id)}
                    disabled={linkProfile.isPending}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-[var(--sz-text-muted)] hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <Link2Off className="w-3.5 h-3.5" />
                    해제
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70">
              {studentName}님과 연결된 포털 계정이 없어요.
            </p>
          )}

          {/* 새 계정 연결 */}
          <div className="flex items-center gap-2">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-[rgba(175,196,216,0.3)] bg-white text-[var(--sz-text-deep)] focus:outline-none focus:border-[var(--sz-blue-soft)]"
            >
              <option value="">연결할 계정 선택…</option>
              {available.map(p => (
                <option key={p.id} value={p.id}>{profileLabel(p)}</option>
              ))}
            </select>
            <button
              onClick={handleLink}
              disabled={!selectedId || linkProfile.isPending}
              className="flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--sz-blue-soft)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {linkProfile.isPending ? '처리중…' : '연결'}
            </button>
          </div>
          {available.length === 0 && (
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70">
              연결 가능한(미연결) 포털 계정이 없어요. 학부모·학생·성인학습자가 먼저 앱에 가입해야 목록에 나타납니다.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
