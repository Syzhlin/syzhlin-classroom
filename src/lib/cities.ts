// 120개 도시 데이터 — 수업 1회 = 도시 스탬프 1개
// index 순서대로 순차 부여 (0번부터)

export type City = {
  index: number
  name: string
  continent: Continent
  level: Level
  landmark: string
  country: string
}

export type Continent =
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America'
  | 'Africa'
  | 'Special English Cities'

export type Level =
  | 'First Passport'
  | 'World Traveler'
  | 'Deep Explorer'
  | 'Master Passport'

export const CONTINENT_LABELS: Record<Continent, string> = {
  'Asia': '아시아',
  'Europe': '유럽',
  'North America': '북아메리카',
  'Oceania': '오세아니아',
  'South America': '남아메리카',
  'Africa': '아프리카',
  'Special English Cities': '영어의 도시',
}

export const CONTINENT_EMOJI: Record<Continent, string> = {
  'Asia': '🌏',
  'Europe': '🏰',
  'North America': '🗽',
  'Oceania': '🦘',
  'South America': '🌿',
  'Africa': '🌍',
  'Special English Cities': '📚',
}

export const LEVEL_LABELS: Record<Level, string> = {
  'First Passport': '첫 번째 여권',
  'World Traveler': '세계 여행자',
  'Deep Explorer': '탐험가',
  'Master Passport': '마스터',
}

