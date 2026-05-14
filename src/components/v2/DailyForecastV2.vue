<template>
  <div class="daily-v2">
    <!-- 日期切换 -->
    <div class="day-tabs">
      <button
        v-for="(day, i) in daily"
        :key="day.fxDate"
        class="day-tab"
        :class="{ active: selectedIndex === i }"
        @click="selectedIndex = i"
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
        >
          <span class="bar-day">{{ i === 0 ? '今' : formatDayShort(day.fxDate) }}</span>
          <span class="bar-low">{{ day.tempMin }}°</span>
          <div class="bar-track">
            <div class="bar-fill" :style="getTempBarStyle(day.tempMin, day.tempMax)"></div>
          </div>
          <span class="bar-high">{{ day.tempMax }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  daily: { type: Array, default: () => [] },
})

const selectedIndex = ref(0)

const selectedDay = computed(() => props.daily[selectedIndex.value])

const selectedDateLabel = computed(() => {
  if (!selectedDay.value) return ''
  const date = new Date(selectedDay.value.fxDate)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
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
  gap: 12px;
  height: 100%;
}

/* 日期 tabs */
.day-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}

.day-tabs::-webkit-scrollbar { display: none; }

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  min-width: 52px;
}

.day-tab:hover {
  background: rgba(0, 212, 255, 0.06);
}

.day-tab.active {
  background: rgba(0, 212, 255, 0.12);
  border-color: rgba(0, 212, 255, 0.4);
}

.tab-label {
  font-size: 11px;
  color: var(--text-muted);
}

.day-tab.active .tab-label {
  color: var(--accent-blue);
}

.tab-icon {
  width: 24px;
  height: 24px;
}

/* 温度区间图 */
.temp-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  color: var(--text-secondary);
}

.temp-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.temp-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  min-height: 0;
}

.temp-bar-row {
  display: grid;
  grid-template-columns: 20px 28px 1fr 28px;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s;
}

.temp-bar-row.selected {
  background: rgba(0, 212, 255, 0.06);
}

.bar-day {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.bar-low {
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
}

.bar-high {
  font-size: 12px;
  color: var(--text-primary);
}

.bar-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  position: relative;
}

.bar-fill {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent-blue), var(--warning));
}
</style>
