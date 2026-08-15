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
  studentName?: string
}

/** 선생님이 학생·날짜별로 '오늘의 수업정리' + '다음 수업 준비 사항'을 작성하는 섹션 */
export function LessonSummarySection({ studentId, date, studentName }: Props) {
  const { data: existing } = useDailyLessonSummary(studentId, date)
  const upsert = useUpsertDailyLessonSummary()

  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')
  const [transcript, setTranscript] = useState('')
  const [scores, setScores] = useState({ listening: 3, speaking: 3, reading: 3, writing: 3 })
  const [saved, setSaved] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    setContent(existing?.content ?? '')
    setTopic(existing?.topic ?? '')
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
    topic !== (existing?.topic ?? '') ||
    scores.listening !== (existing?.listening_score ?? 3) ||
    scores.speaking !== (existing?.speaking_score ?? 3) ||
    scores.reading !== (existing?.reading_score ?? 3) ||
    scores.writing !== (existing?.writing_score ?? 3)
  const empty = !content.trim() && !topic.trim()
  const canSave = dirty && !empty && !upsert.isPending

  async function handleSave() {
    await upsert.mutateAsync({
      student_id: studentId,
      date,
      content: content.trim() || undefined,
      next_prep: existing?.next_prep || undefined,
      topic: topic.trim() || undefined,
      achievement: existing?.achievement || undefined,
      next_focus: existing?.next_focus || undefined,
      listening_score: scores.listening,
      speaking_score: scores.speaking,
      reading_score: scores.reading,
      writing_score: scores.writing,
    })
    setSaved(true)
  }

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setAnalysisError('수업 전사본을 먼저 붙여넣어 주세요.')
      return
    }
    setAnalyzing(true)
    setAnalysisError('')
    setSaved(false)
    try {
      const response = await fetch('/api/lesson-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim(), studentName, classDate: date }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'AI 분석에 실패했습니다.')
      setTopic(result.topic)
      setContent(result.content)
      setScores({
        listening: result.listening_score,
        speaking: result.speaking_score,
        reading: result.reading_score,
        writing: result.writing_score,
      })
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'AI 분석에 실패했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-white">
      <div>
        <p className="text-sm font-semibold text-gray-800">📝 아이별 수업 학습 기록</p>
        <p className="text-[11px] text-gray-400 mt-1">수업 전사본을 붙여넣으면 AI가 주제·학습 내용·4영역 척도를 작성해요.</p>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 space-y-2">
        <label className="block text-sm font-semibold text-violet-900">수업 전사본</label>
        <Textarea
          value={transcript}
          onChange={(e) => { setTranscript(e.target.value); setAnalysisError('') }}
          rows={7}
          placeholder="Zoom·Clova·Whisper 등에서 복사한 수업 전사본을 여기에 붙여넣으세요."
          className="resize-y bg-white"
        />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleAnalyze} disabled={analyzing || !transcript.trim()} size="sm" className="bg-violet-600 hover:bg-violet-700">
            {analyzing ? 'AI 분석 중…' : '✨ AI로 학습 기록 만들기'}
          </Button>
          {analysisError && <span className="text-xs text-red-600">{analysisError}</span>}
        </div>
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
