'use client'

import { useState, useEffect } from 'react'
import { useStudents } from '@/lib/queries/useStudents'
import { useClassFeedback, useUpsertFeedback } from '@/lib/queries/useFeedback'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

type CompletedClass = { id: string; date: string; start_time: string }

function useRecentClasses(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['completed-classes', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('classes')
        .select('id, date, start_time')
        .eq('student_id', studentId!)
        .eq('status', 'completed')
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(10)
      return (data ?? []) as CompletedClass[]
    },
  })
}

export default function FeedbackPage() {
  const { data: students = [], isLoading } = useStudents()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const selectedStudent = students.find(s => s.id === selectedStudentId)

  return (
    <div className="flex h-full min-w-0 flex-col md:flex-row">
      {/* 왼쪽: 학생 목록 */}
      <div className="border-b border-gray-100 bg-gray-50 flex shrink-0 flex-col md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-3 md:py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">학생 선택</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2 md:flex-1 md:block md:overflow-y-auto md:px-0">
          {isLoading
            ? [...Array(4)].map((_, i) => <div key={i} className="mx-3 my-1 h-10 bg-gray-200 rounded-lg animate-pulse" />)
            : students.map(student => (
              <button key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={"flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors md:w-full md:rounded-none md:px-4 md:py-2.5 " +
                  (selectedStudentId === student.id ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-100 md:bg-transparent')}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: student.color ?? '#6366f1' }}>
                  {student.name.charAt(0)}
                </div>
                <span className="text-sm font-medium truncate">{student.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* 오른쪽 */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {!selectedStudentId ? (
          <div className="flex min-h-64 flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="text-5xl mb-3">💌</div>
            <p className="text-sm font-medium">왼쪽에서 학생을 선택하세요</p>
          </div>
        ) : (
          <FeedbackList studentId={selectedStudentId} studentName={selectedStudent?.name ?? ''} />
        )}
      </div>
    </div>
  )
}

function FeedbackList({ studentId, studentName }: { studentId: string; studentName: string }) {
  const { data: classes = [], isLoading } = useRecentClasses(studentId)
  const [openClassId, setOpenClassId] = useState<string | null>(null)

  useEffect(() => {
    if (classes.length > 0 && !openClassId) setOpenClassId(classes[0].id)
  }, [classes])

  if (isLoading) return (
    <div className="p-6 space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (classes.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
      <div className="text-4xl mb-3">📅</div>
      <p className="text-sm">완료된 수업이 없어요</p>
    </div>
  )

  return (
    <div className="w-full max-w-xl space-y-2.5 p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">{studentName} 수업 피드백</h1>
        <p className="text-xs text-gray-400 mt-0.5">최근 완료된 수업 {classes.length}개</p>
      </div>

      {classes.map(cls => (
        <FeedbackCard
          key={cls.id}
          classItem={cls}
          studentId={studentId}
          studentName={studentName}
          isOpen={openClassId === cls.id}
          onToggle={() => setOpenClassId(openClassId === cls.id ? null : cls.id)}
        />
      ))}
    </div>
  )
}

function FeedbackCard({ classItem, studentId, studentName, isOpen, onToggle }: {
  classItem: CompletedClass
  studentId: string
  studentName: string
  isOpen: boolean
  onToggle: () => void
}) {
  const { data: existing } = useClassFeedback(classItem.id)
  const upsert = useUpsertFeedback()

  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (existing) setContent(existing.parent_summary ?? '')
  }, [existing])

  const dateLabel = format(parseISO(classItem.date), 'M월 d일 (EEE)', { locale: ko })
  const hasFeedback = !!existing?.parent_summary

  async function generateAI() {
    setGenerating(true)
    try {
      const res = await fetch('/api/feedback-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, classDate: dateLabel, draft: content }),
      })
      const text = await res.text()
      let data: { summary?: string; error?: string }
      try { data = JSON.parse(text) } catch { throw new Error('응답 파싱 실패') }
      if (!res.ok || data.error) throw new Error(data.error ?? 'AI 생성 실패')
      setContent(data.summary ?? '')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'AI 생성 중 오류')
    } finally { setGenerating(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsert.mutateAsync({
        class_id: classItem.id,
        student_id: studentId,
        parent_summary: content || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button className="w-full flex min-h-14 items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors sm:px-5" onClick={onToggle}>
        <div className="flex min-w-0 items-center gap-3">
          <div className={"w-2 h-2 rounded-full shrink-0 " + (hasFeedback ? 'bg-indigo-400' : 'bg-gray-200')} />
          <span className="truncate text-sm font-semibold text-gray-800">{dateLabel}</span>
          {hasFeedback && <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">작성됨</span>}
        </div>
        <span className={"text-gray-400 text-xs transition-transform " + (isOpen ? 'rotate-180' : '')}>▾</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-50 px-4 py-4 space-y-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-xs font-semibold text-gray-500">학부모에게 보낼 내용</label>
            <button onClick={generateAI} disabled={generating}
              className="flex min-h-10 items-center justify-center gap-1 text-xs px-2.5 py-1 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors font-medium">
              {generating ? '✨ 다듬는 중...' : '✨ AI 다듬기'}
            </button>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            placeholder="오늘 수업 내용을 자유롭게 메모하세요. AI 다듬기를 누르면 학부모 채널에 맞게 다듬어줘요."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
          />
          <button onClick={handleSave} disabled={saving || !content}
            className={"w-full min-h-11 py-2.5 text-sm font-semibold rounded-xl transition-colors " +
              (saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40')}>
            {saved ? '✓ 저장됨' : saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      )}
    </div>
  )
}
