<template>
  <div class="dashboard-v2">
    <div class="bg-layer" :style="bgStyle"></div>
    <div class="bg-overlay"></div>

    <div class="content-wrap">

      <!-- ① 上方横跨全宽：城市/天气/温度 + 大图标 -->
      <div class="top-bar">
        <div class="top-left">
          <LocationSelector :city="city" @select="$emit('citySelect', $event)" />
          <div class="weather-text">{{ now?.text || '--' }}</div>
          <div class="top-spacer"></div>
          <div class="big-temp">
            <span class="temp-num">{{ now?.temp || '--' }}</span>
            <span class="temp-unit">°C</span>
          </div>
          <div class="date-str">{{ dateLabel }}</div>
        </div>
        <div class="top-right">
          <img
            v-if="now?.icon"
            :src="`/icons/${now.icon}.svg`"
            class="big-weather-icon"
            :alt="now?.text"
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
            <div class="card-title">24小时{{ metrics.find(m => m.key === activeMetric)?.label || '温度' }}曲线</div>
            <div ref="chartRef" class="chart-area"></div>
          </div>
          <!-- 数据块卡片，单位在数值右侧 -->
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
          <DailyForecastV2 :daily="daily" />
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
  if (!props.now) return []
  return [
    { key: 'temp',      label: '温度',  value: props.now.temp,      unit: '°C' },
    { key: 'humidity',  label: '湿度',  value: props.now.humidity,  unit: '%' },
    { key: 'windSpeed', label: '风速',  value: props.now.windSpeed, unit: 'km/h' },
    { key: 'windDir',   label: '风向',  value: props.now.windDir,   unit: '' },
    { key: 'vis',       label: '能见度',value: props.now.vis,       unit: 'km' },
  ]
})

function switchMetric(key) {
  activeMetric.value = key
  updateChart()
}

// 背景
const bgStyle = computed(() => {
  const code = Number(props.now?.icon || 100)
  if (code >= 300 && code < 400) return { background: 'linear-gradient(160deg,#0a1628,#1a2a4a 50%,#0d2035)' }
  if (code >= 400 && code < 500) return { background: 'linear-gradient(160deg,#0d1a2e,#1a2d4a 50%,#0a1828)' }
  if (code === 104 || (code >= 101 && code <= 103)) return { background: 'linear-gradient(160deg,#0a0e1a,#111d35 50%,#0d1526)' }
  return { background: 'linear-gradient(160deg,#050e20,#0a1e3a 50%,#051530)' }
})

const dateLabel = computed(() =>
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
)

// ECharts
const chartRef = ref(null)
let chart = null

const metricKeyMap = { temp: 'temp', humidity: 'humidity', windSpeed: 'windSpeed', vis: 'vis' }

function buildOption() {
  const dataKey = metricKeyMap[activeMetric.value]
  const hours = props.hourly.map(h => h.fxTime.slice(11, 16))
  const values = dataKey ? props.hourly.map(h => Number(h[dataKey] || 0)) : []
  const label = metrics.value.find(m => m.key === activeMetric.value)?.label || ''

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
  if (chart) chart.setOption(buildOption())
}

watch(() => props.hourly, updateChart, { deep: true })

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

/* 左：导航，固定 100×560px */
.side-nav {
  width: 100px;
  height: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(10,18,35,0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.07);
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
  color: var(--text-muted);
}

.nav-item:hover { background: rgba(255,255,255,0.06); color: var(--text-secondary); }
.nav-item.active { background: rgba(0,212,255,0.12); color: var(--accent-blue); }

.nav-icon {
  width: 24px;
  height: 24px;
  filter: invert(50%) sepia(10%) saturate(400%) hue-rotate(180deg) brightness(1.2);
}
.nav-item.active .nav-icon {
  filter: invert(70%) sepia(80%) saturate(400%) hue-rotate(160deg) brightness(1.3);
}
.nav-label { font-size: 10px; letter-spacing: 0.3px; }

/* 中：图表区，固定 712px 宽，图表400px + 间距32px + 数据块128px = 560px */
.center-col {
  width: 712px;
  height: 560px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.glass-card {
  background: rgba(10,18,35,0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 16px 20px;
  box-sizing: border-box;
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
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  flex-shrink: 0;
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

.metric-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.metric-block:hover { background: rgba(0,212,255,0.06); border-color: rgba(0,212,255,0.2); }
.metric-block.active { background: rgba(0,212,255,0.1); border-color: rgba(0,212,255,0.35); }

.m-label { font-size: 11px; color: var(--text-muted); }
.m-value-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.m-value { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.metric-block.active .m-value { color: var(--accent-blue); }
.m-unit { font-size: 11px; color: var(--text-muted); }

/* 占位 */
.placeholder-col { display: flex; align-items: center; justify-content: center; }
.placeholder-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
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
  color: var(--text-primary);
  line-height: 1.1;
}

.big-temp { display: flex; align-items: flex-start; line-height: 1; }
.temp-num { font-size: 80px; font-weight: 200; color: var(--text-primary); line-height: 1; }
.temp-unit { font-size: 28px; color: var(--text-secondary); margin-top: 8px; margin-left: 4px; }
.date-str { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
.top-right { flex-shrink: 0; }
.big-weather-icon { width: 180px; height: 180px; filter: drop-shadow(0 0 32px rgba(0,212,255,0.2)); }
</style>
