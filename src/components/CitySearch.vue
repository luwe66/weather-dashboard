<template>
  <div class="city-search">
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"/>
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="搜索城市..."
        class="search-input"
        @input="onInput"
        @keydown.enter="search"
        @keydown.escape="clear"
      />
      <button v-if="query" class="clear-btn" @click="clear">✕</button>
    </div>
    <div v-if="results.length" class="search-results">
      <div
        v-for="city in results"
        :key="city.id"
        class="result-item"
        @click="select(city)"
      >
        <span class="result-name">{{ city.name }}</span>
        <span class="result-sub">{{ city.adm2 }} · {{ city.adm1 }}</span>
      </div>
    </div>
    <div v-if="loading" class="search-loading">搜索中...</div>
    <div v-if="error" class="search-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { searchCity } from '../api/weather.js'

const emit = defineEmits(['select'])

const query = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
let timer = null

function onInput() {
  clearTimeout(timer)
  error.value = ''
  if (!query.value.trim()) {
    results.value = []
    return
  }
  timer = setTimeout(search, 400)
}

async function search() {
  if (!query.value.trim()) return
  loading.value = true
  results.value = []
  try {
    results.value = await searchCity(query.value.trim())
    if (!results.value.length) error.value = '未找到相关城市'
  } catch (e) {
    error.value = '搜索失败，请重试'
  } finally {
    loading.value = false
  }
}

function select(city) {
  emit('select', city)
  query.value = ''
  results.value = []
}

function clear() {
  query.value = ''
  results.value = []
  error.value = ''
}
</script>

<style scoped>
.city-search {
  position: relative;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: var(--accent-blue);
}

.search-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
}

.clear-btn:hover {
  color: var(--text-primary);
}

.search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.result-item:hover {
  background: var(--bg-secondary);
}

.result-name {
  font-size: 14px;
  color: var(--text-primary);
}

.result-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.search-loading,
.search-error {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
  z-index: 100;
}

.search-error {
  color: var(--danger);
}
</style>
