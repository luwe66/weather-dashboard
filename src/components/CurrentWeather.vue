<template>
  <div class="current-weather">
    <div class="city-info">
      <h1 class="city-name">{{ city.name }}</h1>
      <p class="city-sub">{{ city.adm1 }} · {{ city.country }}</p>
      <p class="update-time">更新于 {{ updateTime }}</p>
    </div>

    <div class="temp-block">
      <span class="temp-main">{{ now.temp }}</span>
      <span class="temp-unit">°C</span>
      <div class="temp-feel">体感 {{ now.feelsLike }}°C</div>
    </div>

    <div class="weather-desc">
      <span class="weather-icon">{{ weatherIcon }}</span>
      <span class="weather-text">{{ now.text }}</span>
    </div>

    <div class="metrics">
      <div class="metric-item">
        <span class="metric-label">湿度</span>
        <span class="metric-value">{{ now.humidity }}%</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">风速</span>
        <span class="metric-value">{{ now.windSpeed }} km/h</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">风向</span>
        <span class="metric-value">{{ now.windDir }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">能见度</span>
        <span class="metric-value">{{ now.vis }} km</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  now: { type: Object, required: true },
  city: { type: Object, required: true },
  updateTime: { type: String, default: '--' },
})

const weatherIconMap = {
  '晴': '☀️', '多云': '⛅', '阴': '☁️', '小雨': '🌧️',
  '中雨': '🌧️', '大雨': '⛈️', '暴雨': '⛈️', '雪': '❄️',
  '小雪': '🌨️', '雾': '🌫️', '霾': '🌫️', '雷阵雨': '⛈️',
}

const weatherIcon = computed(() => {
  for (const [key, icon] of Object.entries(weatherIconMap)) {
    if (props.now.text?.includes(key)) return icon
  }
  return '🌤️'
})
</script>

<style scoped>
.current-weather {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 100%;
}

.city-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-blue);
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.city-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.update-time {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.temp-block {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.temp-main {
  font-size: 72px;
  font-weight: 200;
  line-height: 1;
  color: var(--text-primary);
}

.temp-unit {
  font-size: 28px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.temp-feel {
  font-size: 13px;
  color: var(--text-secondary);
  align-self: flex-end;
  margin-bottom: 8px;
  margin-left: 8px;
}

.weather-desc {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-icon {
  font-size: 24px;
}

.weather-text {
  font-size: 18px;
  color: var(--text-secondary);
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: auto;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.metric-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 16px;
  color: var(--accent-cyan);
  font-weight: 600;
}
</style>
