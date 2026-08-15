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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setContent(existing?.content ?? '')
    setNextPrep(existing?.next_prep ?? '')
    setSaved(false)
  }, [existing, studentId, date])

  const dirty =
    content !== (existing?.content ?? '') || nextPrep !== (existing?.next_prep ?? '')
  const empty = !content.trim() && !nextPrep.trim()
  const canSave = dirty && !empty && !upsert.isPending

  async function handleSave() {
    await upsert.mutateAsync({
      student_id: studentId,
      date,
      content: content.trim() || undefined,
      next_prep: nextPrep.trim() || undefined,
    })
    setSaved(true)
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">📝 수업정리</p>

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
