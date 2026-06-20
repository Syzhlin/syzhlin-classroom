'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePortalStudent } from '@/contexts/PortalStudentContext'

// ─── Types ───────────────────────────────────────────────────────────────────

type City = { slug: string; name: string; emoji: string; story: string; gradient: string; unlockAt: number }
type Sentence = { en: string; ko: string; level: 1 | 2 | 3 }
type WordScore = { display: string; score: number }
type PracticeResult = { wordScores: WordScore[]; total: number; transcript: string }
type Phase = 'idle' | 'countdown' | 'recording' | 'analyzing' | 'result'

// ─── City Data ────────────────────────────────────────────────────────────────

const CITIES: City[] = [
  { slug: 'lumora',   name: 'Lumora',   emoji: '🏙️', story: '새벽 5시, 이 도시의 모든 창문에 동시에 불이 켜진다.',             gradient: 'linear-gradient(135deg,#F6D365 0%,#FDA085 100%)', unlockAt: 0   },
  { slug: 'selvaine', name: 'Selvaine', emoji: '🌊', story: '바다 위에 세워진 이 도시는 밀물 때마다 섬 하나가 사라진다.',         gradient: 'linear-gradient(135deg,#43C6AC 0%,#191654 100%)', unlockAt: 10  },
  { slug: 'noctalis', name: 'Noctalis', emoji: '🌙', story: '여기선 낮이 오지 않는다. 대신 달이 세 개다.',                     gradient: 'linear-gradient(135deg,#4776E6 0%,#8E54E9 100%)', unlockAt: 20  },
  { slug: 'erevon',   name: 'Erevon',   emoji: '🌿', story: '나무들이 도시를 만든 게 아니라, 도시가 나무로 자란 것이다.',          gradient: 'linear-gradient(135deg,#56AB2F 0%,#A8E063 100%)', unlockAt: 30  },
  { slug: 'vellhara', name: 'Vellhara', emoji: '❄️', story: '모든 건물이 얼음으로 만들어졌지만, 아무도 춥다고 느끼지 않는다.',    gradient: 'linear-gradient(135deg,#B0E0FF 0%,#6EC6F5 100%)', unlockAt: 40  },
  { slug: 'cindrath', name: 'Cindrath', emoji: '🔥', story: '화산 폭발로 탄생한 도시. 용암이 식어 길이 됐다.',                  gradient: 'linear-gradient(135deg,#F7971E 0%,#FF4E50 100%)', unlockAt: 50  },
  { slug: 'aeloria',  name: 'Aeloria',  emoji: '☁️', story: '지도에는 없다. 바람이 부는 날에만 구름 사이로 보인다.',             gradient: 'linear-gradient(135deg,#C9D6FF 0%,#b8c6e0 100%)', unlockAt: 70  },
  { slug: 'thessmyr', name: 'Thessmyr', emoji: '🌺', story: '365일 축제 중. 처음 온 사람도 10분 안에 춤을 추게 된다.',          gradient: 'linear-gradient(135deg,#FF6FD8 0%,#FFC75F 100%)', unlockAt: 90  },
  { slug: 'orvantis', name: 'Orvantis', emoji: '💎', story: '지하 300m. 수정이 빛을 만들어 태양 없이도 낮이 된다.',             gradient: 'linear-gradient(135deg,#7B4FFF 0%,#00D4FF 100%)', unlockAt: 120 },
  { slug: 'zephyral', name: 'Zephyral', emoji: '✨', story: '별과 별 사이, 지도에도 우주에도 없는 마지막 도시.',                 gradient: 'linear-gradient(135deg,#1A1A2E 0%,#FFD700 100%)', unlockAt: 150 },
]

// ─── Sentence Data ────────────────────────────────────────────────────────────

