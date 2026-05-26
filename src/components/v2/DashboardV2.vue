<template>
  <div class="dashboard-v2">
    <div class="bg-layer" :style="bgStyle"></div>
    <div class="bg-overlay"></div>

    <!-- 视频背景 -->
    <Transition name="bg-fade">
      <video
        v-if="videoSrc"
        :key="videoSrc"
        :src="videoSrc"
        class="bg-video"
        autoplay
        loop
        muted
        playsinline
      ></video>
    </Transition>

    <div class="content-wrap">

      <!-- ① 上方横跨全宽：城市/天气/温度 + 大图标 -->
      <div class="top-bar">
        <div class="top-left">
          <LocationSelector :city="city" @select="$emit('citySelect', $event)" />
          <div class="weather-text">{{ displayNow?.text || '--' }}</div>
          <div class="top-spacer"></div>
          <div class="big-temp">
            <span class="temp-num">{{ selectedDayIndex === 0 ? (displayNow?.temp || '--') : (selectedDay?.tempMax || '--') }}</span>
            <span class="temp-unit">°C</span>
          </div>
          <div class="date-str">{{ dateLabel }}</div>
        </div>
        <div class="top-right">
          <img
            v-if="displayNow?.icon"
            :src="`/icons/${displayNow.icon}.svg`"
            class="big-weather-icon"
            :alt="displayNow?.text"
          />
        </div>
      </div>

      <!-- ② 下方三列：导航 | 图表区 | 7天预报 -->
      <div class="bottom-row">

        <!-- 左：导航 -->
        <nav class="side-nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: activeNav === item.key }"
            @click="activeNav = item.key"
          >
            <img :src="item.icon" class="nav-icon" :alt="item.label" />
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>

        <!-- 中：图表 + 数据块（weather 模式） -->
        <div class="center-col" v-if="activeNav === 'weather'">
          <!-- 24h 图表卡片，标题随选中数据变化 -->
          <div class="glass-card chart-card">
            <div class="card-title">
              {{ selectedDayIndex === 0 ? '24小时' : selectedDayLabel }}
              {{ metrics.find(m => m.key === activeMetric)?.label || '温度' }}曲线
            </div>
            <div ref="chartRef" class="chart-area"></div>
          </div>
          <!-- 数据块卡片 -->
          <div class="glass-card metrics-card">
            <button
              v-for="m in metrics"
              :key="m.key"
              class="metric-block"
              :class="{ active: activeMetric === m.key }"
              @click="switchMetric(m.key)"
            >
              <span class="m-label">{{ m.label }}</span>
              <div class="m-value-row">
                <span class="m-value">{{ m.value }}</span>
                <span class="m-unit" v-if="m.unit">{{ m.unit }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 中：其他导航占位 -->
        <div class="center-col placeholder-col" v-else>
          <div class="glass-card placeholder-card">
            <p>{{ navItems.find(n => n.key === activeNav)?.label }} 功能开发中...</p>
          </div>
        </div>

        <!-- 右：7天预报 -->
        <div class="glass-card forecast-col">
          <DailyForecastV2
            :daily="daily"
            :selected-index="selectedDayIndex"
            @select="onDaySelect"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import LocationSelector from './LocationSelector.vue'
import DailyForecastV2 from './DailyForecastV2.vue'

const props = defineProps({
  city: { type: Object, required: true },
  now: { type: Object, default: null },
  hourly: { type: Array, default: () => [] },
  daily: { type: Array, default: () => [] },
})

defineEmits(['citySelect'])

// 选中的日期索引（0=今天）
const selectedDayIndex = ref(0)
const selectedDay = computed(() => props.daily[selectedDayIndex.value] || null)
const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  const d = new Date(selectedDay.value.fxDate)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
})

// 当前显示的天气数据（今天用实时，未来用预报）
const displayNow = computed(() => {
  if (selectedDayIndex.value === 0) return props.now
  const day = selectedDay.value
  if (!day) return props.now
  return {
    text: day.textDay,
    icon: day.iconDay,
    temp: day.tempMax,
    humidity: day.humidity,
    windSpeed: day.windSpeedDay,
    windDir: day.windDirDay,
    vis: props.now?.vis || '--',
  }
})

function onDaySelect(index) {
  selectedDayIndex.value = index
  updateChart()
}

// 导航
const activeNav = ref('weather')
const navItems = [
  { key: 'weather', label: 'weather', icon: '/icons/ui/weather-nav.svg' },
  { key: 'explore', label: 'explore', icon: '/icons/ui/compass-line.svg' },
  { key: 'cities',  label: 'cities',  icon: '/icons/ui/map-pin-2-fill.svg' },
  { key: 'settings',label: 'settings',icon: '/icons/ui/settings-line.svg' },
]

