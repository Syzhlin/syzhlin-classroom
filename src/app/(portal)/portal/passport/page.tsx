'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { useGrowthReport } from '@/lib/queries/useFeedback'
import {
  CITIES, CONTINENTS, CONTINENT_EMOJI, CONTINENT_LABELS,
  getStampedCities, getCurrentCity, getCityStatus,
  classesInCurrentCity, currentCityIndex,
  type Continent, type CityStatus,
} from '@/lib/cities'

// ── 스탬프 카드 ──────────────────────────────────────────────
function StampCard({ cityIndex, completedCount }: { cityIndex: number; completedCount: number }) {
  const city = CITIES.find(c => c.index === cityIndex)!
  const status: CityStatus = getCityStatus(cityIndex, completedCount)

  if (status === 'locked') {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl" style={{opacity: 0.35}}>
        <span className="text-xl opacity-20">{city.landmark}</span>
        <span className="text-[9px] text-gray-200 text-center font-medium">{city.name}</span>
      </div>
    )
  }

  if (status === 'next') {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5" style={{backgroundColor: 'var(--sz-blue-pale)', border: '2px dashed var(--sz-blue-soft)', borderRadius: '16px'}}>
        <span className="text-xl">{city.landmark}</span>
        <span className="text-[9px] text-center font-medium leading-tight" style={{color:'var(--sz-text-deep)'}}>{city.name}</span>
        <span className="text-[8px]" style={{color:'var(--sz-blue-soft)'}}>다음 도시</span>
      </div>
    )
  }

  if (status === 'arrived') {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5" style={{backgroundColor: 'var(--sz-peach-pale)', borderRadius: '16px'}}>
        <div className="relative">
          <span className="text-xl opacity-70">{city.landmark}</span>
          <span className="absolute -top-1 -right-2 text-[8px] bg-amber-400 text-white rounded-full px-1 py-0.5 font-bold">1/2</span>
        </div>
        <span className="text-[9px] text-center font-semibold leading-tight" style={{color:"var(--sz-navy)"}}>{city.name}</span>
        <span className="text-[8px] font-semibold" style={{color:"var(--sz-gold)"}}>Arrived</span>
      </div>
    )
  }

  // stamped
  return (
    <div className="flex flex-col items-center gap-1 p-2.5" style={{backgroundColor: 'var(--sz-peach-pale)', borderRadius: '16px'}}>
      <div className="relative">
        <span className="text-xl">{city.landmark}</span>
        <span className="absolute -top-1 -right-1.5 text-[8px] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center" style={{backgroundColor:"var(--sz-navy)"}}>✓</span>
      </div>
      <span className="text-[9px] text-center font-semibold leading-tight" style={{color:"var(--sz-navy)"}}>{city.name}</span>
      <span className="text-[8px] font-medium" style={{color:"var(--sz-warm-gray)"}}>Stamped</span>
    </div>
  )
}

