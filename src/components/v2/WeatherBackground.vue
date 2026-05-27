<template>
  <div class="weather-bg">
    <!-- 渐变底色（始终存在，视频加载前/兜底时可见） -->
    <div class="bg-gradient" :style="gradientStyle"></div>

    <!-- 视频背景 -->
    <Transition name="bg-fade">
      <video
        v-if="videoSrc && !videoError"
        :key="videoSrc"
        :src="videoSrc"
        class="bg-video"
        autoplay
        loop
        muted
        playsinline
        @error="videoError = true"
      ></video>
    </Transition>

    <!-- 兜底：无视频时的 CSS 动画层 -->
    <template v-if="!videoSrc || videoError">
      <!-- 晴天光晕 -->
      <div v-if="isSunny" class="sunny-layer">
        <div class="sun-glow"></div>
        <div class="sun-ray" v-for="i in 8" :key="i" :style="rayStyle(i)"></div>
      </div>
      <!-- 雾/霾 -->
      <div v-if="isFog" class="fog-layer">
        <div class="fog-strip fog-1"></div>
        <div class="fog-strip fog-2"></div>
        <div class="fog-strip fog-3"></div>
      </div>
      <!-- Canvas 粒子（雨/雪/沙尘/云） -->
      <canvas ref="canvasRef" class="bg-canvas"></canvas>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  weatherCode: { type: Number, default: 100 },
  weatherText: { type: String, default: '' },
})

const videoError = ref(false)

// 天气分类
const weatherType = computed(() => {
  const code = props.weatherCode
  const text = props.weatherText
  if (code === 100 || code === 150) return 'sunny'
  if (code >= 101 && code <= 103) return 'cloudy'
  if (code === 104 || code === 154) return 'overcast'
  if (code >= 300 && code <= 304) return 'thunder'
  if (code >= 305 && code <= 309) return 'light-rain'
  if (code >= 310 && code <= 313) return 'heavy-rain'
  if (code >= 314 && code <= 318) return 'storm'
  if (code >= 400 && code <= 403) return 'snow'
  if (code >= 404 && code <= 407) return 'sleet'
  if (code >= 500 && code <= 502) return 'fog'
  if (code >= 503 && code <= 507) return 'dust'
  if (text.includes('雷')) return 'thunder'
  if (text.includes('暴雨') || text.includes('大雨')) return 'heavy-rain'
  if (text.includes('雨')) return 'light-rain'
  if (text.includes('雪')) return 'snow'
  if (text.includes('雾') || text.includes('霾')) return 'fog'
  if (text.includes('沙') || text.includes('尘')) return 'dust'
  if (text.includes('阴')) return 'overcast'
  if (text.includes('云')) return 'cloudy'
  return 'sunny'
})

// 天气类型 → 视频文件映射
const typeToVideo = {
  'sunny':      '/videos/qing.mp4',
  'cloudy':     '/videos/duoyun.mp4',
  'overcast':   '/videos/yintian.mp4',
  'light-rain': '/videos/xiaoyu.mp4',
  'heavy-rain': '/videos/dayu.mp4',
  'storm':      '/videos/dayu.mp4',
  'thunder':    '/videos/leizhenyu.mp4',
  'snow':       '/videos/xue.mp4',
  'sleet':      '/videos/xue.mp4',
  'fog':        '/videos/wu.mp4',
  'dust':       '/videos/shachen.mp4',
}

const videoSrc = computed(() => typeToVideo[weatherType.value] || null)

// 切换天气时重置错误状态
watch(videoSrc, () => { videoError.value = false })

const isSunny = computed(() => weatherType.value === 'sunny')
const isFog = computed(() => weatherType.value === 'fog')

