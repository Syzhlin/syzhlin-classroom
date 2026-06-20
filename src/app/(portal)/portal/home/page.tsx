'use client'

import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalHome, useGrowthReport } from '@/lib/queries/useFeedback'
import { getStampedCities, getCurrentCity, classesInCurrentCity } from '@/lib/cities'
import Link from 'next/link'
import { useState } from 'react'

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
  const { selectedStudentId: studentId, linkedStudentName } = usePortalStudent()
  const { data, isLoading } = usePortalHome(studentId)
  const { data: growthData } = useGrowthReport(studentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ border: '3px solid var(--sz-blue-soft)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const nextClass = data?.nextClasses?.[0]
  const latestCompleted = data?.recentClasses?.[0]
  const feedback = (latestCompleted as any)?.class_feedback?.[0] ?? null
  const payment = data?.payment
  const remaining = payment ? payment.total_sessions - payment.completed_sessions : null
  const isStudent = profile?.role === 'student'

  if (isStudent) {
    return <StudentHome
      profile={profile}
      nextClass={nextClass}
      feedback={feedback}
      latestCompleted={latestCompleted}
      growthData={growthData}
      data={data}
    />
  }

  // ── 학부모 / 성인학습자 홈 ──
  const completedCount = growthData?.totalClasses ?? 0
  const stampedCities = getStampedCities(completedCount)
  const currentCity = getCurrentCity(completedCount)
  const progressInCity = classesInCurrentCity(completedCount)
  const isArrived = progressInCity === 1

  const daysUntil = nextClass ? differenceInCalendarDays(parseISO(nextClass.date), new Date()) : null
  const studentDisplayName = linkedStudentName ?? profile?.display_name ?? ''

  return (
    <div className="relative max-w-lg mx-auto px-4" style={{ paddingTop: '20px' }}>

      {/* ── 배경 그라데이션 오버레이 ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background: `
            radial-gradient(circle at 12% 8%, rgba(195,225,215,0.38) 0%, transparent 32%),
            radial-gradient(circle at 88% 12%, rgba(242,232,208,0.32) 0%, transparent 28%),
            radial-gradient(circle at 50% 85%, rgba(205,218,235,0.22) 0%, transparent 38%)
          `,
        }}
      />

      <div className="space-y-3">

        {/* ── 1. 다음 수업 위젯 ── */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: '28px',
            background: 'linear-gradient(145deg, #3D5678 0%, #2B4060 60%, #243660 100%)',
            boxShadow: '10px 10px 28px rgba(36,54,96,0.32), -2px -2px 8px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.14)',
            padding: '20px 20px',
          }}
        >
          {/* 장식 서클 */}
          <div className="absolute pointer-events-none" style={{
            top: '-20%', right: '-8%', width: '140px', height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          }} />
          <div className="absolute pointer-events-none" style={{
            bottom: '-30%', left: '10%', width: '90px', height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,210,130,0.18) 0%, transparent 70%)',
          }} />

          {nextClass ? (
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'rgba(240,230,198,0.62)' }}>
                  다음 수업
                </p>
                <p className="text-xl font-bold leading-snug text-white">
                  {formatDate(nextClass.date)}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--sz-gold)' }}>
                  {formatTime(nextClass.start_time)}
                  {studentDisplayName ? ` · ${studentDisplayName}` : ''}
                </p>
              </div>
              {daysUntil !== null && (
                <div
                  className="flex-shrink-0 flex flex-col items-center justify-center"
                  style={{
                    borderRadius: '18px',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.11)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    minWidth: '64px',
                  }}
                >
                  {daysUntil === 0 ? (
                    <>
                      <p className="text-xl font-bold" style={{ color: 'var(--sz-gold)' }}>오늘</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>수업이에요!</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold" style={{ color: 'var(--sz-gold)' }}>D-{daysUntil}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{daysUntil}일 후</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium relative z-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
              예정된 수업이 없어요
            </p>
          )}
        </div>

        {/* ── 2. 선생님의 편지 ── */}
        {profile?.role === 'parent' && (
          <ParentLetterCard feedback={feedback} latestCompleted={latestCompleted} />
        )}

        {/* ── 3+4. 숙제 제출 & 세계 여권 (2열) ── */}
        {profile?.role === 'parent' && (
          <div className="grid grid-cols-2 gap-3">

            {/* 숙제 제출 */}
            <Link href="/portal/parent" className="active:scale-[0.96] transition-transform block">
              <div
                style={{
                  borderRadius: '24px',
                  backgroundColor: '#FFFDF8',
                  boxShadow: '7px 7px 20px rgba(100,88,65,0.10), -4px -4px 12px rgba(255,255,255,0.88)',
                  border: '1px solid rgba(255,255,255,0.75)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--sz-gold-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 2px 2px 5px rgba(200,175,80,0.18), inset -2px -2px 5px rgba(255,255,255,0.85)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sz-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--sz-text-deep)' }}>숙제 제출</p>
                  <p style={{ fontSize: '10px', marginTop: '2px', color: 'var(--sz-text-muted)' }}>사진으로 바로 보내요</p>
                </div>
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '10px', fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--sz-blue-soft)',
                    color: '#fff',
                  }}
                >
                  제출하기
                </span>
              </div>
            </Link>

            {/* 세계 여권 */}
            <Link href="/portal/passport" className="active:scale-[0.96] transition-transform block">
              <div
                className="relative overflow-hidden"
                style={{
                  borderRadius: '24px',
                  background: 'linear-gradient(145deg, #3D5678 0%, #2A3F5F 100%)',
                  boxShadow: '7px 7px 20px rgba(36,54,96,0.28), -2px -2px 8px rgba(255,255,255,0.06)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div className="absolute pointer-events-none" style={{
                  top: '-20%', right: '-15%', width: '70px', height: '70px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent)',
                }} />
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '20px' }}>🌍</span>
                  <span style={{ fontSize: '10px', color: 'var(--sz-gold)' }}>보기 →</span>
                </div>
                <div>
                  <p style={{ fontSize: '26px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{stampedCities.length}</p>
                  <p style={{ fontSize: '10px', color: 'rgba(240,230,198,0.65)' }}>도시 스탬프</p>
                </div>
                {currentCity && (
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '14px' }}>{currentCity.landmark}</span>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)' }} className="truncate">{currentCity.name}</p>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* ── 5. 이번 달 수업 흐름 ── */}
        {payment && profile?.role === 'parent' && (
          <div
            style={{
              borderRadius: '28px',
              backgroundColor: '#FFFDF8',
              boxShadow: '7px 7px 20px rgba(100,88,65,0.09), -4px -4px 12px rgba(255,255,255,0.88)',
              border: '1px solid rgba(255,255,255,0.75)',
              padding: '20px',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '16px' }}>🎯</span>
                <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--sz-text-deep)' }}>이번 달 수업 흐름</h2>
              </div>
              {payment.bonus_sessions > 0 && (
                <span
                  style={{
                    fontSize: '10px', fontWeight: '700',
                    padding: '3px 8px', borderRadius: '999px',
                    backgroundColor: 'var(--sz-gold-light)', color: 'var(--sz-gold)',
                  }}
                >
                  +{payment.bonus_sessions} 보너스
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--sz-text-deep)', lineHeight: 1 }}>
                {payment.completed_sessions}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--sz-text-muted)' }}>/ {payment.total_sessions}회 완료</p>
            </div>
            {/* Progress bar */}
            <div
              style={{
                width: '100%', height: '10px',
                borderRadius: '999px', overflow: 'hidden',
                background: 'rgba(175,196,216,0.15)',
                boxShadow: 'inset 2px 2px 5px rgba(120,130,150,0.12), inset -2px -2px 5px rgba(255,255,255,0.9)',
              }}
            >
              <div
                style={{
                  height: '100%', borderRadius: '999px',
                  transition: 'width 0.7s ease',
                  width: `${payment.total_sessions > 0 ? Math.min(100, (payment.completed_sessions / payment.total_sessions) * 100) : 0}%`,
                  background: 'linear-gradient(to right, var(--sz-blue-soft), #8BB8D8)',
                  boxShadow: '0 2px 8px rgba(100,140,180,0.35)',
                }}
              />
            </div>
            {remaining !== null && remaining > 0 && (
              <p style={{ fontSize: '12px', marginTop: '10px', color: 'var(--sz-text-muted)' }}>
                앞으로 <span style={{ fontWeight: '700', color: 'var(--sz-gold)' }}>{remaining}번</span> 남았어요
              </p>
            )}
            {remaining === 0 && (
              <p style={{ fontSize: '12px', fontWeight: '600', marginTop: '10px', color: 'var(--sz-sage)' }}>
                이번 달 수업 모두 완료 🎉
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

/* ── 선생님의 편지 카드 ── */
function ParentLetterCard({ feedback, latestCompleted }: { feedback: any; latestCompleted: any }) {
  const [expanded, setExpanded] = useState(false)

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
        <span style={{ fontSize: '16px' }}>💌</span>
        <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--sz-text-deep)' }}>선생님의 편지</h2>
        {latestCompleted && (
          <span className="ml-auto" style={{ fontSize: '11px', color: 'var(--sz-text-muted)' }}>
            {(() => {
              const d = parseISO(latestCompleted.date)
              return `${d.getMonth() + 1}월 ${d.getDate()}일`
            })()}
          </span>
        )}
      </div>

      {feedback ? (
        <div className="space-y-3">
          {feedback.parent_summary && (
            <div>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: 'var(--sz-text-deep)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(175,196,216,0.12)',
                  border: '1px solid rgba(175,196,216,0.2)',
                  ...(expanded ? {} : {
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  } as any),
                }}
              >
                "{feedback.parent_summary}"
              </p>
              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-1.5 text-xs font-semibold"
                style={{ color: 'var(--sz-blue-soft)' }}
              >
                {expanded ? '접기 ↑' : '전체 보기 →'}
              </button>
            </div>
          )}
          {feedback.topic && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--sz-text-muted)' }}>수업 주제</p>
              <p className="text-sm" style={{ color: 'var(--sz-text-deep)' }}>{feedback.topic}</p>
            </div>
          )}
          {feedback.expressions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--sz-text-muted)' }}>오늘 배운 표현</p>
              <div className="flex flex-wrap gap-1.5">
                {feedback.expressions.map((e: string) => (
                  <span key={e} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--sz-blue-pale)', color: 'var(--sz-blue-soft)' }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
          {feedback.good_points && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--sz-text-muted)' }}>잘한 점 ✨</p>
              <p className="text-sm" style={{ color: 'var(--sz-text-deep)' }}>{feedback.good_points}</p>
            </div>
          )}
          {feedback.has_homework && feedback.homework_text && (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--sz-gold-light)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--sz-gold)' }}>📌 숙제</p>
              <p className="text-sm" style={{ color: 'var(--sz-text-deep)' }}>{feedback.homework_text}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex items-center gap-3"
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            background: 'rgba(175,196,216,0.07)',
            border: '1.5px dashed rgba(175,196,216,0.35)',
          }}
        >
          <span style={{ fontSize: '20px' }}>✏️</span>
          <p style={{ fontSize: '13px', color: 'var(--sz-text-muted)' }}>선생님이 곧 편지를 보낼 예정입니다</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   학생 전용 위젯 홈
