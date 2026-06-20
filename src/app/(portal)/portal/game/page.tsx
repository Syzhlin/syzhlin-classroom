'use client'

import { useState, useCallback } from 'react'
import { Star, RotateCcw, ChevronRight } from 'lucide-react'

const WORD_SETS = [
  { en: 'apple',    ko: '사과',   emoji: '🍎' },
  { en: 'banana',   ko: '바나나', emoji: '🍌' },
  { en: 'cat',      ko: '고양이', emoji: '🐱' },
  { en: 'dog',      ko: '강아지', emoji: '🐶' },
  { en: 'book',     ko: '책',     emoji: '📚' },
  { en: 'school',   ko: '학교',   emoji: '🏫' },
  { en: 'happy',    ko: '행복한', emoji: '😊' },
  { en: 'water',    ko: '물',     emoji: '💧' },
  { en: 'sun',      ko: '태양',   emoji: '☀️' },
  { en: 'friend',   ko: '친구',   emoji: '👫' },
  { en: 'family',   ko: '가족',   emoji: '👨‍👩‍👧' },
  { en: 'music',    ko: '음악',   emoji: '🎵' },
  { en: 'run',      ko: '달리다', emoji: '🏃' },
  { en: 'eat',      ko: '먹다',   emoji: '🍽️' },
  { en: 'sleep',    ko: '자다',   emoji: '😴' },
  { en: 'play',     ko: '놀다',   emoji: '🎮' },
  { en: 'star',     ko: '별',     emoji: '⭐' },
  { en: 'flower',   ko: '꽃',     emoji: '🌸' },
  { en: 'rainbow',  ko: '무지개', emoji: '🌈' },
  { en: 'ocean',    ko: '바다',   emoji: '🌊' },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── 플립 카드 게임 ──────────────────────────────────────────
function FlipCardGame({ onDone }: { onDone: (score: number, total: number) => void }) {
  const [cards] = useState(() => shuffle(WORD_SETS).slice(0, 8))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState(0)

  const current = cards[idx]

  function handleKnow(knew: boolean) {
    if (knew) setScore(s => s + 1)
    if (idx + 1 >= cards.length) {
      onDone(knew ? score + 1 : score, cards.length)
    } else {
      setFlipped(false)
      setTimeout(() => setIdx(i => i + 1), 150)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 진행 바 */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{idx + 1} / {cards.length}</span>
          <span>⭐ {score}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--sz-navy)] rounded-full transition-all"
            style={{ width: `${((idx) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 플립 카드 */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(true)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            height: '220px',
          }}
        >
          {/* 앞면 (영어) */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-6xl mb-4">{current.emoji}</p>
            <p className="text-3xl font-bold">{current.en}</p>
            {!flipped && (
              <p className="text-xs text-blue-100 mt-4">탭해서 뜻 확인 →</p>
            )}
          </div>

          {/* 뒷면 (한국어) */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-6xl mb-4">{current.emoji}</p>
            <p className="text-3xl font-bold">{current.ko}</p>
            <p className="text-lg text-orange-100 mt-1">{current.en}</p>
          </div>
        </div>
      </div>

      {/* 알았어요 / 몰랐어요 버튼 */}
      {flipped ? (
        <div className="flex gap-3 w-full">
          <button
            onClick={() => handleKnow(false)}
            className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold"
          >
            😅 몰랐어요
          </button>
          <button
            onClick={() => handleKnow(true)}
            className="flex-1 py-3.5 bg-[var(--sz-navy)] text-white rounded-2xl text-sm font-semibold"
          >
            ✅ 알았어요!
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400">카드를 탭해서 뜻을 확인해요</p>
      )}
    </div>
  )
}

// ── OX 퀴즈 게임 ────────────────────────────────────────────
function OXQuizGame({ onDone }: { onDone: (score: number, total: number) => void }) {
  const [questions] = useState(() =>
    shuffle(WORD_SETS).slice(0, 8).map((word, i) => {
      const isCorrect = Math.random() > 0.5
      const wrongWord = WORD_SETS.find(w => w.en !== word.en)!
      return {
        word,
        displayed: isCorrect ? word.ko : wrongWord.ko,
        answer: isCorrect,
      }
    })
  )
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const current = questions[idx]

  function handleAnswer(userSaysCorrect: boolean) {
    const correct = userSaysCorrect === current.answer
    if (correct) setScore(s => s + 1)
    setFeedback(correct ? 'correct' : 'wrong')
    setTimeout(() => {
      setFeedback(null)
      if (idx + 1 >= questions.length) {
        onDone(correct ? score + 1 : score, questions.length)
      } else {
        setIdx(i => i + 1)
      }
    }, 800)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{idx + 1} / {questions.length}</span>
          <span>⭐ {score}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div className={`w-full rounded-3xl p-8 flex flex-col items-center gap-3 transition-colors ${
        feedback === 'correct' ? 'bg-green-100' :
        feedback === 'wrong'   ? 'bg-red-100'   :
        'bg-gradient-to-br from-blue-50 to-indigo-50'
      }`}>
        <p className="text-5xl">{current.word.emoji}</p>
        <p className="text-3xl font-bold text-gray-900">{current.word.en}</p>
        <div className="w-8 h-0.5 bg-gray-200" />
        <p className="text-2xl font-bold text-[var(--sz-navy)]">{current.displayed}</p>
        <p className="text-xs text-gray-400">이 뜻이 맞나요?</p>
        {feedback && (
          <p className={`text-2xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
            {feedback === 'correct' ? '🎉 정답!' : '❌ 틀렸어요'}
          </p>
        )}
      </div>

      {!feedback && (
        <div className="flex gap-4 w-full">
          <button onClick={() => handleAnswer(false)}
            className="flex-1 py-4 bg-red-100 text-red-600 rounded-2xl text-2xl font-bold">
            ✕
          </button>
          <button onClick={() => handleAnswer(true)}
            className="flex-1 py-4 bg-green-100 text-green-600 rounded-2xl text-2xl font-bold">
            ○
          </button>
        </div>
      )}
    </div>
  )
}