// 数据块
const activeMetric = ref('temp')
const metrics = computed(() => {
  const d = displayNow.value
  if (!d) return []
  return [
    { key: 'temp',      label: '温度',  value: selectedDayIndex.value === 0 ? d.temp : `${selectedDay.value?.tempMin}~${selectedDay.value?.tempMax}`, unit: '°C' },
    { key: 'humidity',  label: '湿度',  value: d.humidity,  unit: '%' },
    { key: 'windSpeed', label: '风速',  value: d.windSpeed, unit: 'km/h' },
    { key: 'windDir',   label: '风向',  value: d.windDir,   unit: '' },
    { key: 'vis',       label: '能见度',value: d.vis,       unit: 'km' },
  ]
})

function switchMetric(key) {
  activeMetric.value = key
  updateChart()
}

// 视频背景
const weatherToPinyin = {
  '多云': 'duoyun',
  '阴': 'yintian',
  '中雨': 'zhongyu',
}

const videoSrc = computed(() => {
  const text = displayNow.value?.text
  if (!text) return null
  const pinyin = weatherToPinyin[text]
  return pinyin ? `/videos/${pinyin}.mp4` : null
})

// 背景渐变（有视频时降低不透明度）
const bgStyle = computed(() => {
  const code = Number(displayNow.value?.icon || 100)
  const hasVideo = !!videoSrc.value
  const opacity = hasVideo ? 0.4 : 1

  let gradient
  if (code >= 300 && code < 400) gradient = 'linear-gradient(160deg,#0a1628,#1a2a4a 50%,#0d2035)'
  else if (code >= 400 && code < 500) gradient = 'linear-gradient(160deg,#0d1a2e,#1a2d4a 50%,#0a1828)'
  else if (code === 104 || (code >= 101 && code <= 103)) gradient = 'linear-gradient(160deg,#0a0e1a,#111d35 50%,#0d1526)'
  else gradient = 'linear-gradient(160deg,#050e20,#0a1e3a 50%,#051530)'

  return { background: gradient, opacity }
})

const dateLabel = computed(() => {
  if (selectedDayIndex.value === 0) {
    return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }
  const d = new Date(selectedDay.value?.fxDate)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

// ECharts
const chartRef = ref(null)
let chart = null

const metricKeyMap = {
  temp: 'temp',
  humidity: 'humidity',
  windSpeed: 'windSpeed',
  vis: 'vis',
}

// 未来某天的模拟图表数据（用预报数据生成近似曲线）
function buildFutureSeries(day, dataKey) {
  if (!day) return { hours: [], values: [] }
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  let values = []
  if (dataKey === 'temp') {
    const min = Number(day.tempMin)
    const max = Number(day.tempMax)
    // 模拟日温度曲线：凌晨最低，下午2点最高
    values = hours.map((_, i) => {
      const t = (i - 4) / 24 * Math.PI * 2
      return +(min + (max - min) * (0.5 + 0.5 * Math.sin(t - Math.PI / 2))).toFixed(1)
    })
  } else if (dataKey === 'humidity') {
    const val = Number(day.humidity || 60)
    values = hours.map(() => val + Math.round((Math.random() - 0.5) * 10))
  } else if (dataKey === 'windSpeed') {
    const val = Number(day.windSpeedDay || 10)
    values = hours.map(() => Math.max(0, val + Math.round((Math.random() - 0.5) * 6)))
  } else {
    values = hours.map(() => 20)
  }
  return { hours, values }
}

function buildOption() {
  const label = metrics.value.find(m => m.key === activeMetric.value)?.label || ''
  let hours, values

  if (selectedDayIndex.value === 0) {
    // 今天：用实时24h数据
    const dataKey = metricKeyMap[activeMetric.value]
    hours = props.hourly.map(h => h.fxTime.slice(11, 16))
    values = dataKey ? props.hourly.map(h => Number(h[dataKey] || 0)) : []
  } else {
    // 未来：用预报数据生成近似曲线
    const dataKey = metricKeyMap[activeMetric.value]
    const result = buildFutureSeries(selectedDay.value, dataKey)
    hours = result.hours
    values = result.values
  }

  return {
    backgroundColor: 'transparent',
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,18,35,0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e8f4ff', fontSize: 11 },
      formatter: p => `${p[0].axisValue}  ${label} ${p[0].value}`,
    },
    xAxis: {
      type: 'category', data: hours,
      axisLabel: { color: '#4a6a8a', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(74,106,138,0.3)' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#4a6a8a', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(74,106,138,0.12)', type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'none',
      lineStyle: { color: '#00d4ff', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,212,255,0.22)' },
          { offset: 1, color: 'rgba(0,212,255,0)' },
        ]),
      },
    }],
  }
}

