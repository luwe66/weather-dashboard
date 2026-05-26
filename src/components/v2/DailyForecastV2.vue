<template>
  <div class="daily-v2">
    <!-- 日期切换 tabs -->
    <div class="day-tabs">
      <button
        v-for="(day, i) in daily"
        :key="day.fxDate"
        class="day-tab"
        :class="{ active: selectedIndex === i }"
        @click="$emit('select', i)"
      >
        <span class="tab-label">{{ i === 0 ? '今天' : formatDay(day.fxDate) }}</span>
        <img :src="`/icons/${day.iconDay}.svg`" class="tab-icon" :alt="day.textDay" />
      </button>
    </div>

    <!-- 选中日期的温度区间图 -->
    <div class="temp-chart" v-if="selectedDay">
      <div class="temp-range-header">
        <span class="temp-date">{{ selectedDateLabel }}</span>
        <span class="temp-desc">{{ selectedDay.textDay }}</span>
      </div>
      <div class="temp-bars">
        <div
          v-for="(day, i) in daily"
          :key="day.fxDate"
          class="temp-bar-row"
          :class="{ selected: i === selectedIndex }"
          @click="$emit('select', i)"
        >
          <span class="bar-day">{{ i === 0 ? '今' : formatDayShort(day.fxDate) }}</span>
          <span class="bar-low">{{ day.tempMin }}°</span>
          <div class="bar-track">
            <div class="bar-fill" :style="getTempBarStyle(day.tempMin, day.tempMax)"></div>
          </div>
          <span class="bar-high">{{ day.tempMax }}°</span>
        </div>
      </div>
      <p class="update-hint">更新于 {{ updateTime }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  daily: { type: Array, default: () => [] },
  selectedIndex: { type: Number, default: 0 },
})

defineEmits(['select'])

const selectedDay = computed(() => props.daily[props.selectedIndex] || null)

const selectedDateLabel = computed(() => {
  if (!selectedDay.value) return ''
  const date = new Date(selectedDay.value.fxDate)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
})

const updateTime = computed(() => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
})

const allTemps = computed(() => {
  const mins = props.daily.map(d => Number(d.tempMin))
  const maxs = props.daily.map(d => Number(d.tempMax))
  return { min: Math.min(...mins), max: Math.max(...maxs) }
})

function formatDay(dateStr) {
  const date = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

function formatDayShort(dateStr) {
  const date = new Date(dateStr)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[date.getDay()]
}

function getTempBarStyle(min, max) {
  const { min: globalMin, max: globalMax } = allTemps.value
  const range = globalMax - globalMin || 1
  const left = ((Number(min) - globalMin) / range) * 100
  const width = ((Number(max) - Number(min)) / range) * 100
  return { left: `${left}%`, width: `${Math.max(width, 8)}%` }
}
</script>

<style scoped>
.daily-v2 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

/* 日期 tabs：7个全部显示，缩小图标和间距 */
.day-tabs {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  flex: 1;
  min-width: 0;
}

.day-tab:hover {
  background: rgba(255, 255, 255, 0.15);
}

.day-tab.active {
  background: rgba(0, 212, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.5);
}

.tab-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.day-tab.active .tab-label {
  color: #00d4ff;
  font-weight: 600;
}

/* 图标缩小到 18px，让7个都能放下 */
.tab-icon {
  width: 18px;
  height: 18px;
}

/* 温度区间图 */
.temp-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.temp-range-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.temp-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.temp-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.temp-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  min-height: 0;
}

.temp-bar-row {
  display: grid;
  grid-template-columns: 20px 28px 1fr 28px;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.temp-bar-row:hover {
  background: rgba(255, 255, 255, 0.08);
}

.temp-bar-row.selected {
  background: rgba(0, 212, 255, 0.1);
}

.bar-day {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.temp-bar-row.selected .bar-day {
  color: #00d4ff;
  font-weight: 600;
}

.bar-low {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-align: right;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.bar-high {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}

.bar-track {
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  position: relative;
}

.bar-fill {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #00d4ff, #ffab40);
}

.update-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  text-align: right;
  flex-shrink: 0;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.9);
}
</style>
