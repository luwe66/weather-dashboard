<template>
  <div class="dashboard">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="logo">⛅ 天气大屏</h1>
        <span class="current-time">{{ currentTime }}</span>
      </div>
      <div class="header-center">
        <CitySearch @select="onCitySelect" />
      </div>
      <div class="header-right">
        <span class="status-dot" :class="{ active: apiEnabled }"></span>
        <span class="status-text">{{ apiEnabled ? '实时数据' : '已暂停' }}</span>
        <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
          <svg v-if="!isFullscreen" class="fullscreen-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 3H22V9H20V5H16V3H20ZM4 3H8V5H4V9H2V3H4ZM20 19V15H22V21H16V19H20ZM4 19H8V21H2V15H4V19Z"/>
          </svg>
          <svg v-else class="fullscreen-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 7H22V9H16V3H18V7ZM8 7V3H10V9H4V7H8ZM18 17V21H16V15H22V17H18ZM8 17H4V15H10V21H8V17Z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载天气数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <button @click="loadWeather">重试</button>
    </div>

    <!-- 主内容 -->
    <main v-else class="main-grid">
      <!-- 左列 -->
      <div class="col-left">
        <CurrentWeather
          v-if="nowWeather"
          :now="nowWeather"
          :city="currentCity"
          :update-time="lastUpdateTime"
          class="card-current"
        />
        <SunriseSunset
          :sunrise="astronomy.sunrise"
          :sunset="astronomy.sunset"
          class="card-sun"
        />
      </div>

      <!-- 中列 -->
      <div class="col-center">
        <HourlyChart
          v-if="hourlyData.length"
          :hourly="hourlyData"
          class="card-hourly"
        />
        <DailyForecast
          v-if="dailyData.length"
          :daily="dailyData"
          class="card-daily"
        />
      </div>

      <!-- 右列 -->
      <div class="col-right">
        <AirQuality
          v-if="airData"
          :air="airData"
          class="card-air"
        />
        <ApiUsagePanel
          :enabled="apiEnabled"
          :refresh-key="usageRefreshKey"
          class="card-usage"
          @toggle="toggleApi"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CurrentWeather from './components/CurrentWeather.vue'
import DailyForecast from './components/DailyForecast.vue'
import HourlyChart from './components/HourlyChart.vue'
import AirQuality from './components/AirQuality.vue'
import SunriseSunset from './components/SunriseSunset.vue'
import CitySearch from './components/CitySearch.vue'
import ApiUsagePanel from './components/ApiUsagePanel.vue'
import {
  getNowWeather,
  getDailyForecast,
  getHourlyForecast,
  getAirQuality,
  getAstronomy,
  isLimitExceeded,
} from './api/weather.js'

// 默认城市：北京
const currentCity = ref({ id: '101010100', name: '北京', adm1: '北京市', adm2: '北京', country: '中国', lat: '39.90', lon: '116.40' })

const nowWeather = ref(null)
const dailyData = ref([])
const hourlyData = ref([])
const airData = ref(null)
const astronomy = ref({ sunrise: '--:--', sunset: '--:--' })

const loading = ref(true)
const error = ref('')
const lastUpdateTime = ref('--')
const currentTime = ref('')
const apiEnabled = ref(true)
const usageRefreshKey = ref(0)
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 监听 ESC 退出全屏
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})

let refreshTimer = null
let clockTimer = null

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

async function loadWeather() {
  if (!apiEnabled.value) return
  // 发请求前先检查是否已超限
  if (isLimitExceeded()) {
    apiEnabled.value = false
    error.value = '本月请求已达 30,000 次上限，已自动关闭请求'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const id = currentCity.value.id
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    const [now, daily, hourly, astro] = await Promise.all([
      getNowWeather(id),
      getDailyForecast(id),
      getHourlyForecast(id),
      getAstronomy(id, today),
    ])

    // 空气质量单独请求，失败不影响主流程
    try {
      const air = await getAirQuality(currentCity.value.lat, currentCity.value.lon)
      airData.value = air
    } catch (e) {
      airData.value = null
    }

    nowWeather.value = now
    dailyData.value = daily
    hourlyData.value = hourly
    // 日出日落格式：2026-05-10T05:06+08:00，取 T 后面的时间部分
    const parseTime = (t) => t ? t.slice(t.indexOf('T') + 1, t.indexOf('T') + 6) : '--:--'
    astronomy.value = {
      sunrise: parseTime(astro.sunrise),
      sunset: parseTime(astro.sunset),
    }

    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    usageRefreshKey.value++
  } catch (e) {
    if (e.message === 'LIMIT_EXCEEDED') {
      apiEnabled.value = false
      error.value = '本月请求已达 30,000 次上限，已自动关闭请求'
    } else {
      error.value = `数据加载失败：${e.message}`
    }
  } finally {
    loading.value = false
  }
}

function startRefresh() {
  clearInterval(refreshTimer)
  refreshTimer = setInterval(() => {
    if (apiEnabled.value) loadWeather()
  }, 20 * 60 * 1000) // 20分钟刷新
}

function toggleApi() {
  apiEnabled.value = !apiEnabled.value
  if (apiEnabled.value) loadWeather()
}

function onCitySelect(city) {
  currentCity.value = city
  loadWeather()
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  loadWeather()
  startRefresh()
})

onUnmounted(() => {
  clearInterval(refreshTimer)
  clearInterval(clockTimer)
})
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

/* 顶部栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-blue);
  white-space: nowrap;
}

.current-time {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.header-center {
  flex: 1;
  max-width: 320px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: flex-end;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-dot.active {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 12px;
  color: var(--text-muted);
}

.fullscreen-btn {
  background: none;
  border: 1px solid var(--border-color);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
  padding: 0;
}

.fullscreen-btn:hover {
  border-color: var(--accent-blue);
}

.fullscreen-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.fullscreen-btn:hover .fullscreen-icon {
  color: var(--accent-blue);
}

/* 主网格 */
.main-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 12px;
  padding: 12px 16px;
  min-height: 0;
  overflow: hidden;
}

.col-left,
.col-center,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.card-current { flex: 1; min-height: 0; }
.card-sun { height: 200px; flex-shrink: 0; }
.card-hourly { height: 200px; flex-shrink: 0; }
.card-daily { flex: 1; min-height: 0; overflow-y: auto; }
.card-air { height: 280px; flex-shrink: 0; }
.card-usage { flex: 1; min-height: 0; }

/* 加载/错误 */
.loading-overlay,
.error-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-overlay button {
  padding: 8px 20px;
  background: var(--accent-blue);
  color: #000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>
