'use client'

import { format, parseISO } from 'date-fns'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalMaterials } from '@/lib/queries/useMaterials'

const FILE_TYPE_CONFIG: Record<string, { icon: string; style: React.CSSProperties; label: string }> = {
  drive: { icon: '📂', style: {backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)'},   label: 'Google Drive' },
  pdf:   { icon: '📄', style: {backgroundColor: 'var(--sz-pink-pale)', color: 'var(--sz-pink-soft)'},    label: 'PDF' },
  image: { icon: '🖼️', style: {backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)'},   label: '이미지' },
  video: { icon: '🎬', style: {backgroundColor: 'rgba(200,185,220,0.3)', color: '#9B7BB5'},              label: '영상' },
  audio: { icon: '🎵', style: {backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)'},         label: '음성' },
  link:  { icon: '🔗', style: {backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)'},       label: '링크' },
  file:  { icon: '📁', style: {backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)'}, label: '파일' },
}

function formatDate(dateStr: string) {
  const d = parseISO(dateStr)
  return format(d, 'yyyy.MM.dd')
}

export default function ParentPortalPage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { selectedStudentId: linkedId } = usePortalStudent()
  const { data: materials, isLoading: materialsLoading } = usePortalMaterials(linkedId)

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full animate-spin" style={{border: '2px solid var(--sz-blue-soft)', borderTopColor: 'transparent'}} />
      </div>
    )
  }

  if (!linkedId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="font-semibold text-gray-800 text-lg">계정 연결 중</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          선생님이 자녀 계정을 연결 중입니다.<br />
          연결이 완료되면 수업 자료를 확인할 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold" style={{color: 'var(--sz-text-deep)'}}>수업 자료</h1>

      {materialsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{backgroundColor: "var(--sz-beige)"}} />
          ))}
        </div>
      ) : !materials || materials.length === 0 ? (
        <div className="sz-widget rounded-3xl p-10 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm text-gray-500">아직 등록된 수업 자료가 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => {
            const typeKey = material.file_type ?? 'file'
            const config = FILE_TYPE_CONFIG[typeKey] ?? FILE_TYPE_CONFIG.file

            return (
              <div
                key={material.id}
                className="sz-widget rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3.5 flex items-start gap-3">
                  {/* 아이콘 */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={config.style}>
                    {config.icon}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{material.title}</p>
                    {material.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{material.description}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{formatDate(material.created_at)}</p>
                  </div>

                  {/* 버튼 */}
                  <div className="flex-shrink-0">
                    {/* 다운로드 */}
                    <a
                      href={material.file_url}
                      download={material.file_name ?? material.title}
                      className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold"
                      style={{backgroundColor: 'var(--sz-blue-soft)', color: 'white'}}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      저장
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
