'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useDailyLessonSummary } from '@/lib/queries/useDailyLessonSummary'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  studentId: string | null
}

/** 학생/학부모 포털 - '오늘의 수업정리' 읽기 전용 카드 (기본 줄여보기 + 전체보기 모달) */
export function LessonSummaryCard({ studentId }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: summary } = useDailyLessonSummary(studentId, today)
  const todayLabel = format(new Date(), 'M월 d일 (EEEE)', { locale: ko })

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasContent = !!summary?.content
  const hasNextPrep = !!summary?.next_prep

  const handleCopy = async () => {
    if (!hasContent && !hasNextPrep) return
    const parts: string[] = []
    if (summary?.content) parts.push(summary.content)
    if (summary?.next_prep) parts.push(`📌 다음 수업 준비 사항\n${summary.next_prep}`)
    try {
      await navigator.clipboard.writeText(parts.join('\n\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 클립보드 미지원/권한 거부 시 무시 */
    }
  }

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

      {hasContent ? (
        <>
          <p
            className="line-clamp-3 whitespace-pre-wrap"
            style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--sz-text-deep)' }}
          >
            {summary!.content}
          </p>

          {hasNextPrep && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(100,88,65,0.10)' }}>
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
                className="line-clamp-2 whitespace-pre-wrap"
                style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--sz-text-deep)' }}
              >
                {summary!.next_prep}
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setOpen(true)}
          >
            전체 내용 보기
          </Button>
        </>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--sz-text-muted)' }}>
          오늘 등록된 수업정리가 아직 없어요.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📝 오늘의 수업정리</DialogTitle>
            <DialogDescription>{todayLabel}</DialogDescription>
          </DialogHeader>

          <div
            className="max-h-[60vh] overflow-y-auto pr-1"
            style={{ color: 'var(--sz-text-deep)' }}
          >
            {hasContent && (
              <p className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: 1.7 }}>
                {summary!.content}
              </p>
            )}

            {hasNextPrep && (
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(100,88,65,0.12)' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  📌 다음 수업 준비 사항
                </p>
                <p className="whitespace-pre-wrap" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  {summary!.next_prep}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? '복사됨 ✓' : '복사'}
            </Button>
            <DialogClose asChild>
              <Button type="button">닫기</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
