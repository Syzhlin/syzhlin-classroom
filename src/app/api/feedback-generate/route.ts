import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_key_here') {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const { studentName, classDate, draft } = await req.json()

    const hasDraft = draft && draft.trim().length > 0

    const prompt = hasDraft
      ? `당신은 친절하고 전문적인 영어 튜터입니다.
아래 선생님의 메모를 학부모에게 보내는 따뜻한 피드백으로 자연스럽게 다듬어주세요.

학생: ${studentName}
수업 날짜: ${classDate}
선생님 메모: ${draft}

작성 규칙:
- 원래 내용의 핵심은 유지하면서 자연스럽고 따뜻하게 다듬어주세요
- 150~250자 사이로 간결하게
- 부정적 표현, '부족합니다', '못합니다' 절대 금지
- 서명(드림, 올림 등) 절대 쓰지 마세요`
      : `당신은 친절하고 전문적인 영어 튜터입니다.
${studentName} 학생의 ${classDate} 수업 후 학부모에게 보낼 따뜻한 피드백을 150~250자로 작성해주세요.
부정적 표현 금지, 서명 금지.`

    const client = new OpenAI({ apiKey })
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ summary: text })
  } catch (err: unknown) {
    console.error('[feedback-generate] error:', err)
    const message = err instanceof Error ? err.message : '오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
