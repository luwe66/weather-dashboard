<template>
  <div class="api-panel">
    <div class="panel-header">
      <h3 class="section-title">API 用量</h3>
      <div class="toggle-wrapper">
        <span class="toggle-label">{{ enabled ? '请求中' : '已暂停' }}</span>
        <button class="toggle-btn" :class="{ active: enabled }" @click="$emit('toggle')">
          <span class="toggle-dot"></span>
        </button>
      </div>
    </div>

    <!-- 本月进度 -->
    <div class="month-usage">
      <div class="usage-header">
        <span class="usage-label">本月用量</span>
        <span class="usage-count">
          <span :style="{ color: usageColor }">{{ currentMonthCount }}</span>
          <span class="usage-total"> / 50,000</span>
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressWidth, background: usageColor }"></div>
      </div>
      <div class="usage-percent">{{ usagePercent }}% 已使用</div>
    </div>

    <div class="divider"></div>

    <!-- 年用量标题 + 年份下拉 -->
    <div class="year-header">
      <span class="section-title">API 年用量</span>
      <div class="year-selector" @click.stop>
        <button class="year-btn" @click="toggleYearDropdown">
          <span>{{ selectedYear }}</span>
          <svg class="year-arrow" :class="{ open: showYearDropdown }" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/>
          </svg>
        </button>
        <Transition name="dropdown">
          <div v-if="showYearDropdown" class="year-dropdown">
            <button
              v-for="y in availableYears"
              :key="y"
              class="year-option"
              :class="{ active: y === selectedYear }"
              @click="selectYear(y)"
            >
              {{ y }}
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 横向条形图 -->
    <div ref="chartRef" class="usage-chart"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { getUsageStats } from '../api/weather.js'

const props = defineProps({
  enabled: { type: Boolean, default: true },
  refreshKey: { type: Number, default: 0 },
})

defineEmits(['toggle'])

const chartRef = ref(null)
let chart = null

const stats = ref({})
const currentMonth = new Date().toISOString().slice(0, 7)
const currentYear = new Date().getFullYear().toString()
const selectedYear = ref(currentYear)
const showYearDropdown = ref(false)

// 可选年份：从当前年往前推到2024
const availableYears = computed(() => {
  const thisYear = new Date().getFullYear()
  const years = []
  for (let y = thisYear; y >= 2024; y--) {
    years.push(y.toString())
  }
  return years
})

function hasDataForYear(year) {
  return Object.keys(stats.value).some(k => k.startsWith(year))
}

function toggleYearDropdown() {
  showYearDropdown.value = !showYearDropdown.value
}

function selectYear(year) {
  selectedYear.value = year
  showYearDropdown.value = false
  if (chart) chart.setOption(buildChartOption(stats.value))
}

watch(() => props.refreshKey, () => loadStats())

const currentMonthCount = computed(() => stats.value[currentMonth] || 0)

const usagePercent = computed(() =>
  Math.min(100, ((currentMonthCount.value / 50000) * 100).toFixed(1))
)

const progressWidth = computed(() => `${usagePercent.value}%`)

const usageColor = computed(() => {
  const p = usagePercent.value
  if (p < 60) return 'var(--success)'
  if (p < 85) return 'var(--warning)'
  return 'var(--danger)'
})

function buildChartOption(data) {
  // 显示选中年份的月份数据
  const year = selectedYear.value
  const months = []
  const counts = []
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`
    months.push(`${m}月`)
    counts.push(data[key] || 0)
  }

  const maxVal = Math.max(...counts, 100) // 无数据时 max 设为 100，保证坐标轴正常显示

  return {
    backgroundColor: 'transparent',
    grid: { top: 4, right: 48, bottom: 4, left: 28, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: 'rgba(13, 21, 38, 0.95)',
      borderColor: '#1a3a6b',
      textStyle: { color: '#e8f4ff', fontSize: 11 },
      formatter: (params) => `${params[0].name}<br/>请求 ${params[0].value} 次`,
    },
    xAxis: {
      type: 'value',
      max: maxVal,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: { color: 'rgba(74,106,138,0.2)', type: 'dashed', width: 0.5 },
      },
    },
    yAxis: {
      type: 'category',
      data: months,
      inverse: false,
      axisLabel: {
        color: '#4a6a8a',
        fontSize: 10,
        margin: 6,
      },
      axisLine: { lineStyle: { color: 'rgba(74,106,138,0.5)' } },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: counts,
      barWidth: 10,
      barGap: '30%',
      itemStyle: {
        color: (params) => {
          const isCurrentMonth = selectedYear.value === currentYear &&
            months[params.dataIndex] === `${new Date().getMonth() + 1}月`
          if (isCurrentMonth) {
            return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: 'rgba(0, 212, 255, 0.8)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0.1)' },
            ])
          }
          return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: 'rgba(0, 212, 255, 0.6)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0.1)' },
          ])
        },
        borderRadius: [0, 3, 3, 0],
      },
      label: {
        show: true,
        position: 'right',
        color: '#4a6a8a',
        fontSize: 10,
        formatter: (params) => params.value > 0 ? params.value : '',
      },
    }],
  }
}

async function loadStats() {
  stats.value = await getUsageStats()
  if (chart && Object.keys(stats.value).length) {
    chart.setOption(buildChartOption(stats.value))
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  chart.setOption(buildChartOption(stats.value))
}

watch(() => props.refreshKey, () => loadStats())

const resizeObserver = new ResizeObserver(() => chart?.resize())

onMounted(async () => {
  await loadStats()
  initChart()
  if (chartRef.value) resizeObserver.observe(chartRef.value)
})

onUnmounted(() => {
  resizeObserver.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.api-panel {
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: 11px;
  color: var(--text-muted);
}

.toggle-btn {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--bg-secondary);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  border: 1px solid var(--border-color);
}

.toggle-btn.active {
  background: rgba(0, 212, 255, 0.2);
  border-color: var(--accent-blue);
}

.toggle-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: transform 0.2s, background 0.2s;
}

.toggle-btn.active .toggle-dot {
  transform: translateX(16px);
  background: var(--accent-blue);
}

.month-usage {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-label {
  font-size: 12px;
  color: var(--text-muted);
}

.usage-count {
  font-size: 13px;
  font-weight: 600;
}

.usage-total {
  color: var(--text-muted);
  font-weight: 400;
}

.progress-bar {
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.usage-percent {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.divider {
  height: 1px;
  background: var(--border-color);
  flex-shrink: 0;
  margin: 0 -20px;
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.year-selector {
  position: relative;
}

.year-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
}

.year-arrow {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.year-arrow.open {
  transform: rotate(180deg);
}

.year-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 0;
  z-index: 100;
  min-width: 62px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.year-option {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 17px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  width: 100%;
  text-align: left;
  transition: color 0.15s;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.year-option:hover {
  color: var(--text-primary);
}

.year-option.active {
  color: var(--accent-blue);
  font-weight: 600;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.usage-chart {
  flex: 1;
  min-height: 0;
}
</style>
