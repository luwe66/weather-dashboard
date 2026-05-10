<template>
  <div class="air-quality">
    <h3 class="section-title">空气质量</h3>
    <div ref="chartRef" class="chart-container"></div>
    <div class="aqi-details">
      <div class="aqi-main">
        <span class="aqi-value" :style="{ color: aqiColor }">{{ air.aqi }}</span>
        <span class="aqi-label" :style="{ color: aqiColor }">{{ air.category }}</span>
      </div>
      <div class="pollutants">
        <div class="pollutant-item" v-for="item in pollutants" :key="item.label">
          <span class="p-label">{{ item.label }}</span>
          <span class="p-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  air: { type: Object, required: true },
})

const chartRef = ref(null)
let chart = null

const aqiColorMap = [
  { max: 50, color: '#00e676', label: '优' },
  { max: 100, color: '#ffeb3b', label: '良' },
  { max: 150, color: '#ff9800', label: '轻度污染' },
  { max: 200, color: '#f44336', label: '中度污染' },
  { max: 300, color: '#9c27b0', label: '重度污染' },
  { max: Infinity, color: '#7b1fa2', label: '严重污染' },
]

const aqiColor = computed(() => {
  const aqi = Number(props.air.aqi || 0)
  return aqiColorMap.find(c => aqi <= c.max)?.color || '#7b1fa2'
})

const pollutants = computed(() => [
  { label: 'PM2.5', value: props.air.pm2p5 || '--' },
  { label: 'PM10', value: props.air.pm10 || '--' },
  { label: 'NO₂', value: props.air.no2 || '--' },
  { label: 'O₃', value: props.air.o3 || '--' },
  { label: 'SO₂', value: props.air.so2 || '--' },
  { label: 'CO', value: props.air.co || '--' },
])

function buildOption(air) {
  const aqi = Number(air.aqi || 0)
  return {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 300,
      radius: '85%',
      center: ['50%', '60%'],
      axisLine: {
        lineStyle: {
          width: 12,
          color: [
            [50 / 300, '#00e676'],
            [100 / 300, '#ffeb3b'],
            [150 / 300, '#ff9800'],
            [200 / 300, '#f44336'],
            [300 / 300, '#9c27b0'],
          ],
        },
      },
      pointer: {
        length: '60%',
        width: 4,
        itemStyle: { color: aqiColor.value },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
      data: [{ value: aqi }],
    }],
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  if (props.air.aqi) chart.setOption(buildOption(props.air))
}

watch(() => props.air, (val) => {
  if (chart && val.aqi) chart.setOption(buildOption(val))
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
.air-quality {
  padding: 20px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.chart-container {
  height: 140px;
}

.aqi-details {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}

.aqi-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.aqi-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.aqi-label {
  font-size: 12px;
  margin-top: 4px;
}

.pollutants {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  flex: 1;
}

.pollutant-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.p-label {
  font-size: 10px;
  color: var(--text-muted);
}

.p-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}
</style>
