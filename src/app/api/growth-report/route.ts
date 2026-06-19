import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const SCORE_DESC = ['', '아직 선생님 도움이 많이 필요해요', '도움을 받으면 조금씩 따라올 수 있어요', '기본 흐름을 안정적으로 따라오고 있어요', '스스로 시도하는 모습과 성장이 잘 보여요', '배운 내용을 자신 있게 활용할 수 있어요']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_key_here') {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.' }, { status: 500 })
    }

    const body = await req.json()
    const {
      studentName, period, lessonCount,
      scores: { expression, comprehension, readingFluency, sentenceBuilding, willingness },
      notes: { expression: ne, comprehension: nc, readingFluency: nr, sentenceBuilding: ns, willingness: nw },
      keywords,
    } = body

    const [year, month] = period.split('-')

    const prompt = `당신은 Syzhlin Class의 영어 튜터입니다. 아래 정보를 바탕으로 학부모용 성장리포트를 한국어로 작성해주세요.

학생 이름: ${studentName}
리포트 기간: ${year}년 ${month}월
수업 횟수: ${lessonCount}회

평가 점수 및 관찰 메모:
1. 표현력: ${expression}점 (${SCORE_DESC[expression]})
   관찰: ${ne || '없음'}
2. 이해력: ${comprehension}점 (${SCORE_DESC[comprehension]})
   관찰: ${nc || '없음'}
3. 읽기 유창성: ${readingFluency}점 (${SCORE_DESC[readingFluency]})
   관찰: ${nr || '없음'}
4. 문장 구성력: ${sentenceBuilding}점 (${SCORE_DESC[sentenceBuilding]})
   관찰: ${ns || '없음'}
5. 시도하는 힘: ${willingness}점 (${SCORE_DESC[willingness]})
   관찰: ${nw || '없음'}

이번 달 특별히 반영할 키워드: ${keywords ? keywords : '없음'}

다음 구성으로 700~1000자 분량의 리포트를 작성해주세요:
1. 이번 달 수업 요약 (1~2문장)
2. 오각형 항목별 성장 관찰 (각 항목을 자연스러운 문장으로, 점수 숫자를 직접 쓰지 말고)
3. 가장 두드러진 강점 (1~2문장)
4. 앞으로 연습하면 좋은 부분 (부정적이지 않게, 성장 방향 중심으로)
5. 다음 달 수업 방향 (1~2문장)
6. 선생님 한 줄 코멘트

마지막에 '~드림', '~튜터 드림', '~올림' 같은 서명 문구는 절대 쓰지 마세요.

작성 규칙:
- "못합니다", "부족합니다", "태도가 좋지 않습니다" 같은 표현은 절대 쓰지 마세요.
- 낮은 점수도 "아직 성장 중이에요", "함께 연습해 나가고 있어요" 등 긍정적 방향으로 써주세요.
- 전체 톤은 따뜻하고 전문적으로 유지해주세요.
- 학부모가 읽었을 때 아이의 현재 상태와 다음 방향을 명확히 알 수 있어야 합니다.
- '오각형', '레이더 차트', '차트' 같은 시각화 관련 단어는 절대 사용하지 마세요.
- '이번 달 특별히 반영할 키워드'가 있다면 리포트 곳곳에 자연스럽게 녹여주세요.`

    const client = new OpenAI({ apiKey })
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ report: text })
  } catch (err: unknown) {
    console.error('[growth-report] error:', err)
    const message = err instanceof Error ? err.message : 'AI 리포트 생성 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