// 渐变背景色（视频下方的底色，也是兜底背景）
const gradientStyle = computed(() => {
  const gradients = {
    'sunny':       'linear-gradient(160deg, #0a1a3a 0%, #1a3a6a 40%, #2a5a9a 100%)',
    'cloudy':      'linear-gradient(160deg, #0a0e1a 0%, #111d35 50%, #0d1526 100%)',
    'overcast':    'linear-gradient(160deg, #080c18 0%, #0d1525 50%, #0a1020 100%)',
    'thunder':     'linear-gradient(160deg, #050810 0%, #0a0f1e 50%, #060a14 100%)',
    'light-rain':  'linear-gradient(160deg, #080e20 0%, #0d1830 50%, #0a1428 100%)',
    'heavy-rain':  'linear-gradient(160deg, #050a18 0%, #080e22 50%, #060c1c 100%)',
    'storm':       'linear-gradient(160deg, #030508 0%, #060a12 50%, #040710 100%)',
    'snow':        'linear-gradient(160deg, #0a1020 0%, #121c30 50%, #0e1828 100%)',
    'sleet':       'linear-gradient(160deg, #080e1c 0%, #0e1828 50%, #0a1422 100%)',
    'fog':         'linear-gradient(160deg, #0c1020 0%, #141e30 50%, #101828 100%)',
    'dust':        'linear-gradient(160deg, #1a1008 0%, #2a1c0a 50%, #1e1408 100%)',
  }
  return { background: gradients[weatherType.value] || gradients['sunny'] }
})

function rayStyle(i) {
  const angle = (i - 1) * 45
  return { '--base-angle': `${angle}deg` }
}

// ── Canvas 粒子（兜底动画） ──────────────────────────────
const canvasRef = ref(null)
let ctx = null
let animId = null
let particles = []
let lightningTimer = 0
let lightningAlpha = 0

function initParticles() {
  particles = []
  if (!canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  const type = weatherType.value
  if (type === 'light-rain') {
    for (let i = 0; i < 120; i++) particles.push(makeRain(w, h, 1))
  } else if (type === 'heavy-rain' || type === 'thunder') {
    for (let i = 0; i < 220; i++) particles.push(makeRain(w, h, 2))
  } else if (type === 'storm') {
    for (let i = 0; i < 350; i++) particles.push(makeRain(w, h, 3))
  } else if (type === 'snow' || type === 'sleet') {
    for (let i = 0; i < 100; i++) particles.push(makeSnow(w, h))
    if (type === 'sleet') for (let i = 0; i < 60; i++) particles.push(makeRain(w, h, 1))
  } else if (type === 'cloudy' || type === 'overcast') {
    for (let i = 0; i < 6; i++) particles.push(makeCloud(w, h))
  } else if (type === 'dust') {
    for (let i = 0; i < 200; i++) particles.push(makeDust(w, h))
  }
}

function makeRain(w, h, intensity) {
  return { type: 'rain', x: Math.random() * (w + 200) - 100, y: Math.random() * h,
    len: 10 + intensity * 8 + Math.random() * 10, speed: 8 + intensity * 4 + Math.random() * 6,
    opacity: 0.3 + Math.random() * 0.4, wind: intensity * 1.5 }
}
function makeSnow(w, h) {
  return { type: 'snow', x: Math.random() * w, y: Math.random() * h,
    r: 1.5 + Math.random() * 3, speed: 0.5 + Math.random() * 1.5,
    drift: (Math.random() - 0.5) * 0.5, opacity: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2 }
}
function makeCloud(w, h) {
  return { type: 'cloud', x: Math.random() * w, y: 50 + Math.random() * (h * 0.4),
    w: 200 + Math.random() * 300, h: 60 + Math.random() * 80,
    speed: 0.1 + Math.random() * 0.2, opacity: 0.04 + Math.random() * 0.06 }
}
function makeDust(w, h) {
  return { type: 'dust', x: Math.random() * w, y: Math.random() * h,
    r: 0.5 + Math.random() * 2, speed: 2 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.5, vy: (Math.random() - 0.5) * 0.5 }
}

function draw() {
  if (!ctx || !canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  const type = weatherType.value
  ctx.clearRect(0, 0, w, h)

  if (type === 'thunder' || type === 'storm') {
    lightningTimer--
    if (lightningTimer <= 0) {
      lightningTimer = 120 + Math.random() * 240
      lightningAlpha = 0.25 + Math.random() * 0.35
    }
    if (lightningAlpha > 0) {
      ctx.fillStyle = `rgba(180,200,255,${lightningAlpha})`
      ctx.fillRect(0, 0, w, h)
      lightningAlpha *= 0.75
    }
  }

  particles.forEach(p => {
    if (p.type === 'rain') {
      ctx.save()
      ctx.strokeStyle = `rgba(174,214,241,${p.opacity})`
      ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.wind, p.y + p.len); ctx.stroke()
      ctx.restore()
      p.x += p.wind; p.y += p.speed
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * (w + 200) - 100 }
    } else if (p.type === 'snow') {
      p.phase += 0.02
      ctx.save()
      ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
      ctx.beginPath(); ctx.arc(p.x + Math.sin(p.phase) * 20, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      p.y += p.speed; p.x += p.drift
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w }
      if (p.x > w + 10) p.x = -10
      if (p.x < -10) p.x = w + 10
    } else if (p.type === 'cloud') {
      ctx.save()
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w / 2)
      g.addColorStop(0, `rgba(255,255,255,${p.opacity})`); g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      p.x += p.speed
      if (p.x - p.w / 2 > w) p.x = -p.w / 2
    } else if (p.type === 'dust') {
      ctx.save()
      ctx.fillStyle = `rgba(210,160,80,${p.opacity})`
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      p.x += p.speed; p.y += p.vy
      if (p.x > w + 10) { p.x = -10; p.y = Math.random() * h }
    }
  })
  animId = requestAnimationFrame(draw)
}

