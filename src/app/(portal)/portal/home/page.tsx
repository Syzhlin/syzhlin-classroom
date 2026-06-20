'use client'

import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { usePortalHome, useGrowthReport } from '@/lib/queries/useFeedback'
import { getStampedCities, getCurrentCity, classesInCurrentCity, getNextCity } from '@/lib/cities'
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
   학생 전용 위젯 홈 (Pastel Soft Neumorphism)
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
  const nextCityObj = getNextCity(completedCount)
  const progress = classesInCurrentCity(completedCount)
  const isArrived = progress === 1

  const hasHomework = feedback?.has_homework && feedback?.homework_text
  const studentName = profile?.display_name ?? ''

  // D-day
  const daysUntil = nextClass
    ? differenceInCalendarDays(parseISO(nextClass.date), new Date())
    : null

  // 이번 달 수업 수
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const monthlyClasses = (data?.recentClasses ?? []).filter((c: any) => {
    const d = parseISO(c.date)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && c.status === 'completed'
  }).length

  // 공통 카드 스타일
  const lightCard = {
    borderRadius: '24px',
    backgroundColor: '#FFFDF8',
    boxShadow: '7px 7px 20px rgba(100,88,65,0.10), -4px -4px 12px rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,255,255,0.75)',
  } as React.CSSProperties

  const mintCard = {
    borderRadius: '24px',
    backgroundColor: '#FFFDF8',
    boxShadow: '7px 7px 20px rgba(100,170,150,0.12), -4px -4px 12px rgba(255,255,255,0.92)',
    border: '1px solid rgba(190,230,215,0.4)',
  } as React.CSSProperties

  const pinkCard = {
    borderRadius: '24px',
    backgroundColor: '#FFFDF8',
    boxShadow: '7px 7px 20px rgba(200,150,160,0.12), -4px -4px 12px rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,215,220,0.4)',
  } as React.CSSProperties

  const blueCard = {
    borderRadius: '24px',
    backgroundColor: '#FFFDF8',
    boxShadow: '7px 7px 20px rgba(140,170,210,0.12), -4px -4px 12px rgba(255,255,255,0.92)',
    border: '1px solid rgba(195,215,240,0.4)',
  } as React.CSSProperties

  return (
    <div style={{ paddingTop: '20px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px', maxWidth: '480px', margin: '0 auto' }}>

      {/* ── 상단 인사 ── */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{ fontSize: '23px', fontWeight: '800', color: '#27324A', lineHeight: 1.2 }}>
          안녕, {studentName} 👋
        </p>
        <p style={{ fontSize: '13px', color: '#7E8797', marginTop: '5px' }}>
          오늘도 영어 여행을 시작해볼까?
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* ── 1. Hero 위젯: 다음 영어 여행 ── */}
        <Link href="/portal/schedule">
          <div style={{
            borderRadius: '28px',
            background: 'linear-gradient(145deg, #3D5678 0%, #2B4060 60%, #243660 100%)',
            boxShadow: '10px 10px 28px rgba(36,54,96,0.30), -2px -2px 8px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.14)',
            padding: '22px',
            position: 'relative',
            overflow: 'hidden',
          }} className="active:scale-[0.98] transition-transform">
            {/* 배경 장식 */}
            <div style={{
              position: 'absolute', right: '-5%', top: '-20%',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-20%', left: '-5%',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(240,210,130,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.18)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(240,230,198,0.65)', marginBottom: '10px' }}>
                다음 영어 여행
              </p>
              {nextClass ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: 1.15 }}>
                      {formatDate(nextClass.date)}
                    </p>
                    <p style={{ fontSize: '14px', color: 'rgba(240,210,130,0.9)', marginTop: '5px', fontWeight: '600' }}>
                      {formatTime(nextClass.start_time)} · {studentName}
                    </p>
                  </div>
                  {daysUntil !== null && (
                    <div style={{
                      flexShrink: 0,
                      borderRadius: '18px',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.11)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      textAlign: 'center',
                    }}>
                      {daysUntil <= 0 ? (
                        <>
                          <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--sz-gold)', lineHeight: 1 }}>오늘</p>
                          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>수업이에요!</p>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--sz-gold)', lineHeight: 1 }}>D-{daysUntil}</p>
                          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.50)', marginTop: '2px' }}>곧 만나요!</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)' }}>예정된 수업이 없어요</p>
              )}
            </div>
          </div>
        </Link>

        {/* ── 2. 2열 소형 위젯: 오늘의 미션 + 숙제 제출 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

          {/* 오늘의 미션 */}
          <Link href="/portal/homework">
            <div style={{ ...mintCard, padding: '16px', minHeight: '148px', display: 'flex', flexDirection: 'column' }}
              className="active:scale-[0.97] transition-transform">
              <div style={{
                width: '38px', height: '38px', borderRadius: '13px', marginBottom: '10px',
                background: 'rgba(190,230,215,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>⭐</div>
              <p style={{ fontSize: '12px', fontWeight: '800', color: '#27324A', marginBottom: '4px' }}>오늘의 미션</p>
              {feedback ? (
                <>
                  <p style={{ fontSize: '10px', color: '#7E8797', lineHeight: 1.55, flex: 1 }}>
                    {hasHomework ? '숙제를 사진으로 올려요' : '배운 표현을 복습해요'}
                  </p>
                  <span style={{
                    alignSelf: 'flex-start', marginTop: '8px',
                    fontSize: '9px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px',
                    background: 'rgba(190,230,215,0.5)', color: '#4A9B7F',
                  }}>계속하기 →</span>
                </>
              ) : (
                <p style={{ fontSize: '10px', color: '#A8AFBA', lineHeight: 1.55, flex: 1 }}>
                  선생님이 곧 준비해줄 거예요
                </p>
              )}
            </div>
          </Link>

          {/* 숙제 제출 */}
          <Link href="/portal/homework">
            <div style={{ ...pinkCard, padding: '16px', minHeight: '148px', display: 'flex', flexDirection: 'column' }}
              className="active:scale-[0.97] transition-transform">
              <div style={{
                width: '38px', height: '38px', borderRadius: '13px', marginBottom: '10px',
                background: 'rgba(255,215,220,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>📸</div>
              <p style={{ fontSize: '12px', fontWeight: '800', color: '#27324A', marginBottom: '4px' }}>숙제 제출</p>
              {hasHomework ? (
                <>
                  <p style={{ fontSize: '10px', color: '#7E8797', lineHeight: 1.55, flex: 1 }}>
                    사진으로 바로 보내요
                  </p>
                  <span style={{
                    alignSelf: 'flex-start', marginTop: '8px',
                    fontSize: '9px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px',
                    background: 'rgba(255,180,195,0.4)', color: '#B57B87',
                  }}>📌 숙제 있음</span>
                </>
              ) : (
                <p style={{ fontSize: '10px', color: '#A8AFBA', lineHeight: 1.55, flex: 1 }}>
                  오늘은 복습만 해도 좋아요
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* ── 3. 영어 여권 시그니처 위젯 ── */}
        <Link href="/portal/passport">
          <div style={{
            borderRadius: '28px',
            background: 'linear-gradient(145deg, #3A5272 0%, #2A3F5F 100%)',
            boxShadow: '10px 10px 28px rgba(36,54,96,0.28), -2px -2px 8px rgba(255,255,255,0.06)',
            padding: '22px',
            position: 'relative',
            overflow: 'hidden',
          }} className="active:scale-[0.98] transition-transform">
            <div style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '90px', opacity: 0.06, userSelect: 'none', lineHeight: 1, pointerEvents: 'none',
            }}>🌍</div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.18)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(240,230,198,0.65)', marginBottom: '14px' }}>
                나의 영어 여권
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {currentCity ? (
                    <>
                      <p style={{ fontSize: '24px', fontWeight: '800', color: '#fff', lineHeight: 1.15 }}>
                        {currentCity.landmark} {currentCity.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>현재 여행 중</p>
                      {nextCityObj && (
                        <p style={{ fontSize: '11px', color: 'rgba(240,210,130,0.75)', marginTop: '6px' }}>
                          {nextCityObj.name}까지 {isArrived ? 1 : 2}번 남았어요
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>✈️ 출발 준비!</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.50)', marginTop: '3px' }}>첫 수업 후 여권이 시작돼요</p>
                    </>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '38px', fontWeight: '800', color: 'var(--sz-gold)', lineHeight: 1 }}>
                    {stampedCities.length}
                  </p>
                  <p style={{ fontSize: '10px', color: 'rgba(240,230,198,0.65)' }}>도시 스탬프</p>
                </div>
              </div>

              {currentCity && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                      {isArrived ? '다음 수업 후 스탬프 완성! ✨' : '첫 번째 수업 완료'}
                    </p>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: isArrived ? 'var(--sz-gold)' : 'rgba(255,255,255,0.4)' }}>
                      {isArrived ? '1' : '0'} / 2
                    </p>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)' }}>
                    <div style={{
                      height: '8px', borderRadius: '999px',
                      width: isArrived ? '50%' : '0%',
                      background: 'linear-gradient(to right, var(--sz-gold), #E8C56A)',
                      transition: 'width 0.7s ease',
                      boxShadow: '0 2px 8px rgba(240,210,130,0.4)',
                    }} />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'rgba(255,255,255,0.75)',
                }}>여권 보기 →</span>
              </div>
            </div>
          </div>
        </Link>

        {/* ── 4. 이번 달 진행률 ── */}
        {completedCount > 0 && (
          <div style={{ ...blueCard, padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>📖</span>
              <p style={{ fontSize: '12px', fontWeight: '800', color: '#27324A' }}>이번 달 수업 흐름</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#27324A', lineHeight: 1 }}>{monthlyClasses}</p>
              <p style={{ fontSize: '14px', color: '#7E8797' }}>번 완료</p>
            </div>
            <div style={{
              width: '100%', height: '10px', borderRadius: '999px',
              background: 'rgba(175,196,216,0.15)',
              boxShadow: 'inset 2px 2px 5px rgba(120,130,150,0.1), inset -2px -2px 5px rgba(255,255,255,0.9)',
              marginBottom: '8px',
            }}>
              <div style={{
                height: '10px', borderRadius: '999px',
                width: `${Math.min(100, (monthlyClasses / 8) * 100)}%`,
                background: 'linear-gradient(to right, rgba(175,200,240,0.85), rgba(120,170,220,0.9))',
                boxShadow: '0 2px 6px rgba(140,180,220,0.4)',
                transition: 'width 0.7s ease',
              }} />
            </div>
            <p style={{ fontSize: '11px', color: '#A8AFBA' }}>
              이번 달 영어 여행이 차곡차곡 쌓이고 있어요 🌟
            </p>
          </div>
        )}

        {/* ── 5. 선생님 응원 카드 ── */}
        <div style={{ ...pinkCard, padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>💌</span>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#27324A' }}>오늘의 응원</p>
          </div>
          {feedback?.good_points ? (
            <div style={{
              padding: '12px 14px', borderRadius: '16px',
              background: 'rgba(255,215,220,0.18)',
              border: '1px solid rgba(255,195,205,0.3)',
            }}>
              <p style={{ fontSize: '13px', color: '#27324A', lineHeight: 1.65 }}>
                ✨ {feedback.good_points}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#7E8797', lineHeight: 1.7 }}>
              틀려도 괜찮아.<br />다시 말해보는 힘이 진짜 실력이야.
            </p>
          )}
        </div>

        {/* ── 6. 오늘의 문장 ── */}
        <div style={{ ...lightCard, padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>💬</span>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#27324A' }}>오늘의 문장</p>
          </div>
          {feedback?.expressions && feedback.expressions.length > 0 ? (
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#27324A', lineHeight: 1.35 }}>
                {feedback.expressions[0]}
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#27324A', lineHeight: 1.35 }}>
                I can try again.
              </p>
              <p style={{ fontSize: '12px', color: '#7E8797', marginTop: '4px' }}>
                나는 다시 해볼 수 있어요.
              </p>
            </>
          )}
        </div>

        {/* ── 7. 최근 수업자료 ── */}
        {latestCompleted && (
          <Link href="/portal/homework">
            <div style={{ ...lightCard, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}
              className="active:scale-[0.98] transition-transform">
              <span style={{ fontSize: '20px' }}>📂</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#27324A' }}>최근 수업자료</p>
                <p style={{ fontSize: '11px', color: '#7E8797', marginTop: '2px' }}>
                  {formatDate(latestCompleted.date)} 수업자료
                </p>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '5px 12px', borderRadius: '999px',
                background: 'rgba(175,196,216,0.18)', color: '#5B7A9E', flexShrink: 0,
              }}>바로 보기</span>
            </div>
          </Link>
        )}

      </div>
    </div>
  )
}
