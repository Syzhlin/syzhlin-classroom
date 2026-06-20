'use client'

import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePushNotification } from '@/hooks/usePushNotification'
import { usePortalHome } from '@/lib/queries/useFeedback'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  const d = parseISO(dateStr)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_KO[d.getDay()]})`
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour >= 12 ? '오후' : '오전'} ${hour > 12 ? hour - 12 : hour}:${m}`
}

export default function PortalHomePage() {
  const { data: profile } = useProfile()
  const { selectedStudentId: studentId } = usePortalStudent()
  const { data, isLoading } = usePortalHome(studentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const nextClass = data?.nextClasses?.[0]
  const latestCompleted = data?.recentClasses?.[0]
  const feedback = (latestCompleted as any)?.class_feedback?.[0] ?? null
  const payment = data?.payment

  const remaining = payment ? payment.total_sessions - payment.completed_sessions : null

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      {/* 인사말 + 다음 수업 */}
      <div className="bg-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-sm text-indigo-200">안녕하세요 👋</p>
        {nextClass ? (
          <>
            <p className="mt-2 text-lg font-bold leading-snug">
              다음 수업은<br />
              <span className="text-indigo-100">{formatDate(nextClass.date)}</span>
            </p>
            <p className="mt-1 text-2xl font-bold">{formatTime(nextClass.start_time)}</p>
          </>
        ) : (
          <p className="mt-2 text-base font-semibold text-indigo-100">예정된 수업이 없어요</p>
        )}
      </div>

      {/* 오늘의 수업 피드백 */}
      {/* 선생님의 편지 - 항상 표시 */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💌</span>
          <h2 className="font-semibold text-gray-900 text-sm">선생님의 편지</h2>
          {latestCompleted && (
            <span className="ml-auto text-xs text-gray-400">{formatDate(latestCompleted.date)}</span>
          )}
        </div>

        {feedback ? (
          <div className="space-y-3">
            {feedback.parent_summary && (
              <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50 rounded-xl px-4 py-3">
                "{feedback.parent_summary}"
              </p>
            )}
            {feedback.topic && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">수업 주제</p>
                <p className="text-sm text-gray-700">{feedback.topic}</p>
              </div>
            )}
            {feedback.expressions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5">오늘 배운 표현</p>
                <div className="flex flex-wrap gap-1.5">
                  {feedback.expressions.map((e: string) => (
                    <span key={e} className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {feedback.good_points && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">잘한 점 ✨</p>
                <p className="text-sm text-gray-700">{feedback.good_points}</p>
              </div>
            )}
            {feedback.has_homework && feedback.homework_text && (
              <div className="bg-amber-50 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-600 mb-1">📌 숙제</p>
                <p className="text-sm text-gray-700">{feedback.homework_text}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-2xl mb-2">✏️</p>
            <p className="text-sm text-gray-400">선생님이 곧 편지를 보낼 예정입니다</p>
          </div>
        )}
      </div>

      {/* 다음 일정 카드 */}
      {data?.nextClasses && data.nextClasses.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📅</span>
            <h2 className="font-semibold text-gray-900 text-sm">앞으로의 수업</h2>
          </div>
          <div className="space-y-2">
            {data.nextClasses.map((cls, i) => (
              <div key={cls.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(cls.date)}</p>
                  <p className="text-xs text-gray-400">{formatTime(cls.start_time)}</p>
                </div>
                {i === 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">다음 수업</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 잔여 회차 */}
      {payment && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎯</span>
            <h2 className="font-semibold text-gray-900 text-sm">이번 달 수업권</h2>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold text-gray-900">{payment.completed_sessions}
                <span className="text-base font-normal text-gray-400"> / {payment.total_sessions}회</span>
              </p>
              {remaining !== null && remaining > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">남은 수업 <span className="font-semibold text-indigo-600">{remaining}회</span></p>
              )}
              {remaining === 0 && (
                <p className="text-sm text-green-600 font-medium mt-0.5">이번 달 수업 완료 🎉</p>
              )}
            </div>
            {payment.bonus_sessions > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                +{payment.bonus_sessions} 보너스
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${payment.total_sessions > 0 ? Math.min(100, (payment.completed_sessions / payment.total_sessions) * 100) : 0}%`,
                backgroundColor: '#6366f1',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">예정 {payment.planned_sessions}회 · 총 {payment.total_sessions}회</p>
        </div>
      )}
    </div>
  )
}

function NotificationToggle() {
  const { status, loading, subscribe, unsubscribe } = usePushNotification()

  if (status === 'unsupported') return null

  return (
    <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div>
          <p className="text-sm font-medium text-gray-800">수업 알림</p>
          <p className="text-xs text-gray-400">수업 4시간 전 푸시 알림</p>
        </div>
      </div>
      {status === 'denied' ? (
        <span className="text-xs text-red-400">브라우저에서 차단됨</span>
      ) : (
        <button
          onClick={status === 'subscribed' ? unsubscribe : subscribe}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            status === 'subscribed' ? 'bg-indigo-600' : 'bg-gray-200'
          } disabled:opacity-60`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            status === 'subscribed' ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      )}
    </div>
  )
}
