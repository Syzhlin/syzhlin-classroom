'use client'
import { cn } from '@/lib/utils'
import type { ClassWithStudent } from '@/lib/queries/useClasses'

interface ClassBlockProps {
  cls: ClassWithStudent
  topPx: number
  heightPx: number
  sessionNumber?: number
  onClick: () => void
  onNameClick: () => void
}

const STATUS_STYLES = {
  scheduled: '',
  completed: 'ring-2 ring-green-400 ring-inset',
  cancelled: 'opacity-50 line-through',
  makeup: 'ring-2 ring-orange-400 ring-inset',
  postponed: 'opacity-40 ring-2 ring-dashed ring-gray-400 ring-inset',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  completed: '완료',
  cancelled: '취소',
  makeup: '보강',
  postponed: '미룸',
}

export function ClassBlock({ cls, topPx, heightPx, sessionNumber, onClick, onNameClick }: ClassBlockProps) {
  const color = cls.students?.color ?? '#6366f1'
  const subject = cls.students?.subjects?.[0] ?? ''
  const isCompleted = cls.status === 'completed'
  const isPostponed = cls.status === 'postponed'
  const blockColor = isCompleted ? '#16a34a' : isPostponed ? '#9ca3af' : color
  const blockBg = isCompleted ? '#dcfce7' : isPostponed ? '#f3f4f6' : color + '22'
  const nameColor = isCompleted ? '#166534' : isPostponed ? '#6b7280' : color

  return (
    <div
      style={{
        position: 'absolute',
        top: topPx,
        height: Math.max(heightPx, 28),
        left: 4,
        right: 4,
      }}
      className="z-10"
    >
      <button
        onClick={onClick}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: blockBg,
          borderLeft: `3px solid ${blockColor}`,
          borderColor: blockColor,
        }}
        className={cn(
          'rounded-md px-2 py-1 text-left overflow-hidden hover:brightness-95 transition-all w-full h-full',
          STATUS_STYLES[cls.status as keyof typeof STATUS_STYLES]
        )}
      >
        {/* 이름 — 클릭 시 상태 변경 시트 */}
        <p className="text-xs font-semibold truncate" style={{ color: nameColor }}>
          <span
            role="button"
            className="hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onNameClick()
            }}
          >
            {cls.students?.name}
          </span>
          {sessionNumber != null && (
            <span className="font-normal ml-1 opacity-70">{sessionNumber}회</span>
          )}
        </p>

        {heightPx >= 40 && (
          <p className="text-[10px] truncate text-gray-500">
            {subject && `${subject} · `}{cls.start_time.slice(0, 5)}~{cls.end_time.slice(0, 5)}
          </p>
        )}
        {cls.status !== 'scheduled' && heightPx >= 40 && (
          <span className={cn('text-[10px]', isCompleted ? 'font-semibold text-green-700' : 'text-gray-400')}>
            {STATUS_LABELS[cls.status]}
          </span>
        )}
      </button>
    </div>
  )
}