// ── 결과 화면 ───────────────────────────────────────────────
function ResultScreen({ score, total, onRetry }: { score: number; total: number; onRetry: () => void }) {
  const pct = Math.round((score / total) * 100)
  const msg = pct >= 80 ? '완벽해요! 🎉' : pct >= 50 ? '잘했어요! 👍' : '다시 해봐요! 💪'

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="text-6xl">{pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '🌱'}</div>
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">{msg}</p>
        <p className="text-gray-500 mt-1">{total}문제 중 {score}개 정답</p>
      </div>

      {/* 원형 점수 */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--sz-navy)" strokeWidth="10"
            strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-[var(--sz-navy)]">{pct}%</span>
        </div>
      </div>

      {/* 별 */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-7 h-7 ${i < Math.ceil(pct / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
      </div>

      <button onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-[var(--sz-navy)] text-white rounded-2xl font-semibold">
        <RotateCcw className="w-4 h-4" /> 다시 하기
      </button>
    </div>
  )
}

// ── 게임 선택 화면 ───────────────────────────────────────────
const GAMES = [
  { id: 'flip',  label: '단어 플립카드', desc: '카드를 뒤집어 뜻을 맞혀요', emoji: '🃏', color: 'from-indigo-500 to-violet-600' },
  { id: 'ox',    label: 'OX 퀴즈',       desc: '맞는 뜻인지 O나 X로 답해요', emoji: '🎯', color: 'from-green-500 to-teal-600' },
]

// ── 메인 페이지 ─────────────────────────────────────────────
export default function GamePage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)

  function handleDone(score: number, total: number) {
    setResult({ score, total })
  }

  function handleRetry() {
    setResult(null)
    setGameId(null)
  }

  if (result) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6">
        <ResultScreen score={result.score} total={result.total} onRetry={handleRetry} />
      </div>
    )
  }

  if (gameId) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6">
        <button onClick={() => setGameId(null)} className="text-xs text-gray-400 mb-4 flex items-center gap-1">
          ← 게임 선택으로
        </button>
        {gameId === 'flip' && <FlipCardGame onDone={handleDone} />}
        {gameId === 'ox'   && <OXQuizGame   onDone={handleDone} />}
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">게임 🎮</h1>
        <p className="text-sm text-gray-400 mt-0.5">영어 단어를 게임으로 익혀요!</p>
      </div>
      <div className="space-y-3">
        {GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => setGameId(g.id)}
            className={`w-full bg-gradient-to-r ${g.color} rounded-2xl p-5 text-left text-white flex items-center gap-4`}
          >
            <span className="text-4xl">{g.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-base">{g.label}</p>
              <p className="text-sm opacity-80 mt-0.5">{g.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 opacity-70" />
          </button>
        ))}
      </div>
    </div>
  )
}
