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
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-dashed border-gray-100">
        <span className="text-xl opacity-20">{city.landmark}</span>
        <span className="text-[9px] text-gray-200 text-center font-medium">{city.name}</span>
      </div>
    )
  }

  if (status === 'next') {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/60">
        <span className="text-xl">{city.landmark}</span>
        <span className="text-[9px] text-indigo-400 text-center font-medium leading-tight">{city.name}</span>
        <span className="text-[8px] text-indigo-300">다음 도시</span>
      </div>
    )
  }

  if (status === 'arrived') {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-amber-200 bg-amber-50">
        <div className="relative">
          <span className="text-xl opacity-70">{city.landmark}</span>
          <span className="absolute -top-1 -right-2 text-[8px] bg-amber-400 text-white rounded-full px-1 py-0.5 font-bold">1/2</span>
        </div>
        <span className="text-[9px] text-amber-700 text-center font-semibold leading-tight">{city.name}</span>
        <span className="text-[8px] text-amber-400">Arrived</span>
      </div>
    )
  }

  // stamped
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
      <div className="relative">
        <span className="text-xl">{city.landmark}</span>
        <span className="absolute -top-1 -right-1.5 text-[8px] bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">✓</span>
      </div>
      <span className="text-[9px] text-indigo-700 text-center font-semibold leading-tight">{city.name}</span>
      <span className="text-[8px] text-indigo-300">Stamped</span>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{CONTINENT_EMOJI[continent]}</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{continent}</p>
              <p className="text-xs text-gray-400">{CONTINENT_LABELS[continent]}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-indigo-600">{stampedInC}<span className="text-gray-300 font-normal"> / {citiesInC.length}</span></p>
            <div className="w-14 h-1 bg-gray-100 rounded-full mt-1 ml-auto">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(stampedInC / citiesInC.length) * 100}%` }} />
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
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
      <div className="bg-gradient-to-br from-indigo-800 to-violet-900 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-[80px] flex items-center justify-end pr-4">🌍</div>
        <div className="relative">
          <p className="text-[10px] text-indigo-300 font-medium tracking-widest uppercase">Syzhlin Class · English World Passport</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">{totalStamped}</p>
              <p className="text-xs text-indigo-300 mt-0.5">완성된 도시 스탬프</p>
              <p className="text-xs text-indigo-400 mt-0.5">{completedCount}회 수업 완료</p>
            </div>
            <div className="text-right space-y-1">
              {currentCity && (
                <div className={`text-right px-3 py-2 rounded-xl ${isArrived ? 'bg-amber-400/20' : 'bg-white/10'}`}>
                  <p className="text-xs font-bold">{currentCity.name} {currentCity.landmark}</p>
                  <p className={`text-[10px] ${isArrived ? 'text-amber-300' : 'text-indigo-300'}`}>
                    {isArrived ? '도착 완료 · 1/2' : '다음 도시 · 0/2'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 전체 진행 바 (240회 기준) */}
          <div className="mt-4">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-300 to-violet-300 rounded-full transition-all"
                style={{ width: `${Math.min(100, (completedCount / 240) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-indigo-500">
              <span>시작</span><span>40회</span><span>100회</span><span>180회</span><span>240회</span>
            </div>
          </div>
        </div>
      </div>

      {/* 현재 도시 카드 */}
      {currentCity && (
        <div className={`rounded-2xl p-4 border ${isArrived ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${isArrived ? 'text-amber-500' : 'text-indigo-400'}`}>
                {isArrived ? '현재 머무는 도시' : '다음 도시'}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{currentCity.name}</p>
              <p className="text-xs text-gray-400">{currentCity.country} · {currentCity.landmark}</p>
            </div>
            <div className="text-right">
              {/* 2칸 진행 표시 */}
              <div className="flex gap-1.5 justify-end mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${progressInCity >= 1 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-300'}`}>
                  {progressInCity >= 1 ? '✓' : '1'}
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${progressInCity >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                  {progressInCity >= 2 ? '✓' : '2'}
                </div>
              </div>
              <p className={`text-xs font-medium ${isArrived ? 'text-amber-600' : 'text-indigo-400'}`}>
                {progressInCity}/2 수업
              </p>
            </div>
          </div>

          <p className={`text-xs mt-2 ${isArrived ? 'text-amber-600' : 'text-indigo-500'}`}>
            {isArrived
              ? `다음 수업을 마치면 ${currentCity.name} 스탬프가 완성돼요.`
              : `수업 2회를 마치면 ${currentCity.name} 스탬프가 완성돼요.`}
          </p>

          {currentCity.description && (
            <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
              {currentCity.description}
            </p>
          )}
        </div>
      )}

      {/* 최근 스탬프 */}
      {stampedCities.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">최근 완성한 스탬프</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[...stampedCities].reverse().slice(0, 10).map(city => (
              <div key={city.index} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-xl">
                  {city.landmark}
                </div>
                <p className="text-[9px] text-gray-500 font-medium text-center leading-tight max-w-[48px]">{city.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대륙 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button onClick={() => setActiveContinent('all')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeContinent === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
          전체
        </button>
        {CONTINENTS.map(c => {
          const count = getStampedCities(completedCount).filter(s => s.continent === c).length
          return (
            <button key={c} onClick={() => setActiveContinent(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${activeContinent === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {CONTINENT_EMOJI[c]}{count > 0 ? ` ${count}` : ''}
            </button>
          )
        })}
      </div>

      {/* 첫 수업 전 안내 */}
      {completedCount === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <p className="text-4xl mb-3">✈️</p>
          <p className="font-semibold text-gray-800">첫 수업을 기다리고 있어요</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            수업 2회를 마치면 첫 번째 도시 스탬프가 찍혀요.<br/>
            한 도시에 머무르며 두 번의 수업을 완료해 보세요!
          </p>
          {currentCity && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-3">
              <p className="text-sm text-indigo-600 font-medium">
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
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-3">앞으로 방문할 대륙</p>
            <div className="flex flex-wrap gap-2">
              {unvisited.map(c => (
                <div key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
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
