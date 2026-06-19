'use client'

import { useState } from 'react'
import { useStudents } from '@/lib/queries/useStudents'
import { useStudentReports } from '@/lib/queries/useGrowthReports'
import { GrowthReportModal } from '@/components/growth/GrowthReportModal'
import { PentagonChart } from '@/components/growth/PentagonChart'
import type { GrowthReport } from '@/lib/queries/useGrowthReports'

function formatPeriod(period: string) {
  const [y, m] = period.split('-')
  return `${y}년 ${parseInt(m)}월`
}

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-500',
  saved:     'bg-blue-50 text-blue-600',
  published: 'bg-green-100 text-green-700',
}
const STATUS_LABEL: Record<string, string> = {
  draft:     '임시저장',
  saved:     '저장됨',
  published: '학부모 공개',
}

export default function ReportsPage() {
  const { data: students = [], isLoading } = useStudents()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  return (
    <div className="flex h-full min-w-0 flex-col md:flex-row">
      {/* 왼쪽: 학생 목록 */}
      <div className="border-b border-gray-100 bg-gray-50 flex shrink-0 flex-col md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-3 md:py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">학생 선택</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2 md:flex-1 md:block md:overflow-y-auto md:px-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />)}
            </div>
          ) : students.map(student => (
            <button key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={"flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors md:w-full md:rounded-none md:px-4 md:py-2.5 " +
                (selectedStudentId === student.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100 md:bg-transparent')}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: student.color ?? '#6366f1' }}>
                {student.name.charAt(0)}
              </div>
              <span className="text-sm font-medium truncate">{student.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 오른쪽: 리포트 목록 */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {!selectedStudentId ? (
          <div className="flex min-h-64 flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-sm font-medium">왼쪽에서 학생을 선택하세요</p>
          </div>
        ) : (
          <ReportsList
            studentId={selectedStudentId}
            studentName={selectedStudent?.name ?? ''}
            onNew={() => setModalOpen(true)}
          />
        )}
      </div>

      {/* 성장리포트 모달 */}
      {modalOpen && selectedStudentId && (
        <GrowthReportModal
          studentId={selectedStudentId}
          studentName={selectedStudent?.name ?? ''}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

function ReportsList({ studentId, studentName, onNew }: {
  studentId: string
  studentName: string
  onNew: () => void
}) {
  const { data: reports = [], isLoading } = useStudentReports(studentId)
  const [editPeriod, setEditPeriod] = useState<string | null>(null)

  return (
    <div className="w-full max-w-2xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5 sm:items-center sm:mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{studentName} 성장리포트</h1>
          <p className="text-xs text-gray-400 mt-0.5">{reports.length}개의 리포트</p>
        </div>
        <button onClick={onNew}
          className="flex min-h-11 shrink-0 items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          <span className="text-base leading-none">+</span> 새 리포트
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && reports.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-sm">아직 리포트가 없어요</p>
          <p className="text-xs mt-1">+ 새 리포트를 눌러 첫 번째 리포트를 만들어보세요</p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map(report => (
          <ReportRow key={report.id} report={report} onEdit={() => setEditPeriod(report.period)} />
        ))}
      </div>

      {/* 편집 모달 */}
      {editPeriod && (
        <GrowthReportModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setEditPeriod(null)}
        />
      )}
    </div>
  )
}

function ReportRow({ report, onEdit }: { report: GrowthReport; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const scores = [
    report.score_expression ?? 0,
    report.score_comprehension ?? 0,
    report.score_reading_fluency ?? 0,
    report.score_sentence_building ?? 0,
    report.score_willingness ?? 0,
  ]
  const avg = scores.filter(s => s > 0).length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.filter(s => s > 0).length).toFixed(1)
    : '-'

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      {/* 헤더 행 */}
      <div className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors sm:gap-4 sm:px-5"
        onClick={() => setExpanded(prev => !prev)}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">{formatPeriod(report.period)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[report.status]}`}>
              {STATUS_LABEL[report.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">수업 {report.lesson_count}회 · 평균 {avg}점</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onEdit() }}
          className="min-h-10 shrink-0 text-xs px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
          수정
        </button>
        <span className={"text-gray-400 transition-transform " + (expanded ? 'rotate-180' : '')}>▾</span>
      </div>

      {/* 상세 - 펼치기 */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-4 bg-gray-50/50 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            {/* 오각형 차트 */}
            {scores.some(s => s > 0) && (
              <div className="shrink-0">
                <PentagonChart scores={scores} size={160} />
              </div>
            )}
            {/* AI 리포트 미리보기 */}
            {report.generated_report && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">리포트 미리보기</p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-6 whitespace-pre-wrap">
                  {report.generated_report}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
