'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Camera, ImagePlus, X, Send, CheckCircle, MessageSquare } from 'lucide-react'
import { useProfile } from '@/lib/queries/useProfile'
import { useMyHomework, useSubmitHomework } from '@/lib/queries/useHomework'

function formatDate(str: string) {
  return format(parseISO(str), 'M월 d일 (EEE)', { locale: ko })
}

export default function HomeworkPage() {
  const { data: profile } = useProfile()
  const studentId = profile?.linked_student_id ?? null

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

  if (!studentId) {
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
        <h1 className="text-xl font-bold text-gray-900">숙제 제출 ✏️</h1>
        <p className="text-xs text-gray-400 mt-0.5">사진을 찍거나 골라서 선생님께 보내요</p>
      </div>

      {/* 제출 폼 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

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
            {/* 카메라 촬영 */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
            >
              <Camera className="w-7 h-7" />
              <span className="text-xs font-medium">사진 찍기</span>
            </button>
            {/* 갤러리 선택 */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ImagePlus className="w-7 h-7" />
              <span className="text-xs font-medium">사진 고르기</span>
            </button>
          </div>
        )}

        {/* hidden inputs */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={galleryRef} type="file" accept="image/*"
          className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {/* 메모 */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="선생님께 하고 싶은 말을 써도 돼요 😊"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={submit.isPending || (!file && !note.trim())}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            done
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 text-white disabled:opacity-40'
          }`}
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
        <h2 className="text-sm font-semibold text-gray-500 mb-3">제출 내역</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400">
            아직 제출한 숙제가 없어요
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* 사진 */}
                {s.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt="숙제" className="w-full aspect-[4/3] object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.status === 'reviewed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {s.status === 'reviewed' ? '확인 완료' : '검토 중'}
                    </span>
                  </div>
                  {s.note && <p className="text-sm text-gray-700">{s.note}</p>}
                  {/* 선생님 코멘트 */}
                  {s.teacher_comment && (
                    <div className="bg-indigo-50 rounded-xl px-3 py-2.5 flex gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-700 leading-relaxed">{s.teacher_comment}</p>
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
