import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

type LessonAnalysis = {
  topic: string
  content: string
  listening_score: number
  speaking_score: number
  reading_score: number
  writing_score: number
}

function normalizeScore(value: unknown) {
  return Math.max(1, Math.min(5, Math.round(Number(value) || 3)))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { transcript, studentName, classDate } = await req.json()
    if (!transcript?.trim()) return NextResponse.json({ error: '수업 전사본을 입력해주세요.' }, { status: 400 })

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: `당신은 영어 수업 분석 전문가입니다. 아래 수업 전사본만 근거로 학부모에게 공유할 수업 기록을 작성하세요.

학생: ${studentName || '학생'}
수업일: ${classDate || ''}
전사본:
${transcript}

반드시 다음 JSON 형식으로만 답하세요.
{
  "topic": "핵심 수업 주제 한 문장",
  "content": "오늘 실제로 학습하고 연습한 내용을 구체적인 한국어 2~4문장으로 요약",
  "listening_score": 1~5 정수,
  "speaking_score": 1~5 정수,
  "reading_score": 1~5 정수,
  "writing_score": 1~5 정수
}

평가 규칙:
- 전사본에서 관찰할 수 없는 영역은 과장하지 말고 3점으로 두세요.
- 점수는 아이의 절대 능력이 아니라 해당 수업에서 관찰된 수행 정도입니다.
- 부정적 낙인이나 단정적 표현은 쓰지 마세요.`
      }],
    })

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as Partial<LessonAnalysis>
    return NextResponse.json({
      topic: String(parsed.topic || '오늘의 영어 수업'),
      content: String(parsed.content || '수업 전사본을 바탕으로 핵심 표현을 연습했습니다.'),
      listening_score: normalizeScore(parsed.listening_score),
      speaking_score: normalizeScore(parsed.speaking_score),
      reading_score: normalizeScore(parsed.reading_score),
      writing_score: normalizeScore(parsed.writing_score),
    } satisfies LessonAnalysis)
  } catch (error) {
    console.error('[lesson-analysis] error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI 분석에 실패했습니다.' }, { status: 500 })
  }
}
