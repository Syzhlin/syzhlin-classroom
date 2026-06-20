'use client'

import { useState } from 'react'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { useGrowthReport } from '@/lib/queries/useFeedback'
import {
  CITIES, CONTINENTS, CONTINENT_EMOJI, CONTINENT_LABELS,
  LEVEL_LABELS, getStampedCities, getNextCity,
  type Continent, type City,
} from '@/lib/cities'

function StampCard({ city, stamped, isNext }: { city: City; stamped: boolean; isNext: boolean }) {
  const stampedOn = stamped ? city.index + 1 : null

  if (!stamped && !isNext) {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-dashed border-gray-200 opacity-40">
        <span className="text-2xl grayscale">{city.landmark}</span>
        <span className="text-[10px] text-gray-400 text-center leading-tight font-medium">{city.name}</span>
      </div>
    )
  }

  if (isNext) {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 animate-pulse">
        <span className="text-2xl">{city.landmark}</span>
        <span className="text-[10px] text-indigo-500 text-center leading-tight font-semibold">{city.name}</span>
        <span className="text-[9px] text-indigo-400">다음 도시</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
      <div className="relative">
        <span className="text-2xl">{city.landmark}</span>
        <span className="absolute -top-1 -right-1 text-[8px] bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">✓</span>
      </div>
      <span className="text-[10px] text-indigo-700 text-center leading-tight font-semibold">{city.name}</span>
      <span className="text-[9px] text-indigo-400">#{stampedOn}회</span>
    </div>
  )
}

function ContinentPage({
  continent,
  stampedCities,
  nextCity,
  totalInContinent,
}: {
  continent: Continent
  stampedCities: City[]
  nextCity: City | null
  totalInContinent: number
}) {
  const citiesInContinent = CITIES.filter(c => c.continent === continent)
  const stamped = stampedCities.filter(c => c.continent === continent).length
  const isNextContinent = nextCity?.continent === continent

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 대륙 헤더 */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{CONTINENT_EMOJI[continent]}</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{continent}</p>
              <p className="text-xs text-gray-400">{CONTINENT_LABELS[continent]}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-indigo-600">{stamped}<span className="text-gray-300 font-normal"> / {citiesInContinent.length}</span></p>
            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(stamped / citiesInContinent.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 도시 그리드 */}
      <div className="p-3 grid grid-cols-4 gap-2">
        {citiesInContinent.map(city => (
          <StampCard
            key={city.index}
            city={city}
            stamped={city.index < stampedCities.length + (stampedCities.some(s => s.continent === continent) ? 0 : 0)}
            isNext={nextCity?.index === city.index}
          />
        ))}
      </div>
    </div>
  )
}

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
  const nextCity = getNextCity(completedCount)
  const totalStamped = stampedCities.length

  const displayContinents = activeContinent === 'all'
    ? CONTINENTS.filter(c => {
        const citiesInC = CITIES.filter(x => x.continent === c)
        const stampedInC = stampedCities.filter(x => x.continent === c)
        const nextInC = nextCity?.continent === c
        return stampedInC.length > 0 || nextInC
      })
    : [activeContinent]

  const showAllContinents = activeContinent !== 'all' ||
    CONTINENTS.some(c => stampedCities.some(s => s.continent === c))

  return (
    <div className="max-w-lg mx-auto px-4 py-5 pb-24 space-y-4">
      {/* 여권 헤더 */}
      <div className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-4 text-6xl">🌍</div>
          <div className="absolute bottom-2 left-4 text-4xl">✈️</div>
        </div>
        <div className="relative">
          <p className="text-xs text-indigo-300 font-medium tracking-widest uppercase">Syzhlin Class</p>
          <h1 className="text-xl font-bold mt-1">영어 세계 여권</h1>
          <p className="text-indigo-200 text-xs mt-0.5">English World Passport</p>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">{totalStamped}</p>
              <p className="text-indigo-300 text-xs">도시 스탬프</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-indigo-100">{completedCount}회 수업 완료</p>
              {nextCity && (
                <p className="text-xs text-indigo-300 mt-0.5">
                  다음: {nextCity.name} {nextCity.landmark}
                </p>
              )}
              {completedCount >= 120 && (
                <p className="text-xs text-yellow-300 mt-0.5">🏆 마스터 완성!</p>
              )}
            </div>
          </div>

          {/* 레벨 진행 바 */}
          <div className="mt-4">
            <div className="w-full h-1.5 bg-indigo-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-300 to-violet-300 rounded-full transition-all"
                style={{ width: `${Math.min(100, (completedCount / 120) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[9px] text-indigo-400">0</p>
              <p className="text-[9px] text-indigo-400">20</p>
              <p className="text-[9px] text-indigo-400">50</p>
              <p className="text-[9px] text-indigo-400">90</p>
              <p className="text-[9px] text-indigo-400">120</p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 스탬프 */}
      {stampedCities.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">최근 받은 스탬프</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[...stampedCities].reverse().slice(0, 8).map(city => (
              <div key={city.index} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-2xl">
                  {city.landmark}
                </div>
                <p className="text-[9px] text-gray-600 font-medium text-center leading-tight max-w-12">{city.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대륙 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setActiveContinent('all')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            activeContinent === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          전체
        </button>
        {CONTINENTS.map(c => {
          const count = stampedCities.filter(s => s.continent === c).length
          return (
            <button
              key={c}
              onClick={() => setActiveContinent(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeContinent === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {CONTINENT_EMOJI[c]} {count > 0 ? count : ''}
            </button>
          )
        })}
      </div>

      {/* 도시 없을 때 */}
      {completedCount === 0 && activeContinent === 'all' && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <p className="text-4xl mb-3">✈️</p>
          <p className="font-semibold text-gray-800">첫 수업을 기다리고 있어요</p>
          <p className="text-sm text-gray-400 mt-1">수업 1회를 완료하면 첫 도시 스탬프가 찍혀요!</p>
          {nextCity && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-3">
              <p className="text-sm text-indigo-600 font-medium">
                첫 번째 도시: {nextCity.name} {nextCity.landmark}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 대륙별 페이지 */}
      {(activeContinent === 'all' ? CONTINENTS : [activeContinent]).map(continent => {
        const citiesInC = CITIES.filter(c => c.continent === continent)
        const stampedInC = stampedCities.filter(c => c.continent === continent)
        const nextInC = nextCity?.continent === continent
        // 아직 방문 안 한 대륙 + 'all' 보기일 때는 숨김
        if (activeContinent === 'all' && stampedInC.length === 0 && !nextInC) return null
        return (
          <ContinentPage
            key={continent}
            continent={continent}
            stampedCities={stampedCities}
            nextCity={nextCity}
            totalInContinent={citiesInC.length}
          />
        )
      })}

      {/* 아직 방문 안 한 대륙 미리보기 (all 뷰에서) */}
      {activeContinent === 'all' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 mb-3">앞으로 방문할 대륙</p>
          <div className="flex flex-wrap gap-2">
            {CONTINENTS.filter(c => {
              const stampedInC = stampedCities.filter(s => s.continent === c)
              const nextInC = nextCity?.continent === c
              return stampedInC.length === 0 && !nextInC
            }).map(c => (
              <div key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
                <span className="text-sm">{CONTINENT_EMOJI[c]}</span>
                <span className="text-xs text-gray-400">{CONTINENT_LABELS[c]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
