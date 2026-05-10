<template>
  <div class="sunrise-sunset">
    <h3 class="section-title">天文</h3>
    <div class="sun-arc-wrapper">
      <svg viewBox="0 0 200 110" class="sun-arc">
        <!-- 背景弧 -->
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#1a3a6b" stroke-width="3"/>
        <!-- 进度弧 -->
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none"
          stroke="url(#sunGrad)" stroke-width="3"
          stroke-dasharray="283"
          :stroke-dashoffset="283 - 283 * sunProgress"
          stroke-linecap="round"
        />
        <!-- 太阳点 -->
        <circle :cx="sunX" :cy="sunY" r="7" fill="#ffab40" filter="url(#glow)"/>
        <defs>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ff9800"/>
            <stop offset="100%" stop-color="#ffeb3b"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>
    </div>
    <div class="sun-times">
      <div class="sun-time">
        <span class="sun-icon">🌅</span>
        <span class="sun-label">日出</span>
        <span class="sun-value">{{ sunrise }}</span>
      </div>
      <div class="day-length">
        <span class="day-label">白昼</span>
        <span class="day-value">{{ dayLength }}</span>
      </div>
      <div class="sun-time">
        <span class="sun-icon">🌇</span>
        <span class="sun-label">日落</span>
        <span class="sun-value">{{ sunset }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sunrise: { type: String, default: '--:--' },
  sunset: { type: String, default: '--:--' },
})

function timeToMinutes(t) {
  if (!t || t === '--:--') return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const sunProgress = computed(() => {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const rise = timeToMinutes(props.sunrise)
  const set = timeToMinutes(props.sunset)
  if (set <= rise) return 0
  return Math.max(0, Math.min(1, (nowMin - rise) / (set - rise)))
})

// 太阳在弧上的坐标
const sunX = computed(() => {
  const angle = Math.PI * (1 - sunProgress.value)
  return 100 + 90 * Math.cos(angle)
})

const sunY = computed(() => {
  const angle = Math.PI * (1 - sunProgress.value)
  return 100 - 90 * Math.sin(angle)
})

const dayLength = computed(() => {
  const rise = timeToMinutes(props.sunrise)
  const set = timeToMinutes(props.sunset)
  const diff = set - rise
  if (diff <= 0) return '--'
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}h ${m}m`
})
</script>

<style scoped>
.sunrise-sunset {
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

.sun-arc-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sun-arc {
  width: 100%;
  max-width: 200px;
}

.sun-times {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.sun-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sun-icon {
  font-size: 20px;
}

.sun-label {
  font-size: 11px;
  color: var(--text-muted);
}

.sun-value {
  font-size: 16px;
  color: var(--warning);
  font-weight: 600;
}

.day-length {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-label {
  font-size: 11px;
  color: var(--text-muted);
}

.day-value {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