═══════════════════════════════════════════ */
function StudentHome({ profile, nextClass, feedback, latestCompleted, growthData, data }: {
  profile: any
  nextClass: any
  feedback: any
  latestCompleted: any
  growthData: any
  data: any
}) {
  const completedCount = growthData?.totalClasses ?? 0
  const stampedCities = getStampedCities(completedCount)
  const currentCity = getCurrentCity(completedCount)
  const progress = classesInCurrentCity(completedCount)
  const isArrived = progress === 1

  const hasHomework = feedback?.has_homework && feedback?.homework_text
  const homeworkSubmitted = false

  return (
    <div className="p-4 max-w-lg mx-auto" style={{ paddingTop: '16px' }}>
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-widest uppercase mb-1"
          style={{ color: 'var(--sz-blue-soft)' }}>
          Syzhlin Class
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--sz-text-deep)' }}>
          안녕하세요, {profile?.display_name ?? ''}님 👋
        </h1>
        {nextClass && (
          <p className="text-sm mt-1" style={{ color: 'var(--sz-text-muted)' }}>
            다음 수업 · {formatDate(nextClass.date)} {formatTime(nextClass.start_time)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">

        <Link href="/portal/passport" className="col-span-2 widget-pop widget-pop-1">
          <div
            className="sz-widget rounded-3xl p-5 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #3A5272 0%, #2A3F5F 100%)' }}
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] opacity-10 select-none pointer-events-none">
              🌍
            </div>
            <div className="absolute top-0 left-0 right-0 h-px bg-white/20 rounded-t-3xl" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                  style={{ color: 'rgba(240,230,198,0.7)' }}>
                  English World Passport
                </p>
                {currentCity ? (
                  <>
                    <p className="text-2xl font-bold">{currentCity.landmark} {currentCity.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      현재 머무는 도시
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">✈️ 출발 준비!</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      첫 수업 후 여권이 시작돼요
                    </p>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold" style={{ color: 'var(--sz-gold)' }}>
                  {stampedCities.length}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(240,230,198,0.7)' }}>
                  스탬프
                </p>
              </div>
            </div>

            {currentCity && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    도시 수업
                  </p>
                  <p className="text-xs font-bold" style={{ color: isArrived ? 'var(--sz-gold)' : 'rgba(255,255,255,0.5)' }}>
                    {isArrived ? '1' : '0'} / 2
                  </p>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: isArrived ? '50%' : '0%',
                      background: 'linear-gradient(to right, var(--sz-gold), #E8C56A)',
                    }}
                  />
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: isArrived ? 'var(--sz-gold)' : 'rgba(255,255,255,0.4)' }}>
                  {isArrived
                    ? '다음 수업을 마치면 스탬프가 완성돼요! ✨'
                    : '첫 번째 수업을 완료했어요 — 한 번 더!'}
                </p>
              </div>
            )}
          </div>
        </Link>

        <Link href="/portal/homework" className="widget-pop widget-pop-2">
          <div className="sz-widget sz-widget-pink rounded-3xl p-4 h-full">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(217,154,164,0.3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sz-pink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--sz-text-deep)' }}>숙제 사진</p>
            <p className="text-[10px]" style={{ color: 'var(--sz-text-muted)' }}>
              {hasHomework ? '숙제가 있어요!' : '사진을 올려주세요'}
            </p>
            <div className="mt-3">
              <span
                className="inline-block text-[9px] font-bold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: hasHomework ? 'rgba(217,154,164,0.3)' : 'rgba(0,0,0,0.06)',
                  color: hasHomework ? '#B57B87' : 'var(--sz-text-muted)',
                }}
              >
                {hasHomework ? '📌 숙제 있음' : '제출 전'}
              </span>
            </div>
          </div>
        </Link>

        <Link href="/portal/passport" className="widget-pop widget-pop-3">
          <div className="sz-widget sz-widget-sage rounded-3xl p-4 h-full">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(156,187,175,0.3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sz-sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--sz-text-deep)' }}>스탬프</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold" style={{ color: 'var(--sz-text-deep)' }}>
                {stampedCities.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--sz-text-muted)' }}>개</p>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--sz-text-muted)' }}>
              도시 완성
            </p>
          </div>
        </Link>

        {currentCity && (
          <Link href="/portal/passport" className="col-span-2 widget-pop widget-pop-4">
            <div className="sz-widget sz-widget-blue rounded-3xl px-5 py-4 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ backgroundColor: 'rgba(175,196,216,0.3)' }}
              >
                {isArrived ? '✨' : '🗺️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--sz-blue-soft)' }}>
                  {isArrived ? '거의 다 왔어요!' : '다음 목적지'}
                </p>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--sz-text-deep)' }}>
                  {isArrived
                    ? `다음 수업을 마치면 ${currentCity.name} 스탬프가 완성돼요.`
                    : `${currentCity.name} ${currentCity.landmark}으로 향하는 중이에요.`}
                </p>
              </div>
            </div>
          </Link>
        )}

        <Link href="/portal/schedule" className="widget-pop widget-pop-5">
          <div className="sz-widget sz-widget-peach rounded-3xl p-4 h-full">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(242,199,166,0.4)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sz-peach)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--sz-text-deep)' }}>지난 수업</p>
            {latestCompleted ? (
              <>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--sz-text-deep)' }}>
                  {formatDate(latestCompleted.date)}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>
                  기록 보기 →
                </p>
              </>
            ) : (
              <p className="text-[10px]" style={{ color: 'var(--sz-text-muted)' }}>수업 기록 없음</p>
            )}
          </div>
        </Link>

        <Link href="/portal/inquiry" className="widget-pop widget-pop-6">
          <div className="sz-widget rounded-3xl p-4 h-full">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(175,196,216,0.15)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sz-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--sz-text-deep)' }}>문의하기</p>
            <p className="text-[10px]" style={{ color: 'var(--sz-text-muted)' }}>
              선생님께 메시지
            </p>
          </div>
        </Link>

        {nextClass && (
          <Link href="/portal/schedule" className="col-span-2 widget-pop" style={{ animationDelay: '0.35s' }}>
            <div className="sz-widget sz-widget-navy rounded-3xl px-5 py-4 flex items-center gap-4 text-white">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sz-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold tracking-wider uppercase mb-0.5"
                  style={{ color: 'rgba(240,230,198,0.7)' }}>
                  Next Class
                </p>
                <p className="text-base font-bold">{formatDate(nextClass.date)}</p>
                <p className="text-sm" style={{ color: 'var(--sz-gold)' }}>{formatTime(nextClass.start_time)}</p>
              </div>
            </div>
          </Link>
        )}

        {completedCount > 0 && (
          <div className="col-span-2 widget-pop" style={{ animationDelay: '0.4s' }}>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(175,196,216,0.12)' }}>
              <span className="text-lg">📖</span>
              <p className="text-xs" style={{ color: 'var(--sz-text-muted)' }}>
                영어 기록이 차곡차곡 쌓이고 있어요. 지금까지 <span className="font-semibold" style={{ color: 'var(--sz-text-deep)' }}>{completedCount}번</span> 수업했어요!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
