// Firebase Realtime Database REST API 封装
// 无需安装 SDK，直接用 fetch 读写

const DB_URL = 'https://weather-dashboard-53ece-default-rtdb.firebaseio.com'
const USAGE_PATH = `${DB_URL}/usage.json`

const MONTHLY_LIMIT = 30000

// 读取所有月份用量
export async function fetchUsageStats() {
  try {
    const res = await fetch(USAGE_PATH)
    if (!res.ok) return {}
    const data = await res.json()
    return data || {}
  } catch (e) {
    console.warn('Firebase 读取失败，降级到 localStorage', e)
    const stored = localStorage.getItem('qweather_usage')
    return stored ? JSON.parse(stored) : {}
  }
}

// 当月用量 +1，返回更新后的当月总量
export async function incrementUsage() {
  const month = new Date().toISOString().slice(0, 7) // "2026-05"
  const path = `${DB_URL}/usage/${month}.json`

  try {
    // Firebase REST 没有原子自增，用事务方式：先读再写
    const res = await fetch(path)
    const current = (await res.json()) || 0
    const next = current + 1

    await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })

    // 同步到 localStorage 作为缓存
    const stored = localStorage.getItem('qweather_usage')
    const local = stored ? JSON.parse(stored) : {}
    local[month] = next
    localStorage.setItem('qweather_usage', JSON.stringify(local))

    return next
  } catch (e) {
    console.warn('Firebase 写入失败，降级到 localStorage', e)
    // 降级：只写本地
    const stored = localStorage.getItem('qweather_usage')
    const local = stored ? JSON.parse(stored) : {}
    local[month] = (local[month] || 0) + 1
    localStorage.setItem('qweather_usage', JSON.stringify(local))
    return local[month]
  }
}

// 检查当月是否超限（优先读 localStorage 缓存，避免每次都请求 Firebase）
export function isLimitExceededLocal() {
  const month = new Date().toISOString().slice(0, 7)
  const stored = localStorage.getItem('qweather_usage')
  const local = stored ? JSON.parse(stored) : {}
  return (local[month] || 0) >= MONTHLY_LIMIT
}

export { MONTHLY_LIMIT }
