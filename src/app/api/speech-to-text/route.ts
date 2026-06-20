import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File
    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 })

    const hint = (formData.get('hint') as string) || ''

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
      prompt: hint || undefined,  // 예상 문장 힌트 → 인식 정확도 향상
      temperature: 0,             // 할루시네이션 방지
    })

    return NextResponse.json({ transcript: transcription.text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