const SENTENCES: Record<string, Sentence[]> = {
  lumora: [
    { en: "Good morning! How are you?",            ko: "좋은 아침이에요! 어떻게 지내요?",        level: 1 },
    { en: "My name is Lumora. What's yours?",       ko: "제 이름은 루모라예요. 당신은요?",         level: 1 },
    { en: "Nice to meet you!",                      ko: "만나서 반가워요!",                      level: 1 },
    { en: "I'm doing great, thank you!",            ko: "저는 잘 지내고 있어요, 감사해요!",        level: 1 },
    { en: "See you tomorrow!",                      ko: "내일 봐요!",                           level: 1 },
    { en: "Have a wonderful day!",                  ko: "멋진 하루 보내세요!",                    level: 2 },
    { en: "It's so good to see you again.",         ko: "다시 만나서 정말 반가워요.",              level: 2 },
    { en: "How was your weekend?",                  ko: "주말 어떻게 보냈어요?",                  level: 2 },
    { en: "I haven't seen you in a long time!",     ko: "정말 오랜만이에요!",                     level: 3 },
    { en: "You look amazing today!",                ko: "오늘 정말 멋져 보여요!",                 level: 3 },
  ],
  selvaine: [
    { en: "It's sunny today!",                            ko: "오늘 날씨가 맑아요!",                     level: 1 },
    { en: "The ocean is so beautiful.",                   ko: "바다가 정말 아름다워요.",                   level: 1 },
    { en: "Look at those big waves!",                     ko: "저 큰 파도 좀 봐요!",                     level: 1 },
    { en: "It's a little cloudy outside.",                ko: "밖이 조금 흐려요.",                       level: 1 },
    { en: "I love the smell of the rain.",                ko: "저는 빗냄새를 좋아해요.",                   level: 2 },
    { en: "The wind is blowing so hard today.",           ko: "오늘 바람이 엄청 세게 불어요.",              level: 2 },
    { en: "The sky turned purple before the storm.",      ko: "폭풍 전에 하늘이 보라색으로 변했어요.",        level: 2 },
    { en: "There's a rainbow after the rain!",            ko: "비 온 뒤에 무지개가 떴어요!",               level: 3 },
    { en: "The tide comes in every twelve hours.",        ko: "조수는 12시간마다 밀려와요.",                level: 3 },
    { en: "Lightning flashed across the dark sky.",       ko: "번개가 어두운 하늘을 가로질러 번쩍였어요.",    level: 3 },
  ],
  noctalis: [
    { en: "Can I have some water, please?",               ko: "물 좀 주시겠어요?",                       level: 1 },
    { en: "This cake is delicious!",                      ko: "이 케이크 맛있어요!",                      level: 1 },
    { en: "I'd like a hot chocolate.",                    ko: "따뜻한 핫초코 주세요.",                     level: 1 },
    { en: "The menu looks amazing.",                      ko: "메뉴가 정말 멋져 보여요.",                   level: 1 },
    { en: "Can I get this to go, please?",                ko: "포장해 주실 수 있나요?",                    level: 2 },
    { en: "What do you recommend here?",                  ko: "여기서 뭘 추천해 주시나요?",                 level: 2 },
    { en: "This coffee smells like midnight magic.",       ko: "이 커피는 한밤중의 마법 같은 냄새가 나요.",   level: 2 },
    { en: "I'll have the blueberry muffin, please.",      ko: "블루베리 머핀으로 주세요.",                  level: 3 },
    { en: "Could we get the check, please?",              ko: "계산서 주시겠어요?",                       level: 3 },
    { en: "Everything on the menu sounds incredible.",    ko: "메뉴에 있는 모든 것이 정말 맛있어 보여요.",   level: 3 },
  ],
  erevon: [
    { en: "Look! A bunny rabbit!",                              ko: "봐요! 토끼예요!",                       level: 1 },
    { en: "The birds are singing.",                             ko: "새들이 노래해요.",                       level: 1 },
    { en: "I love butterflies!",                                ko: "저는 나비를 좋아해요!",                   level: 1 },
    { en: "The fox is hiding in the bushes.",                   ko: "여우가 덤불 속에 숨어 있어요.",            level: 1 },
    { en: "Be quiet — there's a deer nearby!",                  ko: "조용히 해요 — 근처에 사슴이 있어요!",      level: 2 },
    { en: "The owl only comes out at night.",                   ko: "부엉이는 밤에만 나와요.",                  level: 2 },
    { en: "A family of bears lives in this forest.",            ko: "곰 가족이 이 숲에 살아요.",                level: 2 },
    { en: "The trees here are hundreds of years old.",          ko: "여기 나무들은 수백 년이 됐어요.",           level: 3 },
    { en: "The fireflies light up the whole forest.",           ko: "반딧불이가 숲 전체를 밝혀요.",             level: 3 },
    { en: "Animals and plants grow together in harmony.",       ko: "동물과 식물이 조화롭게 함께 자라요.",       level: 3 },
  ],
  vellhara: [
    { en: "I like this blue coat!",                             ko: "이 파란 코트가 마음에 들어요!",            level: 1 },
    { en: "How much is this?",                                  ko: "이게 얼마예요?",                         level: 1 },
    { en: "Do you have this in red?",                           ko: "빨간색도 있나요?",                       level: 1 },
    { en: "Can I try this on?",                                 ko: "이거 입어봐도 되나요?",                   level: 1 },
    { en: "This scarf is so soft and warm.",                    ko: "이 스카프는 정말 부드럽고 따뜻해요.",        level: 2 },
    { en: "I'll take two of these, please.",                    ko: "이거 두 개 주세요.",                      level: 2 },
    { en: "Everything here looks like it's made of ice.",       ko: "여기 모든 것이 얼음으로 만들어진 것 같아요.", level: 2 },
    { en: "The silver boots match my crystal bag.",             ko: "은색 부츠가 내 크리스털 가방이랑 잘 어울려요.", level: 3 },
    { en: "I'm looking for something sparkly and bright.",      ko: "반짝이고 밝은 걸 찾고 있어요.",             level: 3 },
    { en: "This winter collection is absolutely stunning.",     ko: "이번 겨울 컬렉션은 정말 놀라워요.",          level: 3 },
  ],
  cindrath: [
    { en: "Let's go explore!",                                  ko: "탐험하러 가요!",                         level: 1 },
    { en: "This path looks exciting.",                          ko: "이 길이 신나 보여요.",                     level: 1 },
    { en: "Don't touch that — it's hot!",                       ko: "그거 만지지 마요 — 뜨거워요!",             level: 1 },
    { en: "We found a hidden cave!",                            ko: "우리가 숨겨진 동굴을 찾았어요!",            level: 1 },
    { en: "Follow me — I know the way.",                        ko: "저를 따라와요 — 길을 알아요.",              level: 2 },
    { en: "The volcano hasn't erupted in fifty years.",         ko: "화산이 50년 동안 폭발하지 않았어요.",        level: 2 },
    { en: "I can feel the heat rising from the ground.",        ko: "땅에서 열기가 올라오는 게 느껴져요.",        level: 2 },
    { en: "Every explorer needs a good map.",                   ko: "모든 탐험가에게는 좋은 지도가 필요해요.",    level: 3 },
    { en: "The lava cooled overnight and became a road.",       ko: "용암이 밤사이 식어서 길이 됐어요.",          level: 3 },
    { en: "Brave adventurers never turn back in fear.",         ko: "용감한 모험가는 두려움에 돌아서지 않아요.",   level: 3 },
  ],
  aeloria: [
    { en: "We're flying so high!",                              ko: "우리 정말 높이 날고 있어요!",              level: 1 },
    { en: "Look at those fluffy clouds.",                       ko: "저 뭉게구름 좀 봐요.",                    level: 1 },
    { en: "The city is hidden above the clouds.",               ko: "도시가 구름 위에 숨겨져 있어요.",           level: 1 },
    { en: "I want to visit every country.",                     ko: "저는 모든 나라를 여행하고 싶어요.",          level: 1 },
    { en: "Where does this road in the sky lead?",              ko: "하늘의 이 길은 어디로 이어질까요?",          level: 2 },
    { en: "Pack light — we're leaving at sunrise.",             ko: "짐을 가볍게 싸요 — 해 뜰 때 출발해요.",     level: 2 },
    { en: "From up here, the world looks tiny.",                ko: "여기서 보니까 세상이 작아 보여요.",          level: 2 },
    { en: "The wind carries us wherever we want to go.",        ko: "바람이 우리를 원하는 곳으로 데려다줘요.",    level: 3 },
    { en: "Traveling opens your eyes to new possibilities.",    ko: "여행은 새로운 가능성으로 눈을 열어줘요.",    level: 3 },
    { en: "They say Aeloria only appears on windy days.",       ko: "아엘로리아는 바람 부는 날에만 나타난다고 해요.", level: 3 },
  ],
  thessmyr: [
    { en: "Let's dance together!",                              ko: "같이 춤춰요!",                           level: 1 },
    { en: "I love this song!",                                  ko: "이 노래가 너무 좋아요!",                  level: 1 },
    { en: "The flowers are everywhere!",                        ko: "꽃이 온 사방에 있어요!",                  level: 1 },
    { en: "Can you hear that music?",                           ko: "저 음악 들려요?",                        level: 1 },
    { en: "This festival happens every year.",                  ko: "이 축제는 매년 열려요.",                   level: 2 },
    { en: "Everyone is wearing colorful clothes.",              ko: "모두가 화려한 옷을 입고 있어요.",           level: 2 },
    { en: "The drummer kept the whole crowd moving.",           ko: "드러머가 모든 사람을 계속 춤추게 했어요.",   level: 2 },
    { en: "Music has the power to bring people together.",      ko: "음악은 사람들을 하나로 모으는 힘이 있어요.", level: 3 },
    { en: "The parade stretched for more than a mile.",         ko: "퍼레이드가 1마일 이상 이어졌어요.",          level: 3 },
    { en: "In Thessmyr, every heartbeat is a drumbeat.",        ko: "세스미르에서는 모든 심장 박동이 드럼 소리예요.", level: 3 },
  ],
  orvantis: [
    { en: "That crystal is glowing!",                           ko: "저 수정이 빛나고 있어요!",                 level: 1 },
    { en: "Science is like magic!",                             ko: "과학은 마법 같아요!",                     level: 1 },
    { en: "Mix these two colors together.",                     ko: "이 두 색을 함께 섞어요.",                  level: 1 },
    { en: "The lab is deep underground.",                       ko: "연구소가 땅속 깊이 있어요.",                level: 1 },
    { en: "This potion makes you invisible!",                   ko: "이 물약은 당신을 투명하게 만들어요!",        level: 2 },
    { en: "The crystals store energy from the earth.",          ko: "수정들이 땅에서 에너지를 저장해요.",          level: 2 },
    { en: "Every experiment teaches us something new.",         ko: "모든 실험은 우리에게 새로운 것을 알려줘요.", level: 2 },
    { en: "Light bends differently through each crystal.",      ko: "빛이 수정마다 다르게 굴절돼요.",             level: 3 },
    { en: "The scientists discovered a new element today.",     ko: "과학자들이 오늘 새로운 원소를 발견했어요.",   level: 3 },
    { en: "In Orvantis, curiosity is the greatest power.",     ko: "오르반티스에서는 호기심이 가장 큰 힘이에요.", level: 3 },
  ],
  zephyral: [
    { en: "Look at all the stars!",                             ko: "별들 좀 봐요!",                          level: 1 },
    { en: "The universe is huge.",                              ko: "우주는 엄청나게 커요.",                    level: 1 },
    { en: "That's the brightest star I've ever seen.",          ko: "제가 본 것 중 가장 밝은 별이에요.",         level: 1 },
    { en: "We're floating in space!",                           ko: "우리가 우주에서 떠 있어요!",               level: 1 },
    { en: "How many planets are in our solar system?",          ko: "우리 태양계에 행성이 몇 개나 있어요?",       level: 2 },
    { en: "The shooting star disappeared in a second.",         ko: "별똥별이 1초 만에 사라졌어요.",             level: 2 },
    { en: "Every star you see is a sun far away.",              ko: "보이는 모든 별은 멀리 있는 태양이에요.",     level: 2 },
    { en: "Zephyral exists between the stars.",                 ko: "제피랄은 별과 별 사이에 존재해요.",          level: 3 },
    { en: "The astronaut floated silently through the dark.",   ko: "우주비행사가 어둠 속을 조용히 떠다녔어요.",   level: 3 },
    { en: "We are made of the same dust as the stars.",         ko: "우리는 별과 같은 먼지로 만들어졌어요.",       level: 3 },
  ],
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function cleanStr(s: string) {
  return s.toLowerCase().replace(/[—–\-]/g, ' ').replace(/[^a-z\s]/g, '').trim()
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[a.length][b.length]
}

function scorePhrase(original: string, recognized: string): { wordScores: WordScore[]; total: number } {
  const origClean = cleanStr(original)
  const recogClean = cleanStr(recognized)

  const origWords = original.split(/\s+/)
  const origKeys = origClean.split(/\s+/).filter(Boolean)
  const recogWords = recogClean.split(/\s+/).filter(Boolean)
  const recogSet = new Set(recogWords)

  // 1. 단어 순서 매칭 (60%)
  let rIdx = 0
  const wordMatched = origKeys.map(word => {
    const start = rIdx
    while (rIdx < recogWords.length && recogWords[rIdx] !== word) rIdx++
    if (rIdx < recogWords.length) { rIdx++; return true }
    rIdx = start
    return recogSet.has(word) // 순서 무관하게라도 있으면 절반 점수
  })
  const wordScore = origKeys.length
    ? wordMatched.filter(Boolean).length / origKeys.length
    : 0

  // 2. 문장 전체 유사도 (40%) - 커버리지 기반
  const coverageRatio = origKeys.length ? Math.min(1, recogWords.length / origKeys.length) : 0
  // 텍스트 유사도 (레벤슈타인)
  const maxLen = Math.max(origClean.length, recogClean.length)
  const editSimilarity = maxLen > 0 ? 1 - levenshtein(origClean, recogClean) / maxLen : 0
  const sentenceScore = (coverageRatio * 0.5 + editSimilarity * 0.5)

  const total = Math.round((wordScore * 0.6 + sentenceScore * 0.4) * 100)

  const wordScores: WordScore[] = origWords.map((w, i) => ({
    display: w,
    score: wordMatched[i] ? 100 : 0,
  }))

  return { wordScores, total }
}

function scoreLabel(score: number) {
  if (score >= 90) return { text: '완벽해요! 🌟', color: '#22C55E' }
  if (score >= 70) return { text: '잘 했어요! 👍', color: '#F59E0B' }
  if (score >= 50) return { text: '조금 더 연습해봐요 💪', color: '#F97316' }
  return { text: '다시 한 번 해볼까요? 🎯', color: '#EF4444' }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PronunciationPage() {
  const { selectedStudentId } = usePortalStudent()
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<City | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedStudentId) return
    const supabase = createClient()
    ;(supabase as any).from('pronunciation_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', selectedStudentId)
      .then(({ count }: { count: number | null }) => {
        setTotalAttempts(count ?? 0)
        setLoading(false)
      })
  }, [selectedStudentId])

  const handleAttemptComplete = useCallback(async (score: number, citySlug: string, sentenceEn: string, transcript: string) => {
    if (!selectedStudentId) return
    const supabase = createClient()
    await (supabase as any).from('pronunciation_attempts').insert({
      student_id: selectedStudentId,
      city_slug: citySlug,
      sentence_en: sentenceEn,
      score,
      transcript,
    })

    setTotalAttempts(prev => {
      const next = prev + 1
      const nowUnlocked = Math.floor(next / 10)
      const wasUnlocked = Math.floor(prev / 10)
      if (nowUnlocked > wasUnlocked) {
        const nextCity = CITIES[nowUnlocked]
        if (nextCity) setNewlyUnlocked(nextCity)
      }
      return next
    })
  }, [selectedStudentId])

  const unlockedCities = new Set(CITIES.filter(c => c.unlockAt <= totalAttempts).map(c => c.slug))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #6B8ED6', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      {selectedCity ? (
        <PracticeScreen
          city={selectedCity}
          onBack={() => setSelectedCity(null)}
          onAttemptComplete={handleAttemptComplete}
          totalAttempts={totalAttempts}
        />
      ) : (
        <WorldMap
          totalAttempts={totalAttempts}
          unlockedCities={unlockedCities}
          onSelectCity={(city) => { if (unlockedCities.has(city.slug)) setSelectedCity(city) }}
        />
      )}
      {newlyUnlocked && (
        <UnlockModal city={newlyUnlocked} onClose={() => setNewlyUnlocked(null)} />
      )}
    </div>
  )
}

