'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useDailyLessonSummary } from '@/lib/queries/useDailyLessonSummary'

interface Props {
  studentId: string | null
}

/** 학생/학부모 포털 - '오늘의 수업정리' 읽기 전용 카드 */
export function LessonSummaryCard({ studentId }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: summary } = useDailyLessonSummary(studentId, today)
  const todayLabel = format(new Date(), 'M월 d일 (EEEE)', { locale: ko })

  return (
    <div
      style={{
        borderRadius: '28px',
        backgroundColor: '#FFFDF8',
        boxShadow: '7px 7px 20px rgba(100,88,65,0.09), -4px -4px 12px rgba(255,255,255,0.88)',
        border: '1px solid rgba(255,255,255,0.75)',
        padding: '20px',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: '16px' }}>📝</span>
        <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--sz-text-deep)' }}>
          오늘의 수업정리
        </h2>
        <span className="ml-auto" style={{ fontSize: '11px', color: 'var(--sz-text-muted)' }}>
          {todayLabel}
        </span>
      </div>

      {summary?.content ? (
        <p
          className="whitespace-pre-wrap"
          style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--sz-text-deep)' }}
        >
          {summary.content}
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--sz-text-muted)' }}>
          오늘 등록된 수업정리가 아직 없어요.
        </p>
      )}

      {summary?.next_prep && (
        <div
          className="mt-4 pt-3"
          style={{ borderTop: '1px solid rgba(100,88,65,0.10)' }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--sz-text-deep)',
              marginBottom: '4px',
            }}
          >
            📌 다음 수업 준비 사항
          </p>
          <p
            className="whitespace-pre-wrap"
            style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--sz-text-deep)' }}
          >
            {summary.next_prep}
          </p>
        </div>
      )}
    </div>
  )
}
