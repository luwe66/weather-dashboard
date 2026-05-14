<template>
  <div class="location-selector" ref="selectorRef">
    <button class="location-btn" @click="toggleDropdown">
      <img src="/icons/ui/map-pin-2-fill.svg" class="pin-icon" alt="位置" />
      <span class="location-name">{{ city.name }}</span>
      <span class="location-sub">{{ city.adm1 }} · {{ city.country }}</span>
      <svg class="chevron" :class="{ open: showDropdown }" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="showDropdown" class="dropdown">
        <div class="dropdown-header">收藏的城市</div>
        <div v-if="favorites.length === 0" class="dropdown-empty">
          暂无收藏，在搜索结果中点击 ★ 添加
        </div>
        <button
          v-for="fav in favorites"
          :key="fav.id"
          class="dropdown-item"
          :class="{ active: fav.id === city.id }"
          @click="selectCity(fav)"
        >
          <img src="/icons/ui/map-pin-2-fill.svg" class="item-pin" alt="" />
          <div class="item-info">
            <span class="item-name">{{ fav.name }}</span>
            <span class="item-sub">{{ fav.adm1 }} · {{ fav.country }}</span>
          </div>
          <button class="item-remove" @click.stop="removeFavorite(fav.id)" title="取消收藏">
            <img src="/icons/ui/star-fill.svg" class="star-icon" alt="取消收藏" />
          </button>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  city: { type: Object, required: true },
})

const emit = defineEmits(['select'])

const showDropdown = ref(false)
const selectorRef = ref(null)
const favorites = ref([])

const STORAGE_KEY = 'weather_favorites'

function loadFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    favorites.value = stored ? JSON.parse(stored) : []
  } catch {
    favorites.value = []
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
}

function addFavorite(city) {
  if (!favorites.value.find(f => f.id === city.id)) {
    favorites.value.push(city)
    saveFavorites()
  }
}

function removeFavorite(id) {
  favorites.value = favorites.value.filter(f => f.id !== id)
  saveFavorites()
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function selectCity(city) {
  emit('select', city)
  showDropdown.value = false
}

function handleClickOutside(e) {
  if (selectorRef.value && !selectorRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  loadFavorites()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.location-selector {
  position: relative;
}

.location-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.pin-icon {
  width: 16px;
  height: 16px;
  filter: invert(70%) sepia(80%) saturate(400%) hue-rotate(160deg);
  flex-shrink: 0;
}

.location-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.location-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.chevron {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  background: rgba(13, 21, 38, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-empty {
  padding: 12px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-item.active {
  background: rgba(0, 212, 255, 0.08);
}

.item-pin {
  width: 14px;
  height: 14px;
  filter: invert(50%) sepia(30%) saturate(300%) hue-rotate(180deg);
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 13px;
  color: var(--text-primary);
}

.item-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.item-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.5;
  transition: opacity 0.15s;
}

.item-remove:hover {
  opacity: 1;
}

.star-icon {
  width: 14px;
  height: 14px;
  filter: invert(70%) sepia(80%) saturate(600%) hue-rotate(10deg);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
