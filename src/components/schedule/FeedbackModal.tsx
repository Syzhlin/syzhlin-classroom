'use client'

import { useState, useEffect } from 'react'
import { useClassFeedback, useUpsertFeedback, type FeedbackRow } from '@/lib/queries/useFeedback'

interface Props {
  classId: string
  studentId: string
  studentName: string
  classDate: string
  onClose: () => void
}

export function FeedbackModal({ classId, studentId, studentName, classDate, onClose }: Props) {
  const { data: existing } = useClassFeedback(classId)
  const upsert = useUpsertFeedback()

  const [topic, setTopic] = useState('')
  const [expressionsRaw, setExpressionsRaw] = useState('')
  const [goodPoints, setGoodPoints] = useState('')
  const [practiceNeeded, setPracticeNeeded] = useState('')
  const [homeworkText, setHomeworkText] = useState('')
  const [hasHomework, setHasHomework] = useState(false)
  const [parentSummary, setParentSummary] = useState('')

  useEffect(() => {
    if (existing) {
      setTopic(existing.topic ?? '')
      setExpressionsRaw((existing.expressions ?? []).join(', '))
      setGoodPoints(existing.good_points ?? '')
      setPracticeNeeded(existing.practice_needed ?? '')
      setHomeworkText(existing.homework_text ?? '')
      setHasHomework(existing.has_homework)
      setParentSummary(existing.parent_summary ?? '')
    }
  }, [existing])

  async function handleSave() {
    await upsert.mutateAsync({
      class_id: classId,
      student_id: studentId,
      topic: topic || undefined,
      expressions: expressionsRaw ? expressionsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
      good_points: goodPoints || undefined,
      practice_needed: practiceNeeded || undefined,
      homework_text: homeworkText || undefined,
      has_homework: hasHomework,
      parent_summary: parentSummary || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-base font-semibold text-gray-900">선생님의 편지 작성</h2>
            <p className="text-xs text-gray-400 mt-0.5">{studentName} · {classDate}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 오늘의 주제 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">오늘의 수업 주제</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="예) 이유를 붙여 문장 말하기 연습"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* 배운 표현 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">오늘 배운 표현</label>
            <input
              value={expressionsRaw}
              onChange={e => setExpressionsRaw(e.target.value)}
              placeholder="interest, diary, culture (쉼표로 구분)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="mt-1 text-xs text-gray-400">쉼표로 구분해서 입력하세요</p>
          </div>

          {/* 잘한 점 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">잘한 점 ✨</label>
            <textarea
              value={goodPoints}
              onChange={e => setGoodPoints(e.target.value)}
              rows={2}
              placeholder="예) 문장을 혼자 완성하려는 시도가 아주 좋았어요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* 다음에 연습할 점 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">다음에 연습할 점</label>
            <textarea
              value={practiceNeeded}
              onChange={e => setPracticeNeeded(e.target.value)}
              rows={2}
              placeholder="예) because를 사용해 이유를 붙이는 연습 더 필요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* 숙제 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">숙제</label>
              <button
                type="button"
                onClick={() => setHasHomework(v => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasHomework ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${hasHomework ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-gray-400">{hasHomework ? '있음' : '없음'}</span>
            </div>
            {hasHomework && (
              <textarea
                value={homeworkText}
                onChange={e => setHomeworkText(e.target.value)}
                rows={2}
                placeholder="숙제 내용을 입력하세요"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            )}
          </div>

          {/* 학부모 요약 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학부모용 한줄 요약</label>
            <textarea
              value={parentSummary}
              onChange={e => setParentSummary(e.target.value)}
              rows={2}
              placeholder="예) 오늘은 이유를 붙여 문장을 길게 말하는 연습을 잘 따라왔어요!"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">학부모 홈 '선생님의 편지'에 표시됩니다</p>
          </div>
        </div>

        <div className="px-5 pb-6 flex gap-2 sticky bottom-0 bg-white pt-2 border-t border-gray-50">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {upsert.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
