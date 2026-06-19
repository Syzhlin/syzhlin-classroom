'use client'

import { useState, useEffect } from 'react'
import { PentagonChart } from '@/components/growth/PentagonChart'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUpsertGrowthReport, useStudentReportByPeriod, type GrowthReport } from '@/lib/queries/useGrowthReports'

const ITEMS = [
  { key: 'expression',       label: '표현력',      desc: '영어로 자기 생각을 말하는 힘' },
  { key: 'comprehension',    label: '이해력',      desc: '질문과 지시를 듣고 의미를 파악하는 힘' },
  { key: 'readingFluency',   label: '읽기 유창성',  desc: '문장을 자연스럽게 소리 내어 읽는 힘' },
  { key: 'sentenceBuilding', label: '문장 구성력',  desc: '단어와 표현을 연결해 문장을 만드는 힘' },
  { key: 'willingness',      label: '시도하는 힘',  desc: '틀려도 먼저 말하고 도전하는 태도' },
] as const

type ScoreKey = typeof ITEMS[number]['key']

const SCORE_LABELS = ['', '도움 많이 필요', '조금씩 따라옴', '안정적으로 진행', '성장이 잘 보임', '자신 있게 활용']

interface Props {
  studentId: string
  studentName: string
  onClose: () => void
}

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function GrowthReportModal({ studentId, studentName, onClose }: Props) {
  // 이번달 완료 수업 횟수 계산
  const supabase = createClient()
  const { data: lessonCountData } = useQuery({
    queryKey: ['lesson-count-month', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      const { count } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .gte('date', start)
        .lte('date', end)
      return count ?? 0
    },
  })
  const lessonCount = lessonCountData ?? 0
  const [period, setPeriod] = useState(currentPeriod())
  const { data: existing } = useStudentReportByPeriod(studentId, period)
  const upsert = useUpsertGrowthReport()

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    expression: 0, comprehension: 0, readingFluency: 0, sentenceBuilding: 0, willingness: 0,
  })
  const [notes, setNotes] = useState<Record<ScoreKey, string>>({
    expression: '', comprehension: '', readingFluency: '', sentenceBuilding: '', willingness: '',
  })
  const [keywords, setKeywords] = useState('')
  const [generatedReport, setGeneratedReport] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [status, setStatus] = useState<'draft' | 'saved' | 'published'>('draft')

  useEffect(() => {
    if (existing) {
      setScores({
        expression: existing.score_expression ?? 0,
        comprehension: existing.score_comprehension ?? 0,
        readingFluency: existing.score_reading_fluency ?? 0,
        sentenceBuilding: existing.score_sentence_building ?? 0,
        willingness: existing.score_willingness ?? 0,
      })
      setNotes({
        expression: existing.note_expression ?? '',
        comprehension: existing.note_comprehension ?? '',
        readingFluency: existing.note_reading_fluency ?? '',
        sentenceBuilding: existing.note_sentence_building ?? '',
        willingness: existing.note_willingness ?? '',
      })
      setGeneratedReport(existing.generated_report ?? '')
      setStatus(existing.status)
      setKeywords('')  // 키워드는 매번 새로 입력
    }
  }, [existing])

  const scoreArray = [scores.expression, scores.comprehension, scores.readingFluency, scores.sentenceBuilding, scores.willingness]
  const allScored = scoreArray.every(s => s > 0)
  const [y, m] = period.split('-')

  function setScore(key: ScoreKey, v: number) {
    setScores(prev => ({ ...prev, [key]: v }))
  }
  function setNote(key: ScoreKey, v: string) {
    setNotes(prev => ({ ...prev, [key]: v }))
  }

  async function generateReport() {
    setGenerating(true)
    try {
      const res = await fetch('/api/growth-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName, period, lessonCount,
          scores: { expression: scores.expression, comprehension: scores.comprehension, readingFluency: scores.readingFluency, sentenceBuilding: scores.sentenceBuilding, willingness: scores.willingness },
          notes: { expression: notes.expression, comprehension: notes.comprehension, readingFluency: notes.readingFluency, sentenceBuilding: notes.sentenceBuilding, willingness: notes.willingness },
          keywords,
        }),
      })
      const text = await res.text()
      let data: { report?: string; error?: string }
      try { data = JSON.parse(text) } catch { throw new Error('서버 응답을 파싱할 수 없어요. 잠시 후 다시 시도해주세요.') }
      if (!res.ok || data.error) throw new Error(data.error ?? 'AI 리포트 생성 실패')
      setGeneratedReport(data.report ?? '')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'AI 리포트 생성 중 오류가 발생했습니다.')
    } finally { setGenerating(false) }
  }

  async function save(targetStatus: 'saved' | 'published') {
    targetStatus === 'published' ? setPublishing(true) : setSaving(true)
    try {
      await upsert.mutateAsync({
        student_id: studentId, period, lesson_count: lessonCount,
        score_expression: scores.expression || null,
        score_comprehension: scores.comprehension || null,
        score_reading_fluency: scores.readingFluency || null,
        score_sentence_building: scores.sentenceBuilding || null,
        score_willingness: scores.willingness || null,
        note_expression: notes.expression || null,
        note_comprehension: notes.comprehension || null,
        note_reading_fluency: notes.readingFluency || null,
        note_sentence_building: notes.sentenceBuilding || null,
        note_willingness: notes.willingness || null,
        generated_report: generatedReport || null,
        status: targetStatus,
      })
      setStatus(targetStatus)
      if (targetStatus === 'published') onClose()
    } finally { setSaving(false); setPublishing(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 overflow-y-auto sm:items-start sm:py-4">
      <div className="relative w-full max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:mx-4 sm:my-4 sm:rounded-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">성장리포트 생성</h2>
            <p className="text-xs text-gray-400 mt-0.5">학생: {studentName}</p>
          </div>
          <button onClick={onClose} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="px-4 py-5 space-y-6 sm:px-6">
          {/* 기간 + 수업 횟수 */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">리포트 기간</label>
              <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">수업 횟수</label>
              <p className="text-sm font-semibold text-gray-800 px-3 py-2">{lessonCount}회</p>
            </div>
            {status !== 'draft' && (
              <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${status === 'published' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                {status === 'published' ? '학부모 공개 중' : '저장됨'}
              </span>
            )}
          </div>

          {/* 평가 항목 */}
          <div className="space-y-5">
            {ITEMS.map(({ key, label, desc }) => (
              <div key={key}>
                <div className="flex flex-col gap-0.5 mb-1.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                  <span className="text-xs text-gray-400">{desc}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} onClick={() => setScore(key, v)}
                      className={"w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all " +
                        (scores[key] === v
                          ? 'bg-indigo-600 text-white border-indigo-600 scale-110'
                          : 'border-gray-200 text-gray-400 hover:border-indigo-300')}>
                      {v}
                    </button>
                  ))}
                  {scores[key] > 0 && (
                    <span className="ml-2 self-center text-xs text-indigo-500 font-medium">{SCORE_LABELS[scores[key]]}</span>
                  )}
                </div>
                <input value={notes[key]} onChange={e => setNote(key, e.target.value)}
                  placeholder={`${label} 관찰 메모 (선택)`}
                  className="w-full px-3 py-2 border border-gray-100 rounded-lg text-xs text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
              </div>
            ))}
          </div>

          {/* 오각형 차트 미리보기 */}
          {allScored && (
            <div className="bg-gray-50 rounded-2xl py-6">
              <p className="text-xs text-gray-400 text-center mb-3">성장 레이더</p>
              <PentagonChart scores={scoreArray} />
            </div>
          )}

          {/* 키워드 입력 */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-2 block">
              이번 달 키워드 <span className="text-xs font-normal text-gray-400">(쉼표로 구분, AI 리포트에 반영됩니다)</span>
            </label>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="예: 발표 용기, 자신감 UP, 긴 문장 연습, 스스로 읽기 시도"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* AI 생성 버튼 */}
          <div>
            <button onClick={generateReport} disabled={!allScored || generating}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {generating ? '✨ AI가 리포트를 작성 중이에요...' : '✨ AI 성장리포트 생성'}
            </button>
            {!allScored && <p className="text-xs text-gray-400 text-center mt-1">5개 항목을 모두 평가하면 생성할 수 있어요</p>}
          </div>

          {/* AI 생성 결과 */}
          {generatedReport && (
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-2 block">생성된 리포트 (직접 수정 가능)</label>
              <textarea value={generatedReport} onChange={e => setGeneratedReport(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-indigo-50/30" />
            </div>
          )}

          {/* 저장 / 공개 버튼 */}
          <div className="flex flex-col gap-2 pb-2 sm:flex-row">
            <button onClick={() => save('saved')} disabled={!allScored || saving}
              className="flex-1 min-h-11 py-2.5 border-2 border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 disabled:opacity-40">
              {saving ? '저장 중...' : '💾 저장'}
            </button>
            <button onClick={() => save('published')} disabled={!allScored || !generatedReport || publishing}
              className="flex-1 min-h-11 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40">
              {publishing ? '공개 중...' : '📤 학부모 채널 공개'}
            </button>
          </div>
          {!generatedReport && allScored && (
            <p className="text-xs text-gray-400 text-center -mt-4">AI 리포트를 생성해야 학부모에게 공개할 수 있어요</p>
          )}
        </div>
      </div>
    </div>
  )
}
