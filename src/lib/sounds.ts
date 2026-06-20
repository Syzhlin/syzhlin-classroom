// Web Audio API 기반 효과음 유틸리티
// 파일 없이 합성음으로 생성 — 배터리 소모 최소화

let _ctx: AudioContext | null = null

async function ctx(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') return null
  try {
    if (!_ctx) _ctx = new AudioContext()
    if (_ctx.state === 'suspended') await _ctx.resume()
    return _ctx
  } catch {
    return null
  }
}

// 공통: 오실레이터 원샷 재생
async function playTone(
  freq: number,
  endFreq: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  delay = 0
) {
  const c = await ctx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    const t = c.currentTime + delay
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration)
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration)
  } catch {}
}

/** 버튼 클릭음: 경쾌한 짧은 탭 */
export function playClickSound() {
  playTone(700, 500, 0.07, 0.12, 'sine')
}

/** 네비게이션 페이지 전환음: 부드러운 상승 스윕 */
export function playPageTransitionSound() {
  playTone(220, 440, 0.18, 0.08, 'sine')
  playTone(330, 550, 0.12, 0.04, 'sine', 0.05)
}

/** 형제 탭 전환음: 가벼운 토글 느낌 */
export function playSiblingSwapSound() {
  playTone(500, 700, 0.08, 0.1, 'sine')
  playTone(700, 900, 0.06, 0.05, 'sine', 0.06)
}

/** 로그아웃 / 뒤로가기: 하강 톤 */
export function playBackSound() {
  playTone(400, 250, 0.15, 0.08, 'sine')
}
