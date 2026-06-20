'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Camera, ImagePlus, X, Send, CheckCircle, MessageSquare } from 'lucide-react'
import { useProfile } from '@/lib/queries/useProfile'
import { useMyHomework, useSubmitHomework } from '@/lib/queries/useHomework'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalHome } from '@/lib/queries/useFeedback'
import { usePortalMaterials } from '@/lib/queries/useMaterials'

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
              <a
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

function HomeworkUploadTab({ studentId }: { studentId: string }) {
  const { data: submissions = [], isLoading } = useMyHomework(studentId)
  const submit = useSubmitHomework()

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setDone(false)
  }

  function clearPhoto() {
    setFile(null)
    setPreviewUrl(null)
  }

  async function handleSubmit() {
    if (!studentId || (!file && !note.trim())) return
    await submit.mutateAsync({ studentId, file, note })
    setFile(null)
    setPreviewUrl(null)
    setNote('')
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div className="space-y-5">
      {/* 제출 폼 */}
      <div className="sz-widget rounded-3xl p-5 space-y-4">
        <h2 className="text-sm font-semibold" style={{color: 'var(--sz-text-deep)'}}>숙제 제출</h2>
        <p className="text-xs" style={{color: 'var(--sz-text-muted)'}}>사진을 찍거나 골라서 선생님께 보내요</p>

        {/* 사진 영역 */}
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="숙제 사진" className="w-full h-full object-cover" />
            <button
              onClick={clearPhoto}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl transition-colors" style={{backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)', border: '2px dashed var(--sz-blue-soft)'}}
            >
              <Camera className="w-7 h-7" />
              <span className="text-xs font-medium">사진 찍기</span>
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl transition-colors" style={{backgroundColor: 'var(--sz-pink-pale)', color: 'var(--sz-pink-soft)', border: '2px dashed var(--sz-pink-soft)'}}
            >
              <ImagePlus className="w-7 h-7" />
              <span className="text-xs font-medium">사진 고르기</span>
            </button>
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={galleryRef} type="file" accept="image/*"
          className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="선생님께 하고 싶은 말을 써도 돼요 😊"
          className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]" style={{border: '1.5px solid rgba(175,196,216,0.3)', borderRadius: '16px', backgroundColor: 'rgba(175,196,216,0.08)'}}
        />

        <button
          onClick={handleSubmit}
          disabled={submit.isPending || (!file && !note.trim())}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors text-white disabled:opacity-40`}
          style={done ? {backgroundColor: 'var(--sz-sage)'} : {backgroundColor: 'var(--sz-blue-soft)'}}
        >
          {done ? (
            <><CheckCircle className="w-4 h-4" /> 제출 완료!</>
          ) : submit.isPending ? '제출 중...' : (
            <><Send className="w-4 h-4" /> 선생님께 보내기</>
          )}
        </button>
      </div>

      {/* 제출 내역 */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{color: 'var(--sz-text-muted)'}}>제출 내역</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full animate-spin" style={{border: '2px solid var(--sz-blue-soft)', borderTopColor: 'transparent'}} />
          </div>
        ) : submissions.length === 0 ? (
          <div className="sz-widget rounded-3xl p-6 text-center text-sm" style={{color: 'var(--sz-text-muted)'}}>
            아직 제출한 숙제가 없어요
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => (
              <div key={s.id} className="sz-widget rounded-3xl overflow-hidden">
                {s.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt="숙제" className="w-full aspect-[4/3] object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={s.status === 'reviewed'
                        ? {backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)'}
                        : {backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)'}
                      }>
                      {s.status === 'reviewed' ? '확인 완료' : '검토 중'}
                    </span>
                  </div>
                  {s.note && <p className="text-sm text-gray-700">{s.note}</p>}
                  {s.teacher_comment && (
                    <div className="rounded-xl px-3 py-2.5 flex gap-2" style={{backgroundColor: 'var(--sz-peach-pale)'}}>
                      <MessageSquare className="w-4 h-4 text-[var(--sz-warm-gray)] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--sz-navy)] leading-relaxed">{s.teacher_comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
