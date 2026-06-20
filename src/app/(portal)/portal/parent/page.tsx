'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalMaterials } from '@/lib/queries/useMaterials'
import { useSubmitHomework, useMyHomework } from '@/lib/queries/useHomework'
import { ImagePlus, X, Send, CheckCircle } from 'lucide-react'

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
  return format(parseISO(dateStr), 'yyyy.MM.dd')
}

function HomeworkSection({ studentId }: { studentId: string }) {
  const submit = useSubmitHomework()
  const { data: submissions = [] } = useMyHomework(studentId)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setDone(false)
  }

  async function handleSubmit() {
    if (!file && !note.trim()) return
    await submit.mutateAsync({ studentId, file, note })
    setFile(null)
    setPreviewUrl(null)
    setNote('')
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold" style={{ color: 'var(--sz-text-deep)' }}>숙제 제출</h2>
        <span className="text-xs" style={{ color: 'var(--sz-text-muted)' }}>사진을 첨부하고 선생님께 바로 보내요</span>
      </div>

      {/* 업로드 카드 */}
      <div className="space-y-3" style={{ backgroundColor: '#FFFDF8', boxShadow: '7px 7px 20px rgba(100,88,65,0.09), -4px -4px 12px rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '24px', padding: '16px' }}>
        {/* 사진 선택 */}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="preview" className="w-full rounded-2xl object-cover max-h-48" />
            <button
              onClick={() => { setFile(null); setPreviewUrl(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors"
            style={{ borderColor: 'rgba(175,196,216,0.4)', backgroundColor: 'rgba(175,196,216,0.06)' }}
          >
            <ImagePlus className="w-6 h-6" style={{ color: 'rgba(175,196,216,0.7)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--sz-text-muted)' }}>여기를 눌러 사진 첨부</span>
          </button>
        )}

        {/* 메모 */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="선생님께 한마디 (선택)"
          rows={2}
          className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none"
          style={{
            backgroundColor: 'rgba(175,196,216,0.1)',
            color: 'var(--sz-text-deep)',
            border: '1px solid rgba(175,196,216,0.25)',
            fontSize: '16px',
          }}
        />

        {/* 제출 버튼 */}
        {done ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ backgroundColor: 'rgba(100,190,150,0.12)', color: 'var(--sz-sage)' }}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">제출 완료!</span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submit.isPending || !file}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: file ? 'var(--sz-blue-soft)' : 'rgba(175,196,216,0.35)', color: file ? '#fff' : 'var(--sz-text-muted)' }}
          >
            <Send className="w-4 h-4" />
            {submit.isPending ? '제출 중...' : '숙제 제출'}
          </button>
        )}
      </div>

      {/* 제출 기록 */}
      {submissions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--sz-text-muted)' }}>제출 기록</p>
          {submissions.slice(0, 3).map(s => (
            <div key={s.id} className="px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: '#FFFDF8', boxShadow: '4px 4px 12px rgba(100,88,65,0.07), -3px -3px 8px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '16px' }}>
              {s.photo_url
                ? <img src={s.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                : <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ backgroundColor: 'var(--sz-blue-pale)' }}>📝</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--sz-text-deep)' }}>
                  {s.note || '사진 제출'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>
                  {formatDate(s.created_at)}
                </p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full font-semibold shrink-0"
                style={s.status === 'reviewed'
                  ? { backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }
                  : { backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}>
                {s.status === 'reviewed' ? '확인 완료' : '제출됨'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
    <div className="max-w-lg mx-auto px-4" style={{ paddingTop: '20px' }}>

      {/* ── 숙제 제출 ── */}
      <HomeworkSection studentId={linkedId} />

      {/* ── 수업 자료 ── */}
      <h2 className="text-sm font-bold mb-3" style={{color: 'var(--sz-text-deep)'}}>수업 자료</h2>

      {materialsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{backgroundColor: "var(--sz-beige)"}} />
          ))}
        </div>
      ) : !materials || materials.length === 0 ? (
        <div className="p-10 text-center" style={{ backgroundColor: '#FFFDF8', boxShadow: '7px 7px 20px rgba(100,88,65,0.09), -4px -4px 12px rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '24px' }}>
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm text-gray-500">아직 등록된 수업 자료가 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => {
            const typeKey = material.file_type ?? 'file'
            const config = FILE_TYPE_CONFIG[typeKey] ?? FILE_TYPE_CONFIG.file

            return (
              <div key={material.id} className="overflow-hidden" style={{ backgroundColor: '#FFFDF8', boxShadow: '5px 5px 16px rgba(100,88,65,0.08), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: '20px' }}>
                <div className="px-4 py-3.5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={config.style}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{material.title}</p>
                    {material.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{material.description}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{formatDate(material.created_at)}</p>
                  </div>
                  <div className="flex-shrink-0">
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
