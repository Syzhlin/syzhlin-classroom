'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  useDailyLessonSummary,
  useUpsertDailyLessonSummary,
} from '@/lib/queries/useDailyLessonSummary'

interface Props {
  studentId: string
  date: string // 'yyyy-MM-dd'
}

/** 선생님이 학생·날짜별로 '오늘의 수업정리' + '다음 수업 준비 사항'을 작성하는 섹션 */
export function LessonSummarySection({ studentId, date }: Props) {
  const { data: existing } = useDailyLessonSummary(studentId, date)
  const upsert = useUpsertDailyLessonSummary()

  const [content, setContent] = useState('')
  const [nextPrep, setNextPrep] = useState('')
  const [topic, setTopic] = useState('')
  const [achievement, setAchievement] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [scores, setScores] = useState({ listening: 3, speaking: 3, reading: 3, writing: 3 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setContent(existing?.content ?? '')
    setNextPrep(existing?.next_prep ?? '')
    setTopic(existing?.topic ?? '')
    setAchievement(existing?.achievement ?? '')
    setNextFocus(existing?.next_focus ?? '')
    setScores({
      listening: existing?.listening_score ?? 3,
      speaking: existing?.speaking_score ?? 3,
      reading: existing?.reading_score ?? 3,
      writing: existing?.writing_score ?? 3,
    })
    setSaved(false)
  }, [existing, studentId, date])

  const dirty =
    content !== (existing?.content ?? '') ||
    nextPrep !== (existing?.next_prep ?? '') ||
    topic !== (existing?.topic ?? '') ||
    achievement !== (existing?.achievement ?? '') ||
    nextFocus !== (existing?.next_focus ?? '') ||
    scores.listening !== (existing?.listening_score ?? 3) ||
    scores.speaking !== (existing?.speaking_score ?? 3) ||
    scores.reading !== (existing?.reading_score ?? 3) ||
    scores.writing !== (existing?.writing_score ?? 3)
  const empty = !content.trim() && !nextPrep.trim() && !topic.trim()
  const canSave = dirty && !empty && !upsert.isPending

  async function handleSave() {
    await upsert.mutateAsync({
      student_id: studentId,
      date,
      content: content.trim() || undefined,
      next_prep: nextPrep.trim() || undefined,
      topic: topic.trim() || undefined,
      achievement: achievement.trim() || undefined,
      next_focus: nextFocus.trim() || undefined,
      listening_score: scores.listening,
      speaking_score: scores.speaking,
      reading_score: scores.reading,
      writing_score: scores.writing,
    })
    setSaved(true)
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-white">
      <div>
        <p className="text-sm font-semibold text-gray-800">📝 아이별 수업 학습 기록</p>
        <p className="text-[11px] text-gray-400 mt-1">저장한 내용은 학부모 일정에서 수업 날짜별로 보여요.</p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">수업 주제</label>
        <input
          value={topic}
          onChange={(e) => { setTopic(e.target.value); setSaved(false) }}
          placeholder="예: 여행지에서 길 묻기"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">오늘의 수업정리</label>
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setSaved(false)
          }}
          rows={3}
          placeholder="오늘 수업에서 다룬 내용을 적어주세요"
          className="resize-none"
        />
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">영역별 수업 성취도</p>
          <span className="text-[10px] text-gray-400">1 시작 · 5 아주 잘함</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([['listening', '듣기'], ['speaking', '말하기'], ['reading', '읽기'], ['writing', '쓰기']] as const).map(([key, label]) => (
            <label key={key} className="rounded-lg border border-white bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
              <span className="flex justify-between"><span>{label}</span><strong className="text-indigo-600">{scores[key]}</strong></span>
              <input
                type="range" min="1" max="5" step="1" value={scores[key]}
                onChange={(e) => { setScores(prev => ({ ...prev, [key]: Number(e.target.value) })); setSaved(false) }}
                className="mt-2 w-full accent-indigo-600"
                aria-label={`${label} 성취도`}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">오늘 잘한 점</label>
          <Textarea value={achievement} onChange={(e) => { setAchievement(e.target.value); setSaved(false) }} rows={2} placeholder="스스로 활용한 표현이나 성장한 점" className="resize-none" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">다음에 이어갈 점</label>
          <Textarea value={nextFocus} onChange={(e) => { setNextFocus(e.target.value); setSaved(false) }} rows={2} placeholder="다음 수업에서 이어서 연습할 내용" className="resize-none" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">다음 수업 준비 사항</label>
        <Textarea
          value={nextPrep}
          onChange={(e) => {
            setNextPrep(e.target.value)
            setSaved(false)
          }}
          rows={2}
          placeholder="다음 시간까지 준비할 내용을 적어주세요 (선택)"
          className="resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!canSave} size="sm">
          {upsert.isPending ? '저장 중...' : '수업정리 저장'}
        </Button>
        {saved && !dirty && (
          <span className="text-xs text-green-600">저장되었어요 ✓</span>
        )}
      </div>
    </div>
  )
}