// ── 대륙 섹션 ─────────────────────────────────────────────────
function ContinentSection({ continent, completedCount }: { continent: Continent; completedCount: number }) {
  const citiesInC = CITIES.filter(c => c.continent === continent)
  const stampedInC = citiesInC.filter(c => getCityStatus(c.index, completedCount) === 'stamped').length
  const arrivedInC = citiesInC.some(c => getCityStatus(c.index, completedCount) === 'arrived')
  const nextInC = citiesInC.some(c => getCityStatus(c.index, completedCount) === 'next')
  const hasActivity = stampedInC > 0 || arrivedInC || nextInC
  if (!hasActivity) return null

  return (
    <div className="sz-card rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b" style={{borderColor:"var(--sz-beige)"}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{CONTINENT_EMOJI[continent]}</span>
            <div>
              <p className="text-sm font-bold" style={{color:"var(--sz-navy)"}}>{continent}</p>
              <p className="text-xs" style={{color:"var(--sz-warm-gray)"}}>{CONTINENT_LABELS[continent]}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold" style={{color:"var(--sz-navy)"}}>{stampedInC}<span className="text-gray-300 font-normal"> / {citiesInC.length}</span></p>
            <div className="w-14 h-1 bg-gray-100 rounded-full mt-1 ml-auto">
              <div className="h-full rounded-full" style={{backgroundColor:"var(--sz-navy)", width: `${(stampedInC / citiesInC.length) * 100}%`}} />
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2">
        {citiesInC.map(city => (
          <StampCard key={city.index} cityIndex={city.index} completedCount={completedCount} />
        ))}
      </div>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function PassportPage() {
  const { selectedStudentId: studentId } = usePortalStudent()
  const { data, isLoading } = useGrowthReport(studentId)
  const [activeContinent, setActiveContinent] = useState<Continent | 'all'>('all')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full animate-spin" style={{border: '2px solid var(--sz-blue-soft)', borderTopColor: 'transparent'}} />
      </div>
    )
  }

  const completedCount = data?.totalClasses ?? 0
  const stampedCities = getStampedCities(completedCount)
  const currentCity = getCurrentCity(completedCount)
  const progressInCity = classesInCurrentCity(completedCount)
  const isArrived = progressInCity === 1
  const totalStamped = stampedCities.length

  return (
    <div className="max-w-lg mx-auto px-4 py-5 pb-24 space-y-4">

      {/* 여권 헤더 */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{background:"linear-gradient(145deg, var(--sz-navy) 0%, #0F1A35 100%)"}}>
        <div className="absolute inset-0 opacity-5 text-[80px] flex items-center justify-end pr-4">🌍</div>
        <div className="relative">
          <p className="text-[10px] font-medium tracking-widest uppercase" style={{color:"var(--sz-gold)"}}>Syzhlin Class · English World Passport</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">{totalStamped}</p>
              <p className="text-xs mt-0.5" style={{color:"var(--sz-gold-light)"}}>완성된 도시 스탬프</p>
              <p className="text-xs mt-0.5" style={{color:"rgba(250,248,243,0.5)"}}>Travel Log · {completedCount} lessons</p>
            </div>
            <div className="text-right space-y-1">
              {currentCity && (
                <div className="text-right px-3 py-2 rounded-xl" style={{backgroundColor: isArrived ? 'rgba(196,152,42,0.2)' : 'rgba(255,255,255,0.08)'}}>
                  <p className="text-xs font-bold">{currentCity.name} {currentCity.landmark}</p>
                  <p className="text-[10px]" style={{color: isArrived ? 'var(--sz-gold)' : 'rgba(250,248,243,0.5)'}}>
                    {isArrived ? '도착 완료 · 1/2' : '다음 도시 · 0/2'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 전체 진행 바 (120도시 × 2 = 240 수업 기준) */}
          <div className="mt-4">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{backgroundColor:"rgba(255,255,255,0.1)"}}>
              <div
                className="h-full rounded-full transition-all"
                style={{background:"linear-gradient(to right, var(--sz-gold), #E8C56A)", width: `${Math.min(100, (completedCount / 240) * 100)}%`}}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px]" style={{color:"rgba(250,248,243,0.4)"}}>
              <span>출발</span><span>20도시</span><span>50도시</span><span>90도시</span><span>120도시</span>
            </div>
          </div>
        </div>
      </div>

      {/* 현재 도시 카드 */}
      {currentCity && (
        <div className="rounded-2xl p-4 border" style={{
          backgroundColor: isArrived ? 'var(--sz-gold-light)' : 'var(--sz-paper)',
          borderColor: isArrived ? 'var(--sz-gold)' : 'var(--sz-beige)',
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold" style={{color: isArrived ? 'var(--sz-gold)' : 'var(--sz-warm-gray)'}}>
                {isArrived ? '현재 머무는 도시' : '다음 도시'}
              </p>
              <p className="text-lg font-bold mt-0.5" style={{color:"var(--sz-navy)"}}>{currentCity.name}</p>
              <p className="text-xs" style={{color:"var(--sz-warm-gray)"}}>{currentCity.country} · {currentCity.landmark}</p>
            </div>
            <div className="text-right">
              {/* 2칸 진행 표시 */}
              <div className="flex gap-1.5 justify-end mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{backgroundColor: progressInCity >= 1 ? 'var(--sz-gold)' : 'var(--sz-beige)', color: progressInCity >= 1 ? 'white' : 'var(--sz-warm-gray)'}}>
                  {progressInCity >= 1 ? '✓' : '1'}
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{backgroundColor: progressInCity >= 2 ? 'var(--sz-navy)' : 'var(--sz-beige)', color: progressInCity >= 2 ? 'white' : 'var(--sz-warm-gray)'}}>
                  {progressInCity >= 2 ? '✓' : '2'}
                </div>
              </div>
              <p className="text-xs font-medium" style={{color: isArrived ? 'var(--sz-gold)' : 'var(--sz-warm-gray)'}}>
                {progressInCity}/2 수업
              </p>
            </div>
          </div>

          <p className="text-xs mt-2" style={{color: isArrived ? 'var(--sz-gold)' : 'var(--sz-warm-gray)'}}>
            {isArrived
              ? `다음 수업을 마치면 ${currentCity.name} 스탬프가 완성돼요.`
              : `수업 2회를 마치면 ${currentCity.name} 스탬프가 완성돼요.`}
          </p>

          {currentCity.description && (
            <p className="text-[11px] mt-2 pt-2 border-t" style={{color:"var(--sz-warm-gray)",borderColor:"var(--sz-beige)"}}>
              {currentCity.description}
            </p>
          )}
        </div>
      )}

      {/* 최근 스탬프 */}
      {stampedCities.length > 0 && (
        <div className="sz-card rounded-2xl p-4">
          <p className="text-xs font-semibold mb-3" style={{color:"var(--sz-warm-gray)"}}>최근 완성한 스탬프</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[...stampedCities].reverse().slice(0, 10).map(city => (
              <div key={city.index} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-xl border flex items-center justify-center text-xl" style={{backgroundColor:"var(--sz-cream)",borderColor:"var(--sz-beige)"}}>
                  {city.landmark}
                </div>
                <p className="text-[9px] font-medium text-center leading-tight max-w-[48px]" style={{color:"var(--sz-warm-gray)"}}>{city.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대륙 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button onClick={() => setActiveContinent('all')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeContinent === 'all' ? 'sz-btn-navy' : ''}`}>
          전체
        </button>
        {CONTINENTS.map(c => {
          const count = getStampedCities(completedCount).filter(s => s.continent === c).length
          return (
            <button key={c} onClick={() => setActiveContinent(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${activeContinent === c ? 'sz-btn-navy' : ''}`}>
              {CONTINENT_EMOJI[c]}{count > 0 ? ` ${count}` : ''}
            </button>
          )
        })}
      </div>

      {/* 첫 수업 전 안내 */}
      {completedCount === 0 && (
        <div className="sz-card rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">✈️</p>
          <p className="font-semibold" style={{color:"var(--sz-navy)"}}>첫 수업을 기다리고 있어요</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            수업 2회를 마치면 첫 번째 도시 스탬프가 찍혀요.<br/>
            한 도시에 머무르며 두 번의 수업을 완료해 보세요!
          </p>
          {currentCity && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-3">
              <p className="text-sm font-medium" style={{color:"var(--sz-navy)"}}>
                첫 번째 도시: {currentCity.name} {currentCity.landmark}
              </p>
              <p className="text-xs text-indigo-400 mt-0.5">{currentCity.description}</p>
            </div>
          )}
        </div>
      )}

      {/* 대륙별 스탬프 페이지 */}
      {(activeContinent === 'all' ? CONTINENTS : [activeContinent]).map(continent => (
        <ContinentSection key={continent} continent={continent} completedCount={completedCount} />
      ))}

      {/* 미방문 대륙 */}
      {activeContinent === 'all' && (() => {
        const unvisited = CONTINENTS.filter(c => {
          const citiesInC = CITIES.filter(x => x.continent === c)
          return !citiesInC.some(x => getCityStatus(x.index, completedCount) !== 'locked')
        })
        if (unvisited.length === 0) return null
        return (
          <div className="sz-card rounded-2xl p-4">
            <p className="text-xs font-semibold mb-3" style={{color:"var(--sz-warm-gray)"}}>앞으로 방문할 대륙</p>
            <div className="flex flex-wrap gap-2">
              {unvisited.map(c => (
                <div key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{backgroundColor:"var(--sz-cream)"}}>
                  <span className="text-sm">{CONTINENT_EMOJI[c]}</span>
                  <span className="text-xs text-gray-400">{CONTINENT_LABELS[c]}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
