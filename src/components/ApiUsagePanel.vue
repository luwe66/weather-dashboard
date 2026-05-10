<template>
  <div class="api-panel">
    <div class="panel-header">
      <h3 class="section-title">API 用量</h3>
      <div class="toggle-wrapper">
        <span class="toggle-label">{{ enabled ? '请求中' : '已暂停' }}</span>
        <button
          class="toggle-btn"
          :class="{ active: enabled }"
          @click="$emit('toggle')"
        >
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

    <!-- 历史图表 -->
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

const stats = computed(() => getUsageStats())

const currentMonth = new Date().toISOString().slice(0, 7)

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
  const months = Object.keys(data).sort()
  const counts = months.map(m => data[m])

  return {
    backgroundColor: 'transparent',
    grid: { top: 10, right: 8, bottom: 20, left: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 21, 38, 0.9)',
      borderColor: '#1a3a6b',
      textStyle: { color: '#e8f4ff', fontSize: 11 },
      formatter: (params) => `${params[0].axisValue}<br/>请求 ${params[0].value} 次`,
    },
    xAxis: {
      type: 'category',
      data: months.map(m => m.slice(5)),
      axisLabel: { color: '#4a6a8a', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a3a6b' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#4a6a8a', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a3a6b', type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      data: counts,
      barWidth: '50%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0, 212, 255, 0.8)' },
          { offset: 1, color: 'rgba(0, 212, 255, 0.2)' },
        ]),
        borderRadius: [3, 3, 0, 0],
      },
    }],
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  const data = getUsageStats()
  if (Object.keys(data).length) {
    chart.setOption(buildChartOption(data))
  }
}

watch(() => props.refreshKey, () => {
  const data = getUsageStats()
  if (chart && Object.keys(data).length) {
    chart.setOption(buildChartOption(data))
  }
})

const resizeObserver = new ResizeObserver(() => chart?.resize())

onMounted(() => {
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
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  border: none;
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

.usage-chart {
  flex: 1;
  min-height: 80px;
}
</style>
