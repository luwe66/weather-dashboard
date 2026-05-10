<template>
  <div class="daily-forecast">
    <h3 class="section-title">7天预报</h3>
    <div class="forecast-list">
      <div
        v-for="(day, index) in daily"
        :key="day.fxDate"
        class="forecast-item"
        :class="{ today: index === 0 }"
      >
        <span class="day-label">{{ index === 0 ? '今天' : formatDay(day.fxDate) }}</span>
        <span class="day-icon">{{ getIcon(day.textDay) }}</span>
        <span class="day-text">{{ day.textDay }}</span>
        <div class="temp-range">
          <span class="temp-low">{{ day.tempMin }}°</span>
          <div class="temp-bar">
            <div
              class="temp-fill"
              :style="getTempBarStyle(day.tempMin, day.tempMax)"
            ></div>
          </div>
          <span class="temp-high">{{ day.tempMax }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  daily: { type: Array, required: true },
})

const allTemps = computed(() => {
  const mins = props.daily.map(d => Number(d.tempMin))
  const maxs = props.daily.map(d => Number(d.tempMax))
  return {
    min: Math.min(...mins),
    max: Math.max(...maxs),
  }
})

function formatDay(dateStr) {
  const date = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

function getIcon(text) {
  const map = {
    '晴': '☀️', '多云': '⛅', '阴': '☁️', '小雨': '🌧️',
    '中雨': '🌧️', '大雨': '⛈️', '暴雨': '⛈️', '雪': '❄️',
    '小雪': '🌨️', '雾': '🌫️', '霾': '🌫️', '雷阵雨': '⛈️',
  }
  for (const [key, icon] of Object.entries(map)) {
    if (text?.includes(key)) return icon
  }
  return '🌤️'
}

function getTempBarStyle(min, max) {
  const { min: globalMin, max: globalMax } = allTemps.value
  const range = globalMax - globalMin || 1
  const left = ((Number(min) - globalMin) / range) * 100
  const width = ((Number(max) - Number(min)) / range) * 100
  return { left: `${left}%`, width: `${Math.max(width, 10)}%` }
}
</script>

<style scoped>
.daily-forecast {
  padding: 20px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 100%;
}

.section-title {
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.forecast-item {
  display: grid;
  grid-template-columns: 48px 28px 60px 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.forecast-item:hover {
  background: var(--bg-secondary);
}

.forecast-item.today {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.15);
}

.day-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.today .day-label {
  color: var(--accent-blue);
  font-weight: 600;
}

.day-icon {
  font-size: 18px;
}

.day-text {
  font-size: 12px;
  color: var(--text-muted);
}

.temp-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.temp-low {
  font-size: 13px;
  color: var(--text-muted);
  width: 28px;
  text-align: right;
}

.temp-high {
  font-size: 13px;
  color: var(--text-primary);
  width: 28px;
}

.temp-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  position: relative;
}

.temp-fill {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent-blue), var(--warning));
}
</style>
