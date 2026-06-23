import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// 정적 수집 단계에서 실행되지 않도록 동적 라우트로 지정
export const dynamic = 'force-dynamic'

type Channel = 'parent' | 'student'

// VAPID 설정은 빌드 시점이 아니라 요청 처리 시점(런타임)에만 한다.
function configureWebPush(): boolean {
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

/**
 * 선생님이 직접 '알림 보내기' 버튼으로 학부모/학생에게 알림을 발송한다.
 *
 * 안정성 전략:
 *  - 알림 본문을 기존 messages 테이블에 insert → 포털 알림 벨이 이미 'teacher' 메시지를
 *    감지하도록 되어 있어 앱 내 벨은 자동으로 동작한다. (날짜/새로고침 타이밍에 의존하지 않음)
 *  - 동시에 web-push 로 휴대폰 푸시까지 발송한다. (VAPID 미설정/구독 없음이면 푸시만 건너뜀)
 *
 * 푸시가 다른 사용자(학부모/학생)의 구독을 읽으려면 RLS 정책이 필요하다.
 *  → supabase-notification-rls-migration.sql 참고. 정책이 아직 없으면 push 는 0건이 되지만
 *    messages insert(앱 벨)는 정상 동작하므로 알림 자체는 전달된다.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 선생님만 발송 가능
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!me || me.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: {
    studentIds?: string[]
    channels?: Channel[]
    title?: string
    body?: string
  }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const studentIds = Array.from(new Set(payload.studentIds ?? [])).filter(Boolean)
  const channels = Array.from(new Set(payload.channels ?? [])).filter(
    (c): c is Channel => c === 'parent' || c === 'student'
  )
  const title = (payload.title ?? '').trim()
  const body = (payload.body ?? '').trim()

  if (studentIds.length === 0) {
    return NextResponse.json({ error: '받는 학생을 선택해주세요.' }, { status: 400 })
  }
  if (channels.length === 0) {
    return NextResponse.json({ error: '받는 대상(학부모/아이)을 선택해주세요.' }, { status: 400 })
  }
  if (!body) {
    return NextResponse.json({ error: '알림 내용을 입력해주세요.' }, { status: 400 })
  }

  // 선생님 본인 학생만 대상으로 제한 (RLS 도 막지만 명시적으로 한 번 더 검증)
  const { data: ownStudents } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', user.id)
    .in('id', studentIds)
  const allowedIds = new Set((ownStudents ?? []).map((s) => s.id))
  const targets = studentIds.filter((id) => allowedIds.has(id))
  if (targets.length === 0) {
    return NextResponse.json({ error: '발송 권한이 있는 학생이 없습니다.' }, { status: 403 })
  }

  // 1) messages insert (앱 벨 + 문의함 기록) — 채널별로 한 건씩
  const rows: Array<Record<string, unknown>> = []
  for (const sid of targets) {
    for (const ch of channels) {
      rows.push({
        student_id: sid,
        sender_id: user.id,
        sender_role: 'teacher',
        channel_type: ch,
        body,
      })
    }
  }
  // channel_type 은 수동 타입(database.ts)에 없지만 실제 DB 컬럼이라 캐스팅해서 insert
  const { error: insertErr } = await (supabase.from('messages') as any).insert(rows)
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }
  const messagesSent = rows.length

  // 2) web-push 발송
  let pushSent = 0
  let pushFailed = 0
  let pushConfigured = false

  if (configureWebPush()) {
    pushConfigured = true

    // 대상 학생에 연결된 포털 사용자(학부모/학생) 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role, linked_student_id')
      .in('linked_student_id', targets)

    // 채널 → 허용 role 매핑
    const roleAllowed = (role: string): boolean => {
      if (channels.includes('parent') && (role === 'parent' || role === 'adult_learner')) return true
      if (channels.includes('student') && role === 'student') return true
      return false
    }

    const targetUserIds = (profiles ?? [])
      .filter((p) => p.linked_student_id && targets.includes(p.linked_student_id) && roleAllowed(p.role))
      .map((p) => p.id)

    if (targetUserIds.length > 0) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .in('user_id', targetUserIds)

      const pushPayload = JSON.stringify({
        title: title || '선생님 알림',
        body,
        url: '/portal/inquiry',
      })

      await Promise.all(
        (subs ?? []).map(async (sub) => {
          const s = sub as { endpoint: string; p256dh: string; auth: string }
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              pushPayload
            )
            pushSent++
          } catch {
            pushFailed++
          }
        })
      )
    }
  }

  return NextResponse.json({
    ok: true,
    studentCount: targets.length,
    channels,
    messagesSent,
    pushConfigured,
    pushSent,
    pushFailed,
  })
}
