import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