// ─── World Map ────────────────────────────────────────────────────────────────

function WorldMap({ totalAttempts, unlockedCities, onSelectCity }: {
  totalAttempts: number
  unlockedCities: Set<string>
  onSelectCity: (city: City) => void
}) {
  const nextLock = CITIES.find(c => !unlockedCities.has(c.slug))
  const remaining = nextLock ? nextLock.unlockAt - totalAttempts : 0
  const progress = nextLock ? ((totalAttempts % 10) / 10) * 100 : 100

  return (
    <div className="px-4 py-5">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#1E2D4E' }}>🌍 문장 탐험</h1>
        <p className="text-xs mt-1" style={{ color: '#8B9BB0' }}>
          총 <span className="font-bold" style={{ color: '#6B8ED6' }}>{totalAttempts}</span>번 연습 완료
          {remaining > 0 && ` · 다음 도시까지 ${remaining}번 더!`}
        </p>
        {nextLock && (
          <div className="mt-3 mx-auto max-w-xs">
            <div style={{ height: 6, borderRadius: 99, backgroundColor: 'rgba(175,196,216,0.25)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg,#6B8ED6,#9BB5CE)',
                width: `${progress}%`, transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CITIES.map((city) => {
          const unlocked = unlockedCities.has(city.slug)
          return (
            <button
              key={city.slug}
              onClick={() => onSelectCity(city)}
              disabled={!unlocked}
              className="relative text-left rounded-3xl overflow-hidden transition-all active:scale-95"
              style={{
                minHeight: 140,
                opacity: unlocked ? 1 : 0.55,
                boxShadow: unlocked
                  ? '8px 8px 20px rgba(0,0,0,0.12), -3px -3px 10px rgba(255,255,255,0.8)'
                  : '4px 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: city.gradient, filter: unlocked ? 'none' : 'grayscale(1)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)' }} />
              <div className="relative p-4 flex flex-col justify-between" style={{ minHeight: 140 }}>
                <div className="flex items-start justify-between">
                  <span style={{ fontSize: 28 }}>{city.emoji}</span>
                  {!unlocked && <span style={{ fontSize: 16 }}>🔒</span>}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{city.name}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{city.story}</p>
                  {!unlocked && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                      {city.unlockAt - totalAttempts}번 더 연습하면 열려요
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Practice Screen ──────────────────────────────────────────────────────────

function PracticeScreen({ city, onBack, onAttemptComplete, totalAttempts }: {
  city: City
  onBack: () => void
  onAttemptComplete: (score: number, citySlug: string, sentenceEn: string, transcript: string) => void
  totalAttempts: number
}) {
  const sentences = SENTENCES[city.slug] ?? []
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [sessionDone, setSessionDone] = useState(0)
  const [noSpeech, setNoSpeech] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef<Phase>('idle')

  phaseRef.current = phase

  const sentence = sentences[idx]

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      mediaRecorderRef.current?.stop()
      speechSynthesis.cancel()
    }
  }, [])

  function playTTS() {
    speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(sentence.en)
    utt.lang = 'en-US'
    utt.rate = 0.85
    const voices = speechSynthesis.getVoices()
    const usVoice = voices.find(v => v.lang === 'en-US' && /female|samantha|zira/i.test(v.name))
      || voices.find(v => v.lang === 'en-US')
    if (usVoice) utt.voice = usVoice
    speechSynthesis.speak(utt)
  }

  function startCountdown() {
    setPhase('countdown')
    setCountdown(3)
    let c = 3
    const tick = () => {
      c -= 1
      if (c > 0) { setCountdown(c); timerRef.current = setTimeout(tick, 1000) }
      else { setCountdown(0); startListening() }
    }
    timerRef.current = setTimeout(tick, 1000)
  }

  async function startListening() {
    setPhase('recording')
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setNoSpeech(true)
      analyze('')
      return
    }

    // iOS는 audio/mp4만 지원, 안 되면 기본값 사용
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
      : ''

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    const actualType = recorder.mimeType || 'audio/mp4'

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: actualType })

      setPhase('analyzing')
      try {
        const ext = actualType.includes('mp4') ? 'm4a'
          : actualType.includes('ogg') ? 'ogg'
          : actualType.includes('wav') ? 'wav' : 'webm'
        const file = new File([blob], `rec.${ext}`, { type: actualType })
        const fd = new FormData()
        fd.append('audio', file)
        const res = await fetch('/api/speech-to-text', { method: 'POST', body: fd })
        if (!res.ok) { analyze(''); return }
        const data = await res.json()
        analyze(data.transcript ?? '')
      } catch {
        analyze('')
      }
    }

    recorder.start()
    // Auto-stop after 8s
    timerRef.current = setTimeout(() => recorder.state === 'recording' && recorder.stop(), 8000)
  }

  function stopEarly() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  function analyze(transcript: string) {
    const empty = !transcript.trim()
    if (empty) setNoSpeech(true)
    else setPhase('analyzing')
    setTimeout(() => {
      const { wordScores, total } = scorePhrase(sentence.en, transcript)
      setResult({ wordScores, total, transcript })
      setPhase('result')
      if (!empty) {
        setSessionDone(prev => prev + 1)
        onAttemptComplete(total, city.slug, sentence.en, transcript)
      }
    }, 900)
  }

  function next() { setResult(null); setPhase('idle'); setIdx(prev => (prev + 1) % sentences.length) }
  function retry() { setResult(null); setPhase('idle') }

  const label = scoreLabel(result?.total ?? 0)
  const levelStars = sentence ? '⭐'.repeat(sentence.level) : ''

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* City header */}
      <div className="relative px-5 py-6" style={{ background: city.gradient }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
        <div className="relative flex w-full items-center mb-2">
          <button onClick={onBack} className="text-white opacity-80 mr-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 22 }}>{city.emoji}</span>
          <span className="ml-2 font-bold text-white text-lg">{city.name}</span>
          <span className="ml-auto text-white text-xs opacity-75">{idx + 1} / {sentences.length}</span>
        </div>
        <p className="relative text-white text-xs opacity-75 text-center">{city.story}</p>
        <p className="relative text-white text-xs mt-1 opacity-55 text-center">이번 탐험 {sessionDone}문장 · 전체 {totalAttempts}회</p>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-5">
        {/* Sentence card */}
        <div style={{
          borderRadius: 24,
          backgroundColor: '#FEFCF8',
          boxShadow: '8px 8px 24px rgba(175,165,148,0.2), -4px -4px 14px rgba(255,255,255,1)',
          border: '1px solid rgba(255,255,255,0.9)',
          padding: '20px',
        }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: '#B8C4D0' }}>난이도 {levelStars}</span>
            <button onClick={playTTS} style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg,#6B8ED6,#9BB5CE)',
              boxShadow: '4px 4px 10px rgba(107,142,214,0.35), -2px -2px 6px rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          </div>

          {phase === 'result' && result ? (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3" style={{ minHeight: 48 }}>
              {result.wordScores.map((w, i) => (
                <span key={i} style={{
                  fontSize: 20, fontWeight: 700, lineHeight: 1.4,
                  color: w.score >= 90 ? '#16A34A' : w.score >= 50 ? '#D97706' : '#DC2626',
                }}>{w.display}</span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1E2D4E', lineHeight: 1.5, marginBottom: 10 }}>
              {sentence?.en}
            </p>
          )}

          <p style={{ fontSize: 13, color: '#8B9BB0' }}>{sentence?.ko}</p>

          {phase === 'result' && (
            <p style={{ fontSize: 11, color: '#B8C4D0', marginTop: 8 }}>
              {result?.transcript ? `들린 내용: "${result.transcript}"` : '🎙️ 음성이 인식되지 않았어요'}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          {phase === 'idle' && (
            <>
              <p style={{ fontSize: 13, color: '#8B9BB0' }}>🔊 먼저 듣고, 그대로 따라해보세요</p>
              <button onClick={startCountdown} style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)',
                boxShadow: '8px 8px 20px rgba(255,107,107,0.4), -4px -4px 12px rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <p style={{ fontSize: 12, color: '#B8C4D0' }}>탭해서 녹음 시작</p>
            </>
          )}

          {phase === 'countdown' && (
            <>
              <p style={{ fontSize: 13, color: '#8B9BB0' }}>준비하세요...</p>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                backgroundColor: '#FEFCF8',
                boxShadow: '8px 8px 20px rgba(175,165,148,0.25), -4px -4px 12px rgba(255,255,255,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 800, color: '#6B8ED6',
              }}>{countdown}</div>
            </>
          )}

          {phase === 'recording' && (
            <>
              <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>🔴 녹음 중...</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 52 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    width: 6, borderRadius: 99, backgroundColor: '#FF6B6B',
                    animation: `wave${i % 3} 0.65s ease-in-out infinite`,
                    animationDelay: `${i * 0.09}s`,
                  }} />
                ))}
              </div>
              <button onClick={stopEarly} style={{
                padding: '10px 28px', borderRadius: 99,
                backgroundColor: '#FEFCF8',
                boxShadow: '4px 4px 12px rgba(175,165,148,0.2), -3px -3px 8px rgba(255,255,255,1)',
                border: '1px solid rgba(255,255,255,0.9)',
                fontSize: 13, color: '#8B9BB0', fontWeight: 600,
              }}>완료 ✓</button>
              <style>{`
                @keyframes wave0 { 0%,100%{height:10px} 50%{height:42px} }
                @keyframes wave1 { 0%,100%{height:18px} 50%{height:30px} }
                @keyframes wave2 { 0%,100%{height:6px}  50%{height:46px} }
              `}</style>
            </>
          )}

          {phase === 'analyzing' && (
            <>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #6B8ED6', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#8B9BB0' }}>AI가 분석 중이에요...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </>
          )}

          {phase === 'result' && result && (
            <>
              {/* Score ring */}
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(175,196,216,0.2)" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={result.total >= 70 ? '#22C55E' : result.total >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.total / 100)}`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#1E2D4E' }}>{result.total}</span>
                  <span style={{ fontSize: 10, color: '#8B9BB0' }}>점</span>
                </div>
              </div>

              {noSpeech ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#8B9BB0' }}>음성을 인식하지 못했어요 🎙️</p>
                  <p style={{ fontSize: 12, color: '#B8C4D0', textAlign: 'center', lineHeight: 1.6 }}>
                    마이크 권한을 허용했는지 확인하고<br/>다시 도전해봐요!
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 15, fontWeight: 700, color: label.color }}>{label.text}</p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={retry} style={{
                  padding: '12px 20px', borderRadius: 99,
                  backgroundColor: '#FEFCF8',
                  boxShadow: '4px 4px 12px rgba(175,165,148,0.2), -3px -3px 8px rgba(255,255,255,1)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  fontSize: 13, color: '#6B8ED6', fontWeight: 700,
                }}>🔄 다시 도전</button>
                <button onClick={next} style={{
                  padding: '12px 20px', borderRadius: 99,
                  background: 'linear-gradient(135deg,#6B8ED6,#9BB5CE)',
                  boxShadow: '4px 4px 12px rgba(107,142,214,0.35)',
                  fontSize: 13, color: 'white', fontWeight: 700,
                }}>다음 문장 →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Unlock Modal ─────────────────────────────────────────────────────────────

function UnlockModal({ city, onClose }: { city: City; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        borderRadius: 32, backgroundColor: '#FEFCF8',
        boxShadow: '16px 16px 40px rgba(0,0,0,0.2), -8px -8px 20px rgba(255,255,255,0.6)',
        padding: '32px 28px', textAlign: 'center', maxWidth: 320, width: '100%',
        animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: city.gradient, margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, boxShadow: '6px 6px 18px rgba(0,0,0,0.15)',
        }}>{city.emoji}</div>
        <p style={{ fontSize: 13, color: '#8B9BB0', marginBottom: 4 }}>새로운 도시가 열렸어요! 🎉</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1E2D4E', marginBottom: 8 }}>{city.name}</h2>
        <p style={{ fontSize: 13, color: '#6B7E99', lineHeight: 1.6, marginBottom: 24 }}>{city.story}</p>
        <button onClick={onClose} style={{
          width: '100%', padding: '14px', borderRadius: 99,
          background: 'linear-gradient(135deg,#6B8ED6,#9BB5CE)',
          boxShadow: '4px 4px 12px rgba(107,142,214,0.35)',
          fontSize: 15, color: 'white', fontWeight: 700,
        }}>탐험하러 가기 ✈️</button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
      `}</style>
    </div>
  )
}
