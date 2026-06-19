import React from 'react'

const LABELS = ['표현력', '이해력', '읽기 유창성', '문장 구성력', '시도하는 힘']
const N = 5
const R = 75
const CX = 110
const CY = 110

function getPoint(i: number, r: number) {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

interface Props { scores: number[]; size?: number }

export function PentagonChart({ scores, size = 220 }: Props) {
  const scorePoints = scores.map((s, i) => {
    const p = getPoint(i, ((s || 0) / 5) * R)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" className="mx-auto">
      {/* 배경 오각형 5레벨 */}
      {[1, 2, 3, 4, 5].map(level => (
        <polygon key={level}
          points={Array.from({ length: N }, (_, i) => { const p = getPoint(i, (level / 5) * R); return `${p.x},${p.y}` }).join(' ')}
          fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* 축선 */}
      {Array.from({ length: N }, (_, i) => { const p = getPoint(i, R); return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" /> })}
      {/* 점수 영역 */}
      {scores.some(s => s > 0) && (
        <polygon points={scorePoints} fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
      )}
      {/* 점수 점 */}
      {scores.map((s, i) => {
        if (!s) return null
        const p = getPoint(i, (s / 5) * R)
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="1.5" />
      })}
      {/* 레이블 */}
      {LABELS.map((label, i) => {
        const p = getPoint(i, R + 24)
        const words = label.split(' ')
        return (
          <text key={i} textAnchor="middle" fontSize="9" fill="#6b7280">
            {words.length === 1
              ? <tspan x={p.x} y={p.y} dominantBaseline="middle">{label}</tspan>
              : words.map((w, j) => <tspan key={j} x={p.x} y={p.y + (j - (words.length - 1) / 2) * 11}>{w}</tspan>)
            }
          </text>
        )
      })}
    </svg>
  )
}
