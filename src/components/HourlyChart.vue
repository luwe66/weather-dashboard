<template>
  <div class="hourly-chart">
    <h3 class="section-title">24小时温度</h3>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  hourly: { type: Array, required: true },
})

const chartRef = ref(null)
let chart = null

function buildOption(hourly) {
  const hours = hourly.map(h => h.fxTime.slice(11, 16))
  const temps = hourly.map(h => Number(h.temp))
  const pops = hourly.map(h => Number(h.pop || 0))

  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 21, 38, 0.9)',
      borderColor: '#1a3a6b',
      textStyle: { color: '#e8f4ff', fontSize: 12 },
      formatter: (params) => {
        const t = params[0]
        const p = params[1]
        return `${t.axisValue}<br/>🌡 ${t.value}°C<br/>💧 降水概率 ${p?.value ?? 0}%`
      },
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: '#1a3a6b' } },
      axisLabel: { color: '#4a6a8a', fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#4a6a8a', fontSize: 11, formatter: '{value}°' },
        splitLine: { lineStyle: { color: '#1a3a6b', type: 'dashed' } },
        axisLine: { show: false },
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        data: temps,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#00d4ff', width: 2 },
        itemStyle: { color: '#00d4ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0)' },
          ]),
        },
      },
      {
        name: '降水概率',
        type: 'bar',
        yAxisIndex: 1,
        data: pops,
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(123, 97, 255, 0.6)' },
            { offset: 1, color: 'rgba(123, 97, 255, 0.1)' },
          ]),
          borderRadius: [2, 2, 0, 0],
        },
      },
    ],
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  if (props.hourly.length) {
    chart.setOption(buildOption(props.hourly))
  }
}

watch(() => props.hourly, (val) => {
  if (chart && val.length) {
    chart.setOption(buildOption(val))
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
.hourly-chart {
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
  margin-bottom: 12px;
}

.chart-container {
  flex: 1;
  min-height: 0;
}
</style>
