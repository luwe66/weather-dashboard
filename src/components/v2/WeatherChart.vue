<template>
  <div class="weather-chart">
    <!-- 图表区域 -->
    <div ref="chartRef" class="chart-area"></div>

    <!-- 底部数据块 + 日期切换 -->
    <div class="chart-footer">
      <div class="metrics">
        <button
          v-for="m in metrics"
          :key="m.key"
          class="metric-block"
          :class="{ active: activeMetric === m.key }"
          @click="activeMetric = m.key"
        >
          <span class="metric-label">{{ m.label }}</span>
          <span class="metric-value">{{ m.value }}</span>
          <span class="metric-unit">{{ m.unit }}</span>
        </button>
      </div>
      <div class="date-nav">
        <button class="nav-btn" @click="prevDay" :disabled="selectedDayIndex === 0">
          <img src="/icons/ui/arrow-left-s-line.svg" class="nav-icon" alt="上一天" />
        </button>
        <span class="date-label">{{ selectedDayLabel }}</span>
        <button class="nav-btn" @click="nextDay" :disabled="selectedDayIndex === 6">
          <img src="/icons/ui/arrow-right-s-line.svg" class="nav-icon" alt="下一天" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  hourly: { type: Array, default: () => [] },
  daily: { type: Array, default: () => [] },
  now: { type: Object, default: null },
})

const chartRef = ref(null)
let chart = null
const activeMetric = ref('temp')
const selectedDayIndex = ref(0)

const metrics = computed(() => {
  if (!props.now) return []
  return [
    { key: 'temp', label: '温度', value: props.now.temp, unit: '°C' },
    { key: 'humidity', label: '湿度', value: props.now.humidity, unit: '%' },
    { key: 'windSpeed', label: '风速', value: props.now.windSpeed, unit: 'km/h' },
    { key: 'windDir', label: '风向', value: props.now.windDir, unit: '' },
    { key: 'vis', label: '能见度', value: props.now.vis, unit: 'km' },
  ]
})

const selectedDayLabel = computed(() => {
  if (!props.daily.length) return '--'
  const day = props.daily[selectedDayIndex.value]
  if (!day) return '--'
  const date = new Date(day.fxDate)
  if (selectedDayIndex.value === 0) return '今天'
  if (selectedDayIndex.value === 1) return '明天'
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
})

// 根据选中日期和指标，从 hourly 数据中提取当天数据
// hourly 是今天的24小时数据，其他天暂无逐小时数据，显示空图表
const chartData = computed(() => {
  const metricKeyMap = {
    temp: 'temp',
    humidity: 'humidity',
    windSpeed: 'windSpeed',
    windDir: null, // 风向是文字，不适合折线图
    vis: 'vis',
  }
  const dataKey = metricKeyMap[activeMetric.value]
  const metricInfo = metrics.value.find(m => m.key === activeMetric.value)

  if (selectedDayIndex.value !== 0 || !dataKey || !props.hourly.length) {
    // 非今天或风向：显示空图表骨架
    return { hours: Array.from({ length: 24 }, (_, i) => `${i}:00`), values: [], label: metricInfo?.label || '' }
  }

  const hours = props.hourly.map(h => h.fxTime.slice(11, 16))
  const values = props.hourly.map(h => Number(h[dataKey] || 0))
  return { hours, values, label: metricInfo?.label || '' }
})

function buildOption({ hours, values, label }) {
  const hasData = values.length > 0
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 21, 38, 0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e8f4ff', fontSize: 12 },
      formatter: (params) => `${params[0].axisValue}<br/>${label} ${params[0].value}`,
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: '#4a6a8a', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(74,106,138,0.3)' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#4a6a8a', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(74,106,138,0.15)', type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [{
      type: 'line',
      data: hasData ? values : [],
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#00d4ff', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0, 212, 255, 0.25)' },
          { offset: 1, color: 'rgba(0, 212, 255, 0)' },
        ]),
      },
    }],
  }
}

function prevDay() {
  if (selectedDayIndex.value > 0) selectedDayIndex.value--
}

function nextDay() {
  if (selectedDayIndex.value < 6) selectedDayIndex.value++
}

watch([activeMetric, selectedDayIndex, () => props.hourly], () => {
  if (chart) chart.setOption(buildOption(chartData.value))
}, { deep: true })

const resizeObserver = new ResizeObserver(() => chart?.resize())

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  chart.setOption(buildOption(chartData.value))
  resizeObserver.observe(chartRef.value)
})

onUnmounted(() => {
  resizeObserver.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.weather-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.chart-area {
  flex: 1;
  min-height: 0;
}

.chart-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.metrics {
  display: flex;
  gap: 8px;
  flex: 1;
}

.metric-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.metric-block:hover {
  background: rgba(0, 212, 255, 0.06);
  border-color: rgba(0, 212, 255, 0.2);
}

.metric-block.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
}

.metric-label {
  font-size: 11px;
  color: var(--text-muted);
}

.metric-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-block.active .metric-value {
  color: var(--accent-blue);
}

.metric-unit {
  font-size: 10px;
  color: var(--text-muted);
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--accent-blue);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-icon {
  width: 16px;
  height: 16px;
  filter: invert(60%) sepia(10%) saturate(500%) hue-rotate(180deg);
}

.date-label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: center;
}
</style>