export const CITIES: City[] = [
  { index: 0,  name: 'Seoul',             continent: 'Asia',                   level: 'First Passport',  landmark: '🏯', country: '한국' },
  { index: 1,  name: 'Tokyo',             continent: 'Asia',                   level: 'First Passport',  landmark: '🗼', country: '일본' },
  { index: 2,  name: 'London',            continent: 'Europe',                 level: 'First Passport',  landmark: '🎡', country: '영국' },
  { index: 3,  name: 'Paris',             continent: 'Europe',                 level: 'First Passport',  landmark: '🗼', country: '프랑스' },
  { index: 4,  name: 'New York',          continent: 'North America',          level: 'First Passport',  landmark: '🗽', country: '미국' },
  { index: 5,  name: 'Sydney',            continent: 'Oceania',                level: 'First Passport',  landmark: '🦘', country: '호주' },
  { index: 6,  name: 'Singapore',         continent: 'Asia',                   level: 'First Passport',  landmark: '🦁', country: '싱가포르' },
  { index: 7,  name: 'Vancouver',         continent: 'North America',          level: 'First Passport',  landmark: '🍁', country: '캐나다' },
  { index: 8,  name: 'Rome',              continent: 'Europe',                 level: 'First Passport',  landmark: '🏛️', country: '이탈리아' },
  { index: 9,  name: 'Honolulu',          continent: 'North America',          level: 'First Passport',  landmark: '🌺', country: '미국' },
  { index: 10, name: 'Hong Kong',         continent: 'Asia',                   level: 'First Passport',  landmark: '🌃', country: '홍콩' },
  { index: 11, name: 'Dubai',             continent: 'Asia',                   level: 'First Passport',  landmark: '🏙️', country: 'UAE' },
  { index: 12, name: 'Bangkok',           continent: 'Asia',                   level: 'First Passport',  landmark: '🛕', country: '태국' },
  { index: 13, name: 'Taipei',            continent: 'Asia',                   level: 'First Passport',  landmark: '🏙️', country: '대만' },
  { index: 14, name: 'Toronto',           continent: 'North America',          level: 'First Passport',  landmark: '🍁', country: '캐나다' },
  { index: 15, name: 'Berlin',            continent: 'Europe',                 level: 'First Passport',  landmark: '🐻', country: '독일' },
  { index: 16, name: 'Barcelona',         continent: 'Europe',                 level: 'First Passport',  landmark: '🏖️', country: '스페인' },
  { index: 17, name: 'Los Angeles',       continent: 'North America',          level: 'First Passport',  landmark: '🎬', country: '미국' },
  { index: 18, name: 'Melbourne',         continent: 'Oceania',                level: 'First Passport',  landmark: '🏟️', country: '호주' },
  { index: 19, name: 'Istanbul',          continent: 'Asia',                   level: 'First Passport',  landmark: '🕌', country: '튀르키예' },
  { index: 20, name: 'Amsterdam',         continent: 'Europe',                 level: 'World Traveler',  landmark: '🌷', country: '네덜란드' },
  { index: 21, name: 'Vienna',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🎼', country: '오스트리아' },
  { index: 22, name: 'Prague',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🏰', country: '체코' },
  { index: 23, name: 'San Francisco',     continent: 'North America',          level: 'World Traveler',  landmark: '🌉', country: '미국' },
  { index: 24, name: 'Boston',            continent: 'North America',          level: 'World Traveler',  landmark: '🦞', country: '미국' },
  { index: 25, name: 'Dublin',            continent: 'Europe',                 level: 'World Traveler',  landmark: '☘️', country: '아일랜드' },
  { index: 26, name: 'Zurich',            continent: 'Europe',                 level: 'World Traveler',  landmark: '⛰️', country: '스위스' },
  { index: 27, name: 'Copenhagen',        continent: 'Europe',                 level: 'World Traveler',  landmark: '🧜', country: '덴마크' },
  { index: 28, name: 'Osaka',             continent: 'Asia',                   level: 'World Traveler',  landmark: '🏯', country: '일본' },
  { index: 29, name: 'Shanghai',          continent: 'Asia',                   level: 'World Traveler',  landmark: '🌆', country: '중국' },
  { index: 30, name: 'Mumbai',            continent: 'Asia',                   level: 'World Traveler',  landmark: '🎬', country: '인도' },
  { index: 31, name: 'Busan',             continent: 'Asia',                   level: 'World Traveler',  landmark: '🌊', country: '한국' },
  { index: 32, name: 'Kuala Lumpur',      continent: 'Asia',                   level: 'World Traveler',  landmark: '🗼', country: '말레이시아' },
  { index: 33, name: 'Bali',              continent: 'Asia',                   level: 'World Traveler',  landmark: '🌺', country: '인도네시아' },
  { index: 34, name: 'Montreal',          continent: 'North America',          level: 'World Traveler',  landmark: '🏔️', country: '캐나다' },
  { index: 35, name: 'Chicago',           continent: 'North America',          level: 'World Traveler',  landmark: '🏙️', country: '미국' },
  { index: 36, name: 'Madrid',            continent: 'Europe',                 level: 'World Traveler',  landmark: '⚽', country: '스페인' },
  { index: 37, name: 'Lisbon',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🚃', country: '포르투갈' },
  { index: 38, name: 'Munich',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🍺', country: '독일' },
  { index: 39, name: 'Florence',          continent: 'Europe',                 level: 'World Traveler',  landmark: '🎨', country: '이탈리아' },
  { index: 40, name: 'Venice',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🚣', country: '이탈리아' },
  { index: 41, name: 'Milan',             continent: 'Europe',                 level: 'World Traveler',  landmark: '👗', country: '이탈리아' },
  { index: 42, name: 'Brussels',          continent: 'Europe',                 level: 'World Traveler',  landmark: '🍫', country: '벨기에' },
  { index: 43, name: 'Stockholm',         continent: 'Europe',                 level: 'World Traveler',  landmark: '👑', country: '스웨덴' },
  { index: 44, name: 'Oslo',              continent: 'Europe',                 level: 'World Traveler',  landmark: '🌌', country: '노르웨이' },
  { index: 45, name: 'Auckland',          continent: 'Oceania',                level: 'World Traveler',  landmark: '⛵', country: '뉴질랜드' },
  { index: 46, name: 'Buenos Aires',      continent: 'South America',          level: 'World Traveler',  landmark: '💃', country: '아르헨티나' },
  { index: 47, name: 'Rio de Janeiro',    continent: 'South America',          level: 'World Traveler',  landmark: '🌆', country: '브라질' },
  { index: 48, name: 'Cape Town',         continent: 'Africa',                 level: 'World Traveler',  landmark: '🏔️', country: '남아프리카' },
  { index: 49, name: 'Cairo',             continent: 'Africa',                 level: 'World Traveler',  landmark: '🏺', country: '이집트' },
  { index: 50, name: 'Edinburgh',         continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🏰', country: '영국' },
  { index: 51, name: 'Budapest',          continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🏛️', country: '헝가리' },
  { index: 52, name: 'Helsinki',          continent: 'Europe',                 level: 'Deep Explorer',   landmark: '⛪', country: '핀란드' },
  { index: 53, name: 'Reykjavik',         continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🌋', country: '아이슬란드' },
  { index: 54, name: 'Kyoto',             continent: 'Asia',                   level: 'Deep Explorer',   landmark: '⛩️', country: '일본' },
  { index: 55, name: 'Queenstown',        continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🏔️', country: '뉴질랜드' },
  { index: 56, name: 'Marrakech',         continent: 'Africa',                 level: 'Deep Explorer',   landmark: '🕌', country: '모로코' },
  { index: 57, name: 'Cusco',             continent: 'South America',          level: 'Deep Explorer',   landmark: '🏔️', country: '페루' },
  { index: 58, name: 'Hanoi',             continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🏮', country: '베트남' },
  { index: 59, name: 'Chiang Mai',        continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌸', country: '태국' },
  { index: 60, name: 'New Delhi',         continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🕌', country: '인도' },
  { index: 61, name: 'Abu Dhabi',         continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🕌', country: 'UAE' },
  { index: 62, name: 'Ho Chi Minh City',  continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🛵', country: '베트남' },
  { index: 63, name: 'Manila',            continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌺', country: '필리핀' },
  { index: 64, name: 'Jakarta',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌴', country: '인도네시아' },
  { index: 65, name: 'Sapporo',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '❄️', country: '일본' },
  { index: 66, name: 'Fukuoka',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🍜', country: '일본' },
  { index: 67, name: 'Beijing',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🏯', country: '중국' },
  { index: 68, name: 'Jeju',              continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌊', country: '한국' },
  { index: 69, name: 'Seattle',           continent: 'North America',          level: 'Deep Explorer',   landmark: '☕', country: '미국' },
  { index: 70, name: 'Washington D.C.',   continent: 'North America',          level: 'Deep Explorer',   landmark: '🏛️', country: '미국' },
  { index: 71, name: 'Miami',             continent: 'North America',          level: 'Deep Explorer',   landmark: '🌴', country: '미국' },
  { index: 72, name: 'Austin',            continent: 'North America',          level: 'Deep Explorer',   landmark: '🎸', country: '미국' },
  { index: 73, name: 'Denver',            continent: 'North America',          level: 'Deep Explorer',   landmark: '⛰️', country: '미국' },
  { index: 74, name: 'Quebec City',       continent: 'North America',          level: 'Deep Explorer',   landmark: '🏰', country: '캐나다' },
  { index: 75, name: 'Brisbane',          continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🌞', country: '호주' },
  { index: 76, name: 'Perth',             continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🌅', country: '호주' },
  { index: 77, name: 'Wellington',        continent: 'Oceania',                level: 'Deep Explorer',   landmark: '💨', country: '뉴질랜드' },
  { index: 78, name: 'Christchurch',      continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🌺', country: '뉴질랜드' },
  { index: 79, name: 'São Paulo',         continent: 'South America',          level: 'Deep Explorer',   landmark: '🌆', country: '브라질' },
  { index: 80, name: 'Santiago',          continent: 'South America',          level: 'Deep Explorer',   landmark: '🏔️', country: '칠레' },
  { index: 81, name: 'Lima',              continent: 'South America',          level: 'Deep Explorer',   landmark: '🦙', country: '페루' },
  { index: 82, name: 'Bogotá',            continent: 'South America',          level: 'Deep Explorer',   landmark: '☕', country: '콜롬비아' },
  { index: 83, name: 'Medellín',          continent: 'South America',          level: 'Deep Explorer',   landmark: '🌺', country: '콜롬비아' },
  { index: 84, name: 'Johannesburg',      continent: 'Africa',                 level: 'Deep Explorer',   landmark: '💎', country: '남아프리카' },
  { index: 85, name: 'Nairobi',           continent: 'Africa',                 level: 'Deep Explorer',   landmark: '🦁', country: '케냐' },
  { index: 86, name: 'Casablanca',        continent: 'Africa',                 level: 'Deep Explorer',   landmark: '🕌', country: '모로코' },
  { index: 87, name: 'Nice',              continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🌊', country: '프랑스' },
  { index: 88, name: 'Lyon',              continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🍷', country: '프랑스' },
  { index: 89, name: 'Porto',             continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🍷', country: '포르투갈' },
  { index: 90, name: 'Oxford',            continent: 'Special English Cities', level: 'Master Passport', landmark: '📖', country: '영국' },
  { index: 91, name: 'Cambridge',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🎓', country: '영국' },
  { index: 92, name: 'Princeton',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🏛️', country: '미국' },
  { index: 93, name: 'New Haven',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🎓', country: '미국' },
  { index: 94, name: 'Berkeley',          continent: 'Special English Cities', level: 'Master Passport', landmark: '🐻', country: '미국' },
  { index: 95, name: 'Palo Alto',         continent: 'Special English Cities', level: 'Master Passport', landmark: '💡', country: '미국' },
  { index: 96, name: 'Stratford-upon-Avon', continent: 'Special English Cities', level: 'Master Passport', landmark: '🎭', country: '영국' },
  { index: 97, name: 'Bath',              continent: 'Special English Cities', level: 'Master Passport', landmark: '🛁', country: '영국' },
  { index: 98, name: 'St Andrews',        continent: 'Special English Cities', level: 'Master Passport', landmark: '⛳', country: '영국' },
  { index: 99, name: 'Greenwich',         continent: 'Special English Cities', level: 'Master Passport', landmark: '⏱️', country: '영국' },
  { index: 100,name: 'Cambridge MA',      continent: 'Special English Cities', level: 'Master Passport', landmark: '🔬', country: '미국' },
  { index: 101,name: 'Manchester',        continent: 'Special English Cities', level: 'Master Passport', landmark: '⚽', country: '영국' },
  { index: 102,name: 'Liverpool',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🎸', country: '영국' },
  { index: 103,name: 'Bristol',           continent: 'Special English Cities', level: 'Master Passport', landmark: '🌉', country: '영국' },
  { index: 104,name: 'Canterbury',        continent: 'Special English Cities', level: 'Master Passport', landmark: '⛪', country: '영국' },
  { index: 105,name: 'Brighton',          continent: 'Special English Cities', level: 'Master Passport', landmark: '🎡', country: '영국' },
  { index: 106,name: 'Belfast',           continent: 'Special English Cities', level: 'Master Passport', landmark: '🚢', country: '영국' },
  { index: 107,name: 'Galway',            continent: 'Special English Cities', level: 'Master Passport', landmark: '☘️', country: '아일랜드' },
  { index: 108,name: 'Cork',              continent: 'Special English Cities', level: 'Master Passport', landmark: '🏰', country: '아일랜드' },
  { index: 109,name: 'Cardiff',           continent: 'Special English Cities', level: 'Master Passport', landmark: '🏴', country: '영국' },
  { index: 110,name: 'Warsaw',            continent: 'Europe',                 level: 'Master Passport', landmark: '🦅', country: '폴란드' },
  { index: 111,name: 'Athens',            continent: 'Europe',                 level: 'Master Passport', landmark: '🏛️', country: '그리스' },
  { index: 112,name: 'Salzburg',          continent: 'Europe',                 level: 'Master Passport', landmark: '🎼', country: '오스트리아' },
  { index: 113,name: 'Geneva',            continent: 'Europe',                 level: 'Master Passport', landmark: '⌚', country: '스위스' },
  { index: 114,name: 'Rotterdam',         continent: 'Europe',                 level: 'Master Passport', landmark: '⚓', country: '네덜란드' },
  { index: 115,name: 'Addis Ababa',       continent: 'Africa',                 level: 'Master Passport', landmark: '☕', country: '에티오피아' },
  { index: 116,name: 'Zanzibar',          continent: 'Africa',                 level: 'Master Passport', landmark: '🌴', country: '탄자니아' },
  { index: 117,name: 'Tunis',             continent: 'Africa',                 level: 'Master Passport', landmark: '🏺', country: '튀니지' },
  { index: 118,name: 'Quito',             continent: 'South America',          level: 'Master Passport', landmark: '🌋', country: '에콰도르' },
  { index: 119,name: 'Montevideo',        continent: 'South America',          level: 'Master Passport', landmark: '🌅', country: '우루과이' },
]

export function getStampedCities(completedCount: number): City[] {
  return CITIES.filter(c => c.index < completedCount)
}

export function getNextCity(completedCount: number): City | null {
  return CITIES.find(c => c.index === completedCount) ?? null
}

export const CONTINENTS: Continent[] = [
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
  'Africa',
  'Special English Cities',
]
