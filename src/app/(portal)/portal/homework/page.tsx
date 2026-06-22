'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Camera, ImagePlus, Paperclip, FileText, X, Send, CheckCircle, MessageSquare } from 'lucide-react'
import { useProfile } from '@/lib/queries/useProfile'
import { useMyHomework, useSubmitHomework } from '@/lib/queries/useHomework'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalHome } from '@/lib/queries/useFeedback'
import { usePortalMaterials } from '@/lib/queries/useMaterials'
import { HomeworkAttachments } from '@/components/HomeworkAttachments'

function formatDate(str: string) {
  return format(parseISO(str), 'M월 d일 (EEE)', { locale: ko })
}

export default function HomeworkPage() {
  const { data: profile } = useProfile()
  const studentId = profile?.linked_student_id ?? null
  const { selectedStudentId } = usePortalStudent()
  const effectiveStudentId = selectedStudentId ?? studentId

  const [tab, setTab] = useState(0)

  if (!effectiveStudentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-4xl mb-4">⏳</div>
        <p className="font-semibold text-gray-700">계정 연결 중이에요</p>
        <p className="text-sm text-gray-400 mt-1">선생님이 계정을 연결하면 숙제를 제출할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{color: 'var(--sz-text-deep)'}}>숙제 ✏️</h1>
      </div>

      {/* 탭 스위처 */}
      <div style={{display:'flex', gap:'6px', padding:'4px', borderRadius:'20px', background:'rgba(175,196,216,0.12)', marginBottom:'20px'}}>
        {['숙제 및 수업자료 보기', '숙제 올리기'].map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{flex:1, padding:'9px 0', borderRadius:'16px', fontSize:'12px', fontWeight:'700',
              background: tab===i ? 'white' : 'transparent',
              color: tab===i ? 'var(--sz-text-deep)' : 'var(--sz-text-muted)',
              boxShadow: tab===i ? '3px 3px 8px rgba(100,88,65,0.1), -2px -2px 6px rgba(255,255,255,0.9)' : 'none',
              border:'none', cursor:'pointer', transition:'all 0.2s'
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 0 ? (
        <HomeworkViewTab studentId={effectiveStudentId} />
      ) : (
        <HomeworkUploadTab studentId={effectiveStudentId} />
      )}
    </div>
  )
}

function HomeworkViewTab({ studentId }: { studentId: string }) {
  const { data: portalData } = usePortalHome(studentId)
  const { data: materials = [] } = usePortalMaterials(studentId)

  // 최근 피드백 (가장 최근 완료 수업의 피드백)
  const latestFeedback = portalData?.recentClasses?.[0]?.class_feedback?.[0] ?? null

  return (
    <div className="space-y-4">
      {/* 숙제 카드 */}
      <div className="sz-widget rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-semibold" style={{color: 'var(--sz-text-deep)'}}>선생님 숙제</h2>
        {latestFeedback?.has_homework && latestFeedback.homework_text ? (
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed" style={{backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-text-deep)'}}>
            {latestFeedback.homework_text}
          </div>
        ) : (
          <div className="rounded-2xl px-4 py-4 text-center text-sm" style={{backgroundColor: 'rgba(175,196,216,0.1)', color: 'var(--sz-text-muted)'}}>
            선생님이 곧 숙제를 보낼 거예요 ✏️
          </div>
        )}
      </div>

      {/* 수업 토픽 */}
      {latestFeedback?.topic && (
        <div className="sz-widget rounded-3xl p-5 space-y-2">
          <h2 className="text-sm font-semibold" style={{color: 'var(--sz-text-deep)'}}>이번 수업 주제</h2>
          <p className="text-sm" style={{color: 'var(--sz-text-muted)'}}>{latestFeedback.topic}</p>
        </div>
      )}

      {/* 배운 표현 */}
      {latestFeedback?.expressions && latestFeedback.expressions.length > 0 && (
        <div className="sz-widget rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-semibold" style={{color: 'var(--sz-text-deep)'}}>배운 표현</h2>
          <div className="flex flex-wrap gap-2">
            {latestFeedback.expressions.map((expr, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-text-deep)'}}>
                {expr}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 수업 자료 */}
      {materials.length > 0 && (
        <div className="sz-widget rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-semibold" style={{color: 'var(--sz-text-deep)'}}>수업 자료</h2>
          <div className="space-y-2">
            {materials.map(m => (
              
                key={m.id}
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                style={{backgroundColor: 'rgba(175,196,216,0.1)', color: 'var(--sz-blue-soft)'}}
              >
                <span className="text-lg">📎</span>
                <span className="text-sm font-medium truncate">{m.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type Picked = { id: string; file: File; kind: 'image' | 'file'; previewUrl?: string }

const MAX_ITEMS = 10
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

function HomeworkUploadTab({ studentId }: { studentId: string }) {
  const { data: submissions = [], isLoading } = useMyHomework(studentId)
  const submit = useSubmitHomework()

  const [items, setItems] = useState<Picked[]>([])
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setDone(false)

    const next: Picked[] = []
    let tooBig = false
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_SIZE) { tooBig = true; continue }
      const kind = f.type.startsWith('image/') ? 'image' : 'file'
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        kind,
        previewUrl: kind === 'image' ? URL.createObjectURL(f) : undefined,
      })
    }

    setItems(prev => {
      const merged = [...prev, ...next]
      if (merged.length > MAX_ITEMS) {
        merged.slice(MAX_ITEMS).forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl))
        setError(`첨부는 최대 ${MAX_ITEMS}개까지 올릴 수 있어요`)
        return merged.slice(0, MAX_ITEMS)
      }
      return merged
    })

    if (tooBig) setError('20MB가 넘는 파일은 올릴 수 없어요')
  }

  function removeItem(id: string) {
    setItems(prev => {
      const target = prev.find(p => p.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter(p => p.id !== id)
    })
  }

  async function handleSubmit() {
    if (!studentId || (items.length === 0 && !note.trim()))
