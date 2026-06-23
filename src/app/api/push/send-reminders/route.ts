import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// 정적 수집 단계에서 실행되지 않도록 동적 라우트로 지정
export const dynamic = 'force-dynamic'

// VAPID 설정은 빌드 시점이 아니라 요청 처리 시점(런타임)에만 한다.
// 모듈 최상단에서 setVapidDetails 를 호출하면 env 미설정 시 빌드가 실패한다.
function configureWebPush(): boolean {
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!configureWebPush()) {
    return NextResponse.json({ error: 'Push not configured (VAPID env 미설정)' }, { status: 503 })
  }

  const supabase = await createClient()
  const now = new Date()
  const from = new Date(now.getTime() + 3.5 * 60 * 60 * 1000)
  const to = new Date(now.getTime() + 4.5 * 60 * 60 * 1000)
  const fromDate = from.toISOString().slice(0, 10)
  const fromTime = from.toTimeString().slice(0, 5)
  const toDate = to.toISOString().slice(0, 10)
  const toTime = to.toTimeString().slice(0, 5)

  const { data: classes } = await supabase
    .from('classes')
    .select('id, date, start_time, student_id, students(name)')
    .eq('status', 'scheduled')
    .gte('date', fromDate)
    .lte('date', toDate)

  if (!classes?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const cls of classes as any[]) {
    if (cls.date === fromDate && cls.start_time < fromTime) continue
    if (cls.date === toDate && cls.start_time > toTime) continue

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('linked_student_id', cls.student_id)

    for (const profile of profiles ?? []) {
      const { data: sub } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', profile.id)
        .maybeSingle()
      if (!sub) continue
      const subData = sub as { endpoint: string; p256dh: string; auth: string }

      try {
        await webpush.sendNotification(
          { endpoint: subData.endpoint, keys: { p256dh: subData.p256dh, auth: subData.auth } },
          JSON.stringify({
            title: `📚 ${cls.students?.name ?? ''} 수업이 4시간 후예요`,
            body: `오늘 ${cls.start_time.slice(0, 5)} 수업을 준비해주세요!`,
            url: '/portal/home',
          })
        )
        sent++
      } catch {}
    }
  }
  return NextResponse.json({ sent })
}
