// 120개 도시 — 수업 2회 = 도시 스탬프 1개
// cityIndex 0번부터 순서대로 배치
// 완료 수업 수(completedCount) 기준:
//   - completedCount % 2 === 1 : 현재 도시에 Arrived (1/2)
//   - completedCount % 2 === 0 : 현재 도시 대기 or 이전 도시 Stamped (2/2)

// 여권 스탬프 카운트 기준일. 이 날짜(포함) 이후 완료된 수업만 여권에 카운트한다.
// 회차(결제)와 무관하게, 모든 학생이 이 날짜부터 새로 여권을 시작한다.
export const PASSPORT_START_DATE = '2026-06-22'

export type City = {
  index: number
  name: string
  continent: Continent
  level: Level
  landmark: string
  country: string
  description: string  // 도시 정보 한 줄
}

export type CityStatus = 'locked' | 'next' | 'arrived' | 'stamped'

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
  // ── Level 1: First Passport (도시 0–19, 수업 1–40회) ─────────────────
  { index: 0,  name: 'Seoul',             continent: 'Asia',                   level: 'First Passport',  landmark: '🏯', country: '한국',      description: '한강과 남산타워가 있는 대한민국의 수도예요.' },
  { index: 1,  name: 'Tokyo',             continent: 'Asia',                   level: 'First Passport',  landmark: '🗼', country: '일본',      description: 'Tokyo Tower와 벚꽃으로 유명한 일본의 수도예요.' },
  { index: 2,  name: 'London',            continent: 'Europe',                 level: 'First Passport',  landmark: '🎡', country: '영국',      description: 'Big Ben과 버킹엄 궁전이 있는 영국의 수도예요.' },
  { index: 3,  name: 'Paris',             continent: 'Europe',                 level: 'First Passport',  landmark: '🗼', country: '프랑스',    description: 'Eiffel Tower가 있는 낭만적인 프랑스의 수도예요.' },
  { index: 4,  name: 'New York',          continent: 'North America',          level: 'First Passport',  landmark: '🗽', country: '미국',      description: '자유의 여신상과 타임스퀘어로 유명한 미국 최대 도시예요.' },
  { index: 5,  name: 'Sydney',            continent: 'Oceania',                level: 'First Passport',  landmark: '🦘', country: '호주',      description: 'Opera House와 하버 브리지가 있는 호주의 대표 도시예요.' },
  { index: 6,  name: 'Singapore',         continent: 'Asia',                   level: 'First Passport',  landmark: '🦁', country: '싱가포르',  description: '도시 전체가 정원인 아시아의 작은 선진국이에요.' },
  { index: 7,  name: 'Vancouver',         continent: 'North America',          level: 'First Passport',  landmark: '🍁', country: '캐나다',    description: '산과 바다가 함께 있는 캐나다 서부의 아름다운 도시예요.' },
  { index: 8,  name: 'Rome',              continent: 'Europe',                 level: 'First Passport',  landmark: '🏛️', country: '이탈리아',  description: '콜로세움과 바티칸이 있는 이탈리아의 영원한 도시예요.' },
  { index: 9,  name: 'Honolulu',          continent: 'North America',          level: 'First Passport',  landmark: '🌺', country: '미국',      description: '하이비스커스 꽃과 와이키키 해변이 유명한 하와이의 도시예요.' },
  { index: 10, name: 'Hong Kong',         continent: 'Asia',                   level: 'First Passport',  landmark: '🌃', country: '홍콩',      description: '빅토리아 피크에서 보는 야경이 세계 최고로 손꼽히는 도시예요.' },
  { index: 11, name: 'Dubai',             continent: 'Asia',                   level: 'First Passport',  landmark: '🏙️', country: 'UAE',       description: '세계에서 가장 높은 건물 Burj Khalifa가 있는 미래 도시예요.' },
  { index: 12, name: 'Bangkok',           continent: 'Asia',                   level: 'First Passport',  landmark: '🛕', country: '태국',      description: '황금 사원과 왕궁이 가득한 태국의 화려한 수도예요.' },
  { index: 13, name: 'Taipei',            continent: 'Asia',                   level: 'First Passport',  landmark: '🏙️', country: '대만',      description: 'Taipei 101 마천루와 야시장이 유명한 대만의 수도예요.' },
  { index: 14, name: 'Toronto',           continent: 'North America',          level: 'First Passport',  landmark: '🍁', country: '캐나다',    description: 'CN Tower와 다양한 문화가 공존하는 캐나다 최대 도시예요.' },
  { index: 15, name: 'Berlin',            continent: 'Europe',                 level: 'First Passport',  landmark: '🐻', country: '독일',      description: '베를린 장벽의 역사와 예술이 공존하는 독일의 수도예요.' },
  { index: 16, name: 'Barcelona',         continent: 'Europe',                 level: 'First Passport',  landmark: '🏖️', country: '스페인',    description: '가우디 건축과 지중해 해변이 아름다운 스페인의 예술 도시예요.' },
  { index: 17, name: 'Los Angeles',       continent: 'North America',          level: 'First Passport',  landmark: '🎬', country: '미국',      description: 'Hollywood와 세계 영화 산업의 중심지인 미국 서부의 대도시예요.' },
  { index: 18, name: 'Melbourne',         continent: 'Oceania',                level: 'First Passport',  landmark: '🏟️', country: '호주',      description: '카페 문화와 스포츠를 사랑하는 호주의 두 번째 도시예요.' },
  { index: 19, name: 'Istanbul',          continent: 'Asia',                   level: 'First Passport',  landmark: '🕌', country: '튀르키예',  description: '유럽과 아시아에 걸쳐 있는 두 대륙의 교차점이에요.' },

  // ── Level 2: World Traveler (도시 20–49, 수업 41–100회) ──────────────
  { index: 20, name: 'Amsterdam',         continent: 'Europe',                 level: 'World Traveler',  landmark: '🌷', country: '네덜란드',  description: '운하와 튤립, 자전거로 가득한 네덜란드의 수도예요.' },
  { index: 21, name: 'Vienna',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🎼', country: '오스트리아', description: '모차르트와 베토벤이 살았던 클래식 음악의 도시예요.' },
  { index: 22, name: 'Prague',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🏰', country: '체코',      description: '동화 속 같은 중세 건축이 그대로 남아 있는 아름다운 도시예요.' },
  { index: 23, name: 'San Francisco',     continent: 'North America',          level: 'World Traveler',  landmark: '🌉', country: '미국',      description: 'Golden Gate Bridge와 실리콘밸리 옆에 있는 첨단 도시예요.' },
  { index: 24, name: 'Boston',            continent: 'North America',          level: 'World Traveler',  landmark: '🦞', country: '미국',      description: 'Harvard와 MIT가 있는 미국에서 가장 오래된 도시 중 하나예요.' },
  { index: 25, name: 'Dublin',            continent: 'Europe',                 level: 'World Traveler',  landmark: '☘️', country: '아일랜드',  description: '네잎클로버와 기네스 맥주로 유명한 아일랜드의 수도예요.' },
  { index: 26, name: 'Zurich',            continent: 'Europe',                 level: 'World Traveler',  landmark: '⛰️', country: '스위스',    description: '알프스와 호수가 어우러진 세계에서 살기 좋은 도시예요.' },
  { index: 27, name: 'Copenhagen',        continent: 'Europe',                 level: 'World Traveler',  landmark: '🧜', country: '덴마크',    description: '인어공주 동상과 행복 지수가 세계 최고인 덴마크의 수도예요.' },
  { index: 28, name: 'Osaka',             continent: 'Asia',                   level: 'World Traveler',  landmark: '🏯', country: '일본',      description: '타코야키와 오코노미야끼로 유명한 일본의 먹거리 천국이에요.' },
  { index: 29, name: 'Shanghai',          continent: 'Asia',                   level: 'World Traveler',  landmark: '🌆', country: '중국',      description: '동방명주 타워와 황푸강 야경이 아름다운 중국 최대 경제 도시예요.' },
  { index: 30, name: 'Mumbai',            continent: 'Asia',                   level: 'World Traveler',  landmark: '🎬', country: '인도',      description: 'Bollywood 영화 산업의 중심지인 인도 최대 항구 도시예요.' },
  { index: 31, name: 'Busan',             continent: 'Asia',                   level: 'World Traveler',  landmark: '🌊', country: '한국',      description: '해운대 해변과 광안대교가 있는 한국의 아름다운 항구 도시예요.' },
  { index: 32, name: 'Kuala Lumpur',      continent: 'Asia',                   level: 'World Traveler',  landmark: '🗼', country: '말레이시아', description: 'Petronas Twin Towers가 있는 말레이시아의 화려한 수도예요.' },
  { index: 33, name: 'Bali',              continent: 'Asia',                   level: 'World Traveler',  landmark: '🌺', country: '인도네시아', description: '신들의 섬이라 불리는 아름다운 사원과 자연이 가득한 섬이에요.' },
  { index: 34, name: 'Montreal',          continent: 'North America',          level: 'World Traveler',  landmark: '🏔️', country: '캐나다',    description: '프랑스 문화와 영어 문화가 공존하는 캐나다의 문화 도시예요.' },
  { index: 35, name: 'Chicago',           continent: 'North America',          level: 'World Traveler',  landmark: '🏙️', country: '미국',      description: '미시간 호수 옆에 세계 최초 마천루가 세워진 미국 제3의 도시예요.' },
  { index: 36, name: 'Madrid',            continent: 'Europe',                 level: 'World Traveler',  landmark: '⚽', country: '스페인',    description: '프라도 미술관과 Real Madrid가 있는 스페인의 수도예요.' },
  { index: 37, name: 'Lisbon',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🚃', country: '포르투갈',  description: '노란 트램과 파도 모양 타일길이 아름다운 포르투갈의 수도예요.' },
  { index: 38, name: 'Munich',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🍺', country: '독일',      description: '옥토버페스트와 BMW 본사가 있는 독일 남부의 대표 도시예요.' },
  { index: 39, name: 'Florence',          continent: 'Europe',                 level: 'World Traveler',  landmark: '🎨', country: '이탈리아',  description: '르네상스 예술의 중심지로 두오모 성당과 우피치 미술관이 있어요.' },
  { index: 40, name: 'Venice',            continent: 'Europe',                 level: 'World Traveler',  landmark: '🚣', country: '이탈리아',  description: '운하 위에 세워진 세상에서 하나뿐인 물 위의 도시예요.' },
  { index: 41, name: 'Milan',             continent: 'Europe',                 level: 'World Traveler',  landmark: '👗', country: '이탈리아',  description: '세계 패션과 디자인의 중심지로 두오모 대성당이 유명해요.' },
  { index: 42, name: 'Brussels',          continent: 'Europe',                 level: 'World Traveler',  landmark: '🍫', country: '벨기에',    description: '초콜릿과 와플, EU 본부가 있는 유럽의 수도라 불리는 도시예요.' },
  { index: 43, name: 'Stockholm',         continent: 'Europe',                 level: 'World Traveler',  landmark: '👑', country: '스웨덴',    description: '14개 섬 위에 세워진 노벨상 시상식이 열리는 스웨덴의 수도예요.' },
  { index: 44, name: 'Oslo',              continent: 'Europe',                 level: 'World Traveler',  landmark: '🌌', country: '노르웨이',  description: '오로라와 피오르드로 유명한 노르웨이의 아름다운 수도예요.' },
  { index: 45, name: 'Auckland',          continent: 'Oceania',                level: 'World Traveler',  landmark: '⛵', country: '뉴질랜드',  description: '항해의 도시라 불리며 Sky Tower가 있는 뉴질랜드 최대 도시예요.' },
  { index: 46, name: 'Buenos Aires',      continent: 'South America',          level: 'World Traveler',  landmark: '💃', country: '아르헨티나', description: '탱고 댄스와 넓은 대로가 유명한 남미의 파리라 불리는 도시예요.' },
  { index: 47, name: 'Rio de Janeiro',    continent: 'South America',          level: 'World Traveler',  landmark: '🌆', country: '브라질',    description: '예수상과 카니발 축제로 유명한 브라질의 아름다운 해안 도시예요.' },
  { index: 48, name: 'Cape Town',         continent: 'Africa',                 level: 'World Traveler',  landmark: '🏔️', country: '남아프리카', description: '테이블 마운틴 아래 자리 잡은 남아프리카 공화국의 아름다운 도시예요.' },
  { index: 49, name: 'Cairo',             continent: 'Africa',                 level: 'World Traveler',  landmark: '🏺', country: '이집트',    description: '피라미드와 스핑크스가 있는 수천 년 역사의 이집트 수도예요.' },

  // ── Level 3: Deep Explorer (도시 50–89, 수업 101–180회) ──────────────
  { index: 50, name: 'Edinburgh',         continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🏰', country: '영국',      description: '에든버러 성과 해리포터의 배경이 된 스코틀랜드의 수도예요.' },
  { index: 51, name: 'Budapest',          continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🏛️', country: '헝가리',    description: '다뉴브강의 진주라 불리는 야경이 아름다운 헝가리의 수도예요.' },
  { index: 52, name: 'Helsinki',          continent: 'Europe',                 level: 'Deep Explorer',   landmark: '⛪', country: '핀란드',    description: '디자인과 사우나의 나라 핀란드의 수도이자 북유럽의 매력 도시예요.' },
  { index: 53, name: 'Reykjavik',         continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🌋', country: '아이슬란드', description: '오로라와 간헐천, 빙하가 있는 세계 최북단 수도예요.' },
  { index: 54, name: 'Kyoto',             continent: 'Asia',                   level: 'Deep Explorer',   landmark: '⛩️', country: '일본',      description: '붉은 도리이와 금각사, 기온 거리가 있는 일본 전통 문화의 중심지예요.' },
  { index: 55, name: 'Queenstown',        continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🏔️', country: '뉴질랜드',  description: '번지점프 발상지로 눈 덮인 알프스 산맥이 있는 모험의 도시예요.' },
  { index: 56, name: 'Marrakech',         continent: 'Africa',                 level: 'Deep Explorer',   landmark: '🕌', country: '모로코',    description: '붉은 도시라 불리며 화려한 시장 수크와 궁전이 가득한 곳이에요.' },
  { index: 57, name: 'Cusco',             continent: 'South America',          level: 'Deep Explorer',   landmark: '🏔️', country: '페루',      description: '잉카 제국의 옛 수도로 마추픽추로 가는 출발점이에요.' },
  { index: 58, name: 'Hanoi',             continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🏮', country: '베트남',    description: '붉은 등불과 호안끼엠 호수가 아름다운 베트남의 수도예요.' },
  { index: 59, name: 'Chiang Mai',        continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌸', country: '태국',      description: '란나 왕국의 옛 수도로 300개 이상의 사원이 있는 태국 북부 도시예요.' },
  { index: 60, name: 'New Delhi',         continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🕌', country: '인도',      description: '타지마할이 있는 아그라와 가까운 인도 공화국의 수도예요.' },
  { index: 61, name: 'Abu Dhabi',         continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🕌', country: 'UAE',       description: '세계 최대 모스크 Sheikh Zayed Grand Mosque가 있는 UAE의 수도예요.' },
  { index: 62, name: 'Ho Chi Minh City',  continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🛵', country: '베트남',    description: '수백만 오토바이가 달리는 역동적인 베트남 최대 도시예요.' },
  { index: 63, name: 'Manila',            continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌺', country: '필리핀',    description: '7,641개 섬으로 이루어진 필리핀의 수도이자 경제 중심지예요.' },
  { index: 64, name: 'Jakarta',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌴', country: '인도네시아', description: '세계 4위 인구 대국 인도네시아의 수도이자 최대 도시예요.' },
  { index: 65, name: 'Sapporo',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '❄️', country: '일본',      description: '눈 축제와 스키로 유명한 일본 홋카이도의 대표 도시예요.' },
  { index: 66, name: 'Fukuoka',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🍜', country: '일본',      description: '하카타 라멘과 야타이 포장마차 문화로 유명한 일본 규슈의 도시예요.' },
  { index: 67, name: 'Beijing',           continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🏯', country: '중국',      description: '만리장성과 자금성이 있는 3,000년 역사의 중국 수도예요.' },
  { index: 68, name: 'Jeju',              continent: 'Asia',                   level: 'Deep Explorer',   landmark: '🌊', country: '한국',      description: '한라산과 에메랄드 바다, 감귤밭이 있는 한국의 아름다운 섬이에요.' },
  { index: 69, name: 'Seattle',           continent: 'North America',          level: 'Deep Explorer',   landmark: '☕', country: '미국',      description: 'Starbucks 1호점과 Space Needle이 있는 미국 북서부의 커피 도시예요.' },
  { index: 70, name: 'Washington D.C.',   continent: 'North America',          level: 'Deep Explorer',   landmark: '🏛️', country: '미국',      description: '백악관과 스미소니언 박물관이 있는 미국의 수도예요.' },
  { index: 71, name: 'Miami',             continent: 'North America',          level: 'Deep Explorer',   landmark: '🌴', country: '미국',      description: '아르데코 건축과 야자수 해변이 아름다운 미국 플로리다의 선셋 도시예요.' },
  { index: 72, name: 'Austin',            continent: 'North America',          level: 'Deep Explorer',   landmark: '🎸', country: '미국',      description: '라이브 음악의 수도라 불리며 텍사스 주의 주도인 활기찬 도시예요.' },
  { index: 73, name: 'Denver',            continent: 'North America',          level: 'Deep Explorer',   landmark: '⛰️', country: '미국',      description: '로키 산맥 관문에 자리 잡은 해발 1,600m의 마일 하이 시티예요.' },
  { index: 74, name: 'Quebec City',       continent: 'North America',          level: 'Deep Explorer',   landmark: '🏰', country: '캐나다',    description: '북미 유일의 성벽 도시로 프랑스 문화가 살아 있는 캐나다 도시예요.' },
  { index: 75, name: 'Brisbane',          continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🌞', country: '호주',      description: '연간 300일 맑은 날씨의 선샤인 시티, 호주 퀸즐랜드의 주도예요.' },
  { index: 76, name: 'Perth',             continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🌅', country: '호주',      description: '인도양을 마주한 아름다운 석양으로 유명한 호주 서쪽 끝 도시예요.' },
  { index: 77, name: 'Wellington',        continent: 'Oceania',                level: 'Deep Explorer',   landmark: '💨', country: '뉴질랜드',  description: '세계에서 가장 바람이 많이 부는 뉴질랜드의 수도이자 문화 도시예요.' },
  { index: 78, name: 'Christchurch',      continent: 'Oceania',                level: 'Deep Explorer',   landmark: '🌺', country: '뉴질랜드',  description: '정원의 도시라 불리며 영국풍 건축이 아름다운 뉴질랜드 남섬 도시예요.' },
  { index: 79, name: 'São Paulo',         continent: 'South America',          level: 'Deep Explorer',   landmark: '🌆', country: '브라질',    description: '남미 최대의 경제 도시로 다양한 문화가 섞인 브라질의 심장이에요.' },
  { index: 80, name: 'Santiago',          continent: 'South America',          level: 'Deep Explorer',   landmark: '🏔️', country: '칠레',      description: '안데스 산맥을 배경으로 한 칠레의 수도이자 남미 선진 도시예요.' },
  { index: 81, name: 'Lima',              continent: 'South America',          level: 'Deep Explorer',   landmark: '🦙', country: '페루',      description: '잉카 문명의 기억이 남아 있는 태평양 해안의 페루 수도예요.' },
  { index: 82, name: 'Bogotá',            continent: 'South America',          level: 'Deep Explorer',   landmark: '☕', country: '콜롬비아',  description: '세계 최고의 커피 산지 콜롬비아의 해발 2,600m 고원 수도예요.' },
  { index: 83, name: 'Medellín',          continent: 'South America',          level: 'Deep Explorer',   landmark: '🌺', country: '콜롬비아',  description: '꽃의 도시로 불리며 혁신적인 도시 재생으로 유명한 콜롬비아 제2 도시예요.' },
  { index: 84, name: 'Johannesburg',      continent: 'Africa',                 level: 'Deep Explorer',   landmark: '💎', country: '남아프리카', description: '금과 다이아몬드로 성장한 남아프리카공화국의 경제 수도예요.' },
  { index: 85, name: 'Nairobi',           continent: 'Africa',                 level: 'Deep Explorer',   landmark: '🦁', country: '케냐',      description: '사파리 관문 도시로 도심 안에 야생동물 공원이 있는 케냐의 수도예요.' },
  { index: 86, name: 'Casablanca',        continent: 'Africa',                 level: 'Deep Explorer',   landmark: '🕌', country: '모로코',    description: '세계 최대 규모 모스크가 있는 모로코의 경제 중심 해안 도시예요.' },
  { index: 87, name: 'Nice',              continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🌊', country: '프랑스',    description: '코트다쥐르의 보석으로 에메랄드 지중해가 펼쳐지는 프랑스 휴양 도시예요.' },
  { index: 88, name: 'Lyon',              continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🍷', country: '프랑스',    description: '프랑스 미식의 수도로 보졸레 와인과 폴 보퀴즈 요리로 유명해요.' },
  { index: 89, name: 'Porto',             continent: 'Europe',                 level: 'Deep Explorer',   landmark: '🍷', country: '포르투갈',  description: '포트 와인과 아줄레주 타일 건물이 아름다운 포르투갈 제2의 도시예요.' },

  // ── Level 4: Master Passport (도시 90–119, 수업 181–240회) ───────────
  { index: 90, name: 'Oxford',            continent: 'Special English Cities', level: 'Master Passport', landmark: '📖', country: '영국',      description: '800년 역사의 세계 최고 대학이 있는 영국 학문의 도시예요.' },
  { index: 91, name: 'Cambridge',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🎓', country: '영국',      description: 'Newton과 Darwin이 공부한 영국 케임브리지 대학의 도시예요.' },
  { index: 92, name: 'Princeton',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🏛️', country: '미국',      description: 'Einstein이 연구한 아이비리그 Princeton University의 도시예요.' },
  { index: 93, name: 'New Haven',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🎓', country: '미국',      description: '세계 3대 대학 Yale University가 있는 미국 코네티컷의 도시예요.' },
  { index: 94, name: 'Berkeley',          continent: 'Special English Cities', level: 'Master Passport', landmark: '🐻', country: '미국',      description: 'UC Berkeley가 있는 혁신과 자유 정신의 캘리포니아 도시예요.' },
  { index: 95, name: 'Palo Alto',         continent: 'Special English Cities', level: 'Master Passport', landmark: '💡', country: '미국',      description: 'Apple, Google, Stanford가 있는 실리콘밸리의 심장부 도시예요.' },
  { index: 96, name: 'Stratford-upon-Avon', continent: 'Special English Cities', level: 'Master Passport', landmark: '🎭', country: '영국',    description: 'William Shakespeare가 태어난 영국 문학의 성지예요.' },
  { index: 97, name: 'Bath',              continent: 'Special English Cities', level: 'Master Passport', landmark: '🛁', country: '영국',      description: '로마 시대 온천과 조지안 건축이 완벽하게 보존된 영국 세계문화유산 도시예요.' },
  { index: 98, name: 'St Andrews',        continent: 'Special English Cities', level: 'Master Passport', landmark: '⛳', country: '영국',      description: '골프의 발상지이자 스코틀랜드 최고 명문 대학이 있는 역사 도시예요.' },
  { index: 99, name: 'Greenwich',         continent: 'Special English Cities', level: 'Master Passport', landmark: '⏱️', country: '영국',      description: '세계 표준시 기준선이 지나는 영국 런던의 특별한 도시예요.' },
  { index: 100,name: 'Cambridge MA',      continent: 'Special English Cities', level: 'Master Passport', landmark: '🔬', country: '미국',      description: 'Harvard와 MIT가 함께 있는 세계 지식의 중심지 매사추세츠 도시예요.' },
  { index: 101,name: 'Manchester',        continent: 'Special English Cities', level: 'Master Passport', landmark: '⚽', country: '영국',      description: 'Manchester United와 산업혁명의 역사가 있는 영국 북부의 활기찬 도시예요.' },
  { index: 102,name: 'Liverpool',         continent: 'Special English Cities', level: 'Master Passport', landmark: '🎸', country: '영국',      description: 'The Beatles의 고향이자 영국 최대 항구 도시예요.' },
  { index: 103,name: 'Bristol',           continent: 'Special English Cities', level: 'Master Passport', landmark: '🌉', country: '영국',      description: 'Banksy 거리 예술과 현수교가 아름다운 영국 서부의 창의적인 도시예요.' },
  { index: 104,name: 'Canterbury',        continent: 'Special English Cities', level: 'Master Passport', landmark: '⛪', country: '영국',      description: '영국 성공회의 총본산 캔터베리 대성당이 있는 유네스코 문화유산 도시예요.' },
  { index: 105,name: 'Brighton',          continent: 'Special English Cities', level: 'Master Passport', landmark: '🎡', country: '영국',      description: '런던 가까운 바닷가 휴양지로 Royal Pavilion과 피어가 유명한 도시예요.' },
  { index: 106,name: 'Belfast',           continent: 'Special English Cities', level: 'Master Passport', landmark: '🚢', country: '영국',      description: '타이타닉 호가 건조된 도시이자 아일랜드 분쟁 역사를 간직한 북아일랜드 수도예요.' },
  { index: 107,name: 'Galway',            continent: 'Special English Cities', level: 'Master Passport', landmark: '☘️', country: '아일랜드',  description: '아일랜드 전통 음악과 켈트 문화가 가장 잘 살아 있는 서부 해안 도시예요.' },
  { index: 108,name: 'Cork',              continent: 'Special English Cities', level: 'Master Passport', landmark: '🏰', country: '아일랜드',  description: '블라니 성의 말 잘하게 해 주는 돌로 유명한 아일랜드 제2의 도시예요.' },
  { index: 109,name: 'Cardiff',           continent: 'Special English Cities', level: 'Master Passport', landmark: '🏴', country: '영국',      description: '웨일스 국립박물관과 카디프 성이 있는 웨일스의 수도예요.' },
  { index: 110,name: 'Warsaw',            continent: 'Europe',                 level: 'Master Passport', landmark: '🦅', country: '폴란드',    description: '2차 세계대전 폐허에서 완벽하게 재건된 폴란드의 불사조 같은 수도예요.' },
  { index: 111,name: 'Athens',            continent: 'Europe',                 level: 'Master Passport', landmark: '🏛️', country: '그리스',    description: '파르테논 신전과 민주주의의 발상지인 서양 문명의 요람 도시예요.' },
  { index: 112,name: 'Salzburg',          continent: 'Europe',                 level: 'Master Passport', landmark: '🎼', country: '오스트리아', description: 'Mozart의 고향이자 사운드 오브 뮤직 촬영지로 유명한 오스트리아 도시예요.' },
  { index: 113,name: 'Geneva',            continent: 'Europe',                 level: 'Master Passport', landmark: '⌚', country: '스위스',    description: '유엔 유럽본부와 레만 호수가 있는 스위스의 국제 외교 도시예요.' },
  { index: 114,name: 'Rotterdam',         continent: 'Europe',                 level: 'Master Passport', landmark: '⚓', country: '네덜란드',  description: '유럽 최대 항구와 현대 건축의 실험장으로 유명한 네덜란드 도시예요.' },
  { index: 115,name: 'Addis Ababa',       continent: 'Africa',                 level: 'Master Passport', landmark: '☕', country: '에티오피아', description: '커피의 발상지이자 아프리카 연합 본부가 있는 에티오피아의 수도예요.' },
  { index: 116,name: 'Zanzibar',          continent: 'Africa',                 level: 'Master Passport', landmark: '🌴', country: '탄자니아',  description: '인도양의 향신료 섬으로 석양과 산호초가 아름다운 아프리카 낙원이에요.' },
  { index: 117,name: 'Tunis',             continent: 'Africa',                 level: 'Master Passport', landmark: '🏺', country: '튀니지',    description: '카르타고 문명의 유적과 지중해가 만나는 튀니지의 수도예요.' },
  { index: 118,name: 'Quito',             continent: 'South America',          level: 'Master Passport', landmark: '🌋', country: '에콰도르',  description: '적도 바로 위 해발 2,850m에 위치한 세계에서 가장 높은 수도예요.' },
  { index: 119,name: 'Montevideo',        continent: 'South America',          level: 'Master Passport', landmark: '🌅', country: '우루과이',  description: '리오 데 라 플라타 강가에 자리한 남미에서 가장 살기 좋은 도시예요.' },
]

// ── 헬퍼 함수 ────────────────────────────────────────────────────────────
// 수업 2회 = 도시 스탬프 1개

/** 현재 도시 인덱스 */
export function currentCityIndex(completedCount: number): number {
  return Math.floor(completedCount / 2)
}

/** 현재 도시 내 진행 (0 or 1) */
export function classesInCurrentCity(completedCount: number): 0 | 1 {
  return (completedCount % 2) as 0 | 1
}

/** 도시 상태 */
export function getCityStatus(cityIndex: number, completedCount: number): CityStatus {
  const classesForCity = completedCount - cityIndex * 2
  if (classesForCity >= 2) return 'stamped'
  if (classesForCity === 1) return 'arrived'
  if (classesForCity === 0) return 'next'
  return 'locked'
}

/** 스탬프가 완성된 도시 목록 */
export function getStampedCities(completedCount: number): City[] {
  return CITIES.filter(c => completedCount >= (c.index + 1) * 2)
}

/** 현재 머무는 도시 (Arrived 또는 Next 상태) */
export function getCurrentCity(completedCount: number): City | null {
  const idx = currentCityIndex(completedCount)
  return CITIES.find(c => c.index === idx) ?? null
}

/** 다음 도시 (현재 도시 완료 후) */
export function getNextCity(completedCount: number): City | null {
  const stamped = getStampedCities(completedCount).length
  return CITIES.find(c => c.index === stamped) ?? null
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
