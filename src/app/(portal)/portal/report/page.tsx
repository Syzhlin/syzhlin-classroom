'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePublishedReports, type GrowthReport } from '@/lib/queries/useGrowthReports'
import { PentagonChart } from '@/components/growth/PentagonChart'

function formatPeriod(period: string) {
  const [y, m] = period.split('-')
  return `${y}년 ${parseInt(m)}월`
}

const CATEGORIES = [
  { key: 'expression',       label: '표현력',     scoreKey: 'score_expression',       noteKey: 'note_expression' },
  { key: 'comprehension',    label: '이해력',     scoreKey: 'score_comprehension',    noteKey: 'note_comprehension' },
  { key: 'reading_fluency',  label: '읽기 유창성', scoreKey: 'score_reading_fluency',  noteKey: 'note_reading_fluency' },
  { key: 'sentence_building',label: '문장 구성력', scoreKey: 'score_sentence_building', noteKey: 'note_sentence_building' },
  { key: 'willingness',      label: '시도하는 힘', scoreKey: 'score_willingness',      noteKey: 'note_willingness' },
] as const

// ── 월별 리포트 카드 (아코디언) ─────────────────────────────
function MonthReportCard({ report, defaultOpen }: { report: GrowthReport; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  const scores = [
    report.score_expression ?? 0,
    report.score_comprehension ?? 0,
    report.score_reading_fluency ?? 0,
    report.score_sentence_building ?? 0,
    report.score_willingness ?? 0,
  ]
  const hasScores = scores.some(s => s > 0)

  const avgScore = hasScores
    ? (scores.reduce((a, b) => a + b, 0) / scores.filter(s => s > 0).length).toFixed(1)
    : null

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden" style={{backgroundColor: "var(--sz-paper)", borderColor: "var(--sz-beige)"}}>
      {/* 헤더 (항상 표시) */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          {/* 월 라벨 */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: "var(--sz-navy)"}}>
            <span className="text-white text-xs font-bold leading-tight text-center">
              {report.period.split('-')[1]}월
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">{formatPeriod(report.period)}</p>
            <p className="text-xs text-gray-400">수업 {report.lesson_count}회 · 평균 {avgScore ?? '—'}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 펼쳐지는 내용 */}
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
          {/* 레이더 차트 */}
          {hasScores && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 text-center mb-3">성장 레이더</p>
              <PentagonChart scores={scores} size={180} />

              <div className="mt-4 space-y-2">
                {CATEGORIES.map(({ label, scoreKey }) => {
                  const score = report[scoreKey] as number | null
                  if (!score) return null
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-[var(--sz-navy)] h-1.5 rounded-full transition-all"
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--sz-navy)] w-4 text-right">{score}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 영역별 코멘트 */}
          {CATEGORIES.some(({ noteKey }) => report[noteKey]) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">영역별 코멘트</p>
              {CATEGORIES.map(({ label, scoreKey, noteKey }) => {
                const note = report[noteKey] as string | null
                const score = report[scoreKey] as number | null
                if (!note) return null
                return (
                  <div key={label} className="bg-[var(--sz-cream)] rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                      {score && (
                        <span className="text-xs text-[var(--sz-navy)] font-bold">{score}/5</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{note}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* 선생님 종합 코멘트 */}
          {report.generated_report && (
            <div className="bg-[var(--sz-gold-light)] rounded-xl px-4 py-4">
              <p className="text-xs font-semibold text-[var(--sz-navy)] mb-2">📝 선생님의 코멘트</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {report.generated_report}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function PortalReportPage() {
  const { data: profile } = useProfile()
  const { selectedStudentId: studentId } = usePortalStudent()
  const { data: reports, isLoading } = usePublishedReports(studentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[var(--sz-navy)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">🌱</div>
        <p className="font-semibold text-gray-700">아직 성장리포트가 없어요</p>
        <p className="text-sm text-gray-400 mt-2">선생님이 리포트를 작성하면 여기서 확인할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-3">
      {/* 헤더 */}
      <div className="mb-2">
        <h1 className="text-lg font-bold text-gray-900">성장리포트 🌟</h1>
        <p className="text-xs text-gray-400 mt-0.5">총 {reports.length}개월 누적</p>
      </div>

      {/* 타임라인: 최신이 위, 아래로 쌓임 */}
      <div className="relative">
        {/* 왼쪽 타임라인 선 */}
        {reports.length > 1 && (
          <div className="absolute left-5 top-10 bottom-10 w-0.5 z-0" style={{backgroundColor: "var(--sz-beige)"}} />
        )}

        <div className="space-y-3 relative z-10">
          {reports.map((report, i) => (
            <MonthReportCard
              key={report.id}
              report={report}
              defaultOpen={i === 0}   // 최신 월만 기본 펼침
            />
          ))}
        </div>
      </div>
    </div>
  )
}