function updateChart() {
  if (chart) chart.setOption(buildOption(), true)
}

watch(() => props.hourly, updateChart, { deep: true })
watch(selectedDayIndex, updateChart)

const ro = new ResizeObserver(() => chart?.resize())

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption(buildOption())
  ro.observe(chartRef.value)
})

onUnmounted(() => {
  ro.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.dashboard-v2 {
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: auto;
  min-width: 1200px;
}

.bg-layer {
  position: fixed;
  inset: 0;
  background: linear-gradient(160deg, #050e20, #0a1e3a 50%, #051530);
  transition: background 1.5s ease;
  z-index: 0;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.15);
  z-index: 0;
}

/* 视频背景 */
.bg-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 1s ease;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

/* 1200px 居中，内容固定尺寸，不足时出现滚动条 */
.content-wrap {
  position: relative;
  z-index: 1;
  width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 48px 0 32px;
}

/* ① 上方天气区：固定 1200×300px */
.top-bar {
  width: 1200px;
  height: 300px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

/* ② 下方三列：固定高度 560px，间距 32px，顶部间距 48px */
.bottom-row {
  flex-shrink: 0;
  width: 1200px;
  height: 560px;
  margin-top: 48px;
  display: grid;
  grid-template-columns: 100px 712px 324px;
  column-gap: 32px;
}

/* 白色毛玻璃基础样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 16px 20px;
  box-sizing: border-box;
}

/* 左：导航，固定 100×560px */
.side-nav {
  width: 100px;
  height: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 16px 8px;
  box-sizing: border-box;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 64px;
  padding: 10px 4px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.nav-item:hover {
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.9);
}

.nav-item.active {
  background: rgba(0,212,255,0.2);
  color: #00d4ff;
}

.nav-icon {
  width: 24px;
  height: 24px;
  filter: invert(100%) brightness(0.9);
}

.nav-item.active .nav-icon {
  filter: invert(70%) sepia(80%) saturate(400%) hue-rotate(160deg) brightness(1.3);
}

.nav-label {
  font-size: 10px;
  letter-spacing: 0.3px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

/* 中：图表区 */
.center-col {
  width: 712px;
  height: 560px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 图表卡片：固定 712×400px */
.chart-card {
  width: 712px;
  height: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  flex-shrink: 0;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.chart-area {
  flex: 1;
  min-height: 0;
}

/* 数据块卡片：固定 712×128px，与图表间距 32px */
.metrics-card {
  width: 712px;
  height: 128px;
  flex-shrink: 0;
  margin-top: 32px;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

/* 数据块：深色背景，青绿色数值 */
.metric-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding: 11px 13px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.metric-block:hover {
  background: rgba(255, 255, 255, 0.26);
  border-color: rgba(0, 212, 255, 0.5);
}

.metric-block.active {
  background: rgba(0, 212, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.7);
  box-shadow: 0 0 0 1px rgba(0,212,255,0.2);
}

.m-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.m-value-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.m-value {
  font-size: 16px;
  font-weight: 600;
  color: #00ffcc;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.metric-block.active .m-value {
  color: #00ffcc;
}

.m-unit {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

/* 占位 */
.placeholder-col { display: flex; align-items: center; justify-content: center; }
.placeholder-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
}

/* 右：7天预报，固定 324×560px */
.forecast-col {
  width: 324px;
  height: 560px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 上方天气区内容 */
.top-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
}

.top-spacer { flex: 1; }

/* 天气状况：大字，参考设计图约 48px */
.weather-text {
  font-size: 48px;
  font-weight: 300;
  color: #fff;
  line-height: 1.1;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.9);
}

.big-temp { display: flex; align-items: flex-start; line-height: 1; }
.temp-num {
  font-size: 80px;
  font-weight: 200;
  color: #fff;
  line-height: 1;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.9);
}
.temp-unit {
  font-size: 28px;
  color: rgba(255,255,255,0.7);
  margin-top: 8px;
  margin-left: 4px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}
.date-str {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}
.top-right { flex-shrink: 0; }
.big-weather-icon { width: 180px; height: 180px; filter: drop-shadow(0 0 32px rgba(0,212,255,0.2)); }
</style>
