// 和风天气 API 封装
const API_KEY = 'c4f8c7217a5b4310bee26a06a3590f2f'
const API_HOST = 'nm6apy6jvc.re.qweatherapi.com'
const BASE_URL = `https://${API_HOST}/v7`
const GEO_URL = `https://${API_HOST}/geo/v2`

// 请求计数工具
function trackRequest(count = 1) {
  const key = 'qweather_usage'
  const stored = localStorage.getItem(key)
  const usage = stored ? JSON.parse(stored) : {}
  const month = new Date().toISOString().slice(0, 7) // "2026-05"
  usage[month] = (usage[month] || 0) + count
  localStorage.setItem(key, JSON.stringify(usage))
}

async function request(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.code !== '200') throw new Error(`API Error: ${data.code}`)
  trackRequest()
  return data
}

// 城市搜索
export async function searchCity(query) {
  const url = `${GEO_URL}/city/lookup?location=${encodeURIComponent(query)}&key=${API_KEY}`
  const data = await request(url)
  return data.location || []
}

// 实时天气
export async function getNowWeather(locationId) {
  const url = `${BASE_URL}/weather/now?location=${locationId}&key=${API_KEY}`
  const data = await request(url)
  return data.now
}

// 7天预报
export async function getDailyForecast(locationId) {
  const url = `${BASE_URL}/weather/7d?location=${locationId}&key=${API_KEY}`
  const data = await request(url)
  return data.daily
}

// 24小时预报
export async function getHourlyForecast(locationId) {
  const url = `${BASE_URL}/weather/24h?location=${locationId}&key=${API_KEY}`
  const data = await request(url)
  return data.hourly
}

// 空气质量（新版 API，用经纬度）
export async function getAirQuality(lat, lon) {
  const url = `${BASE_URL}/air/now?location=${lon},${lat}&key=${API_KEY}`
  try {
    const data = await request(url)
    return data.now
  } catch (e) {
    // 新版 API 用 /airquality/v1/current/{lat}/{lon}，需要 JWT，暂时返回 null
    return null
  }
}

// 天文（日出日落）
export async function getAstronomy(locationId, date) {
  const url = `${BASE_URL}/astronomy/sun?location=${locationId}&date=${date}&key=${API_KEY}`
  const data = await request(url)
  return data
}

// 获取用量统计
export function getUsageStats() {
  const stored = localStorage.getItem('qweather_usage')
  return stored ? JSON.parse(stored) : {}
}
