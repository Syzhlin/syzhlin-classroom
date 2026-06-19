'use client'

import { useTodayBriefing } from '@/lib/queries/useTodayBriefing'
import { useUpdateClass } from '@/lib/queries/useClasses'

function formatTime(t: string) {
  return t.slice(0, 5)
}

export function TodayBriefing() {
  const { data: classes, isLoading } = useTodayBriefing()
  const updateClass = useUpdateClass()

  if (isLoading) {
    return <div className="h-14 border-b border-gray-100 bg-gray-50 animate-pulse" />
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">오늘 예정된 수업이 없어요</span>
      </div>
    )
  }

  async function handleComplete(id: string) {
    await updateClass.mutateAsync({ id, status: 'completed' })
  }

  return (
    <div className="border-b border-gray-100 bg-indigo-50/40 px-6 py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* 제목 */}
        <span className="text-xs font-semibold text-indigo-700 whitespace-nowrap mr-1">
          오늘 {classes.length}명
        </span>

        <div className="w-px h-4 bg-indigo-200 flex-shrink-0" />

        {/* 수업 카드들 — 가로 일렬 */}
        {classes.map((cls, i) => (
          <div key={cls.id} className="flex items-center gap-2 flex-shrink-0">
            {i > 0 && <div className="w-px h-4 bg-gray-200" />}
            <div className="flex items-center gap-2">
              {/* 학생 색상 도트 */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cls.studentColor }}
              />
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                {formatTime(cls.start_time)}
              </span>
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                {cls.studentName}
              </span>
              {cls.totalSessions > 0 && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {cls.completedSessions}/{cls.totalSessions}회
                </span>
              )}
              {/* 완료 버튼 */}
              {cls.status !== 'completed' && cls.status !== 'cancelled' && cls.status !== 'postponed' ? (
                <button
                  onClick={() => handleComplete(cls.id)}
                  disabled={updateClass.isPending}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  완료
                </button>
              ) : cls.status === 'postponed' ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 whitespace-nowrap">
                  미룸
                </span>
              ) : cls.status === 'completed' ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-green-100 text-green-700 whitespace-nowrap">
                  완료 ✓
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-500 whitespace-nowrap">
                  결석
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