function resize() {
  if (!canvasRef.value) return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
  initParticles()
}

watch([weatherType, () => !videoSrc.value || videoError.value], ([, needCanvas]) => {
  if (needCanvas) {
    setTimeout(() => {
      if (canvasRef.value) {
        ctx = canvasRef.value.getContext('2d')
        resize()
        cancelAnimationFrame(animId)
        draw()
      }
    }, 50)
  } else {
    cancelAnimationFrame(animId)
  }
})

onMounted(() => {
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  cancelAnimationFrame(animId)
})
</script>

<style scoped>
.weather-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  transition: background 2s ease;
}

.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 1.5s ease;
}
.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

/* 晴天光晕 */
.sunny-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sun-glow {
  position: absolute;
  top: 8%;
  right: 12%;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,200,80,0.18) 0%, rgba(255,160,40,0.08) 40%, transparent 70%);
  animation: pulse-glow 4s ease-in-out infinite;
}

.sun-ray {
  position: absolute;
  top: calc(8% + 100px);
  right: calc(12% + 100px);
  width: 2px;
  height: 120px;
  background: linear-gradient(to bottom, rgba(255,200,80,0.15), transparent);
  transform-origin: top center;
  animation: rotate-ray 20s linear infinite;
  transform: rotate(var(--base-angle, 0deg));
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

@keyframes rotate-ray {
  from { transform: rotate(var(--base-angle, 0deg)); }
  to { transform: rotate(calc(var(--base-angle, 0deg) + 360deg)); }
}

/* 雾层 */
.fog-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fog-strip {
  position: absolute;
  left: -20%;
  width: 140%;
  border-radius: 50%;
  background: rgba(200,210,220,0.07);
  filter: blur(30px);
}

.fog-1 { height: 180px; top: 20%; animation: fog-drift 18s ease-in-out infinite; }
.fog-2 { height: 140px; top: 45%; animation: fog-drift 24s ease-in-out infinite reverse; opacity: 0.8; }
.fog-3 { height: 160px; top: 65%; animation: fog-drift 20s ease-in-out infinite 6s; opacity: 0.6; }

@keyframes fog-drift {
  0%   { transform: translateX(0); }
  50%  { transform: translateX(8%); }
  100% { transform: translateX(0); }
}
</style>
