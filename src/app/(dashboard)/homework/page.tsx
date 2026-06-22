'use client'

import { useState, useEffect } from 'react'
import { useStudents } from '@/lib/queries/useStudents'
import { useClassFeedback, useUpsertFeedback } from '@/lib/queries/useFeedback'
import { useStudentHomeworkSubmissions, useReviewHomework, HomeworkSubmission } from '@/lib/queries/useHomework'
import { HomeworkAttachments } from '@/components/HomeworkAttachments'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'

function formatDate(str: string) {
  return format(parseISO(str), 'M월 d일 (EEE)', { locale: ko })
}

export default function HomeworkPage() {
  const { data: students = [], isLoading } = useStudents()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const selectedStudent = students.find(s => s.id === selectedStudentId)

  return (
    <div className="flex h-full min-w-0 flex-col md:flex-row">
      {/* 왼쪽: 학생 목록 */}
      <div className="border-b border-[rgba(175,196,216,0.15)] bg-[var(--sz-bg-pastel)] flex shrink-0 flex-col md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-3 md:py-4 border-b border-[rgba(175,196,216,0.15)]">
          <h2 className="text-sm font-semibold text-[var(--sz-text-deep)]">학생 선택</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2 md:flex-1 md:block md:overflow-y-auto md:px-0">
          {isLoading
            ? [...Array(4)].map((_, i) => <div key={i} className="mx-3 my-1 h-10 bg-gray-200 rounded-lg animate-pulse" />)
            : students.map(student => (
              <button key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={"flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors md:w-full md:rounded-none md:px-4 md:py-2.5 " +
                  (selectedStudentId === student.id ? 'bg-[var(--sz-blue-pale)] text-[var(--sz-blue-soft)]' : 'bg-white text-[var(--sz-text-muted)] hover:bg-[rgba(175,196,216,0.1)] md:bg-transparent')}>
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
          <div className="flex min-h-64 flex-col items-center justify-center h-full text-center text-[var(--sz-text-muted)] opacity-70">
            <div className="text-5xl mb-3">✏️</div>
            <p className="text-sm font-medium">왼쪽에서 학생을 선택하세요</p>
          </div>
        ) : (
          <HomeworkPanel studentId={selectedStudentId} studentName={selectedStudent?.name ?? ''} />
        )}
      </div>
    </div>
  )
}

function HomeworkPanel({ studentId, studentName }: { studentId: string; studentName: string }) {
  const supabase = createClient()

  // 최근 완료 수업 조회
  const { data: latestClass } = useQuery({
    queryKey: ['latest-class', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, date')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)
      return (data as Array<{ id: string; date: string }> | null)?.[0] ?? null
    }
  })

  const { data: feedback } = useClassFeedback(latestClass?.id ?? null)
  const upsert = useUpsertFeedback()
  const { data: submissions = [], isLoading: subsLoading } = useStudentHomeworkSubmissions(studentId)
  const review = useReviewHomework()

  const [showForm, setShowForm] = useState(false)
  const [homeworkText, setHomeworkText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [reviewComment, setReviewComment] = useState('')

  useEffect(() => {
    if (feedback?.homework_text) setHomeworkText(feedback.homework_text)
  }, [feedback])

  async function handleSaveHomework() {
    if (!latestClass) return
    setSaving(true)
    try {
      await upsert.mutateAsync({
        class_id: latestClass.id,
        student_id: studentId,
        homework_text: homeworkText || undefined,
        has_homework: !!homeworkText.trim(),
      })
      setSaved(true)
      setShowForm(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleReview(sub: HomeworkSubmission) {
    await review.mutateAsync({ id: sub.id, comment: reviewComment, studentId })
    setReviewId(null)
    setReviewComment('')
  }

  const dateLabel = latestClass ? formatDate(latestClass.date) : null

  return (
    <div className="w-full max-w-xl space-y-4 p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-[var(--sz-text-deep)]">{studentName} 숙제 관리</h1>
        {dateLabel && <p className="text-xs text-[var(--sz-text-muted)] opacity-70 mt-0.5">최근 수업: {dateLabel}</p>}
      </div>

      {/* 현재 숙제 카드 */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--sz-text-deep)]">현재 숙제</span>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
              style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}
            >
              숙제 보내기
            </button>
          )}
        </div>
        {feedback?.has_homework && feedback.homework_text ? (
          <div className="rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: 'var(--sz-bg-pastel)', color: 'var(--sz-text-deep)' }}>
            {feedback.homework_text}
          </div>
        ) : (
          <p className="text-xs text-[var(--sz-text-muted)] opacity-70">아직 숙제가 없어요</p>
        )}
        {saved && <p className="text-xs font-medium" style={{ color: 'var(--sz-sage)' }}>✓ 저장됐어요</p>}

        {showForm && (
          <div className="space-y-2 border-t pt-3" style={{ borderColor: 'rgba(175,196,216,0.2)' }}>
            <textarea
              value={homeworkText}
              onChange={e => setHomeworkText(e.target.value)}
              rows={3}
              placeholder="숙제 내용을 입력하세요"
              className="w-full px-3 py-2.5 border border-[rgba(175,196,216,0.3)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)] leading-relaxed"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm rounded-xl border font-medium"
                style={{ borderColor: 'rgba(175,196,216,0.3)', color: 'var(--sz-text-muted)' }}
              >
                취소
              </button>
              <button
                onClick={handleSaveHomework}
                disabled={saving || !homeworkText.trim() || !latestClass}
                className="flex-1 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-35 transition-all"
                style={{ backgroundColor: 'var(--sz-blue-soft)' }}
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 제출 내역 */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--sz-text-muted)' }}>제출 내역</h2>
        {subsLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid var(--sz-blue-soft)', borderTopColor: 'transparent' }} />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-sm" style={{ color: 'var(--sz-text-muted)' }}>
            아직 제출한 숙제가 없어요
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <HomeworkAttachments attachments={s.attachments} photoUrl={s.photo_url} />
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={s.status === 'reviewed'
                        ? { backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }
                        : { backgroundColor: 'var(--sz-peach-pale)', color: 'var(--sz-peach)' }
                      }>
                      {s.status === 'reviewed' ? '확인 완료' : '검토 중'}
                    </span>
                  </div>
                  {s.note && <p className="text-sm text-gray-700">{s.note}</p>}
                  {s.teacher_comment && (
                    <div className="rounded-xl px-3 py-2.5 flex gap-2" style={{ backgroundColor: 'var(--sz-peach-pale)' }}>
                      <MessageSquare className="w-4 h-4 text-[var(--sz-warm-gray)] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--sz-navy)] leading-relaxed">{s.teacher_comment}</p>
                    </div>
                  )}
                  {reviewId === s.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        rows={2}
                        placeholder="코멘트를 입력하세요"
                        className="w-full px-3 py-2 border border-[rgba(175,196,216,0.3)] rounded-xl text-sm resize-none focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setReviewId(null)} className="flex-1 py-1.5 text-xs rounded-xl border" style={{ borderColor: 'rgba(175,196,216,0.3)', color: 'var(--sz-text-muted)' }}>취소</button>
                        <button onClick={() => handleReview(s)} disabled={!reviewComment.trim() || review.isPending} className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white disabled:opacity-35" style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
                          {review.isPending ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReviewId(s.id); setReviewComment(s.teacher_comment ?? '') }}
                      className="text-xs px-3 py-1.5 rounded-xl font-medium"
                      style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}
                    >
                      {s.teacher_comment ? '코멘트 수정' : '코멘트 달기'}
                    </button>
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
