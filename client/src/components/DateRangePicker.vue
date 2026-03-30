<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  startDate: { type: String, default: '' },
  endDate:   { type: String, default: '' },
  block:     { type: Boolean, default: false },
  variant:   { type: String, default: 'blue' },  // blue | amber | indigo
})
const emit = defineEmits(['update:startDate', 'update:endDate'])

const show      = ref(false)
const step      = ref(1)          // 1 = 選起日，2 = 選迄日
const hoverDate = ref('')
const triggerEl = ref(null)
const panelStyle = ref({})

const now = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())   // 0-indexed

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const WEEKDAYS    = ['日','一','二','三','四','五','六']

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

const calendarDays = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDow  = new Date(y, m, 1).getDay()
  const lastDate  = new Date(y, m + 1, 0).getDate()
  const prevLast  = new Date(y, m, 0).getDate()
  const days = []
  for (let i = firstDow - 1; i >= 0; i--)
    days.push({ dateStr: fmtDate(y, m - 1, prevLast - i), day: prevLast - i, other: true })
  for (let d = 1; d <= lastDate; d++)
    days.push({ dateStr: fmtDate(y, m, d), day: d, other: false })
  let extra = 1
  while (days.length < 42)
    days.push({ dateStr: fmtDate(y, m + 1, extra++), day: extra - 1, other: true })
  return days
})

function fmtDate(y, m, d) {
  const dt = new Date(y, m, d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function display(str) {
  return str ? str.replace(/-/g, '/') : '—'
}

function open() {
  const rect = triggerEl.value.getBoundingClientRect()
  const panelW = 296
  const margin = 8
  const rawLeft = rect.left
  const clampedLeft = Math.min(rawLeft, window.innerWidth - panelW - margin)
  panelStyle.value = {
    position: 'fixed',
    top: (rect.bottom + 6) + 'px',
    left: Math.max(margin, clampedLeft) + 'px',
    zIndex: 1000,
  }
  // Navigate to start date's month if set
  if (props.startDate) {
    const [y, m] = props.startDate.split('-')
    viewYear.value = +y
    viewMonth.value = +m - 1
  } else {
    viewYear.value  = now.getFullYear()
    viewMonth.value = now.getMonth()
  }
  step.value = (!props.startDate || props.endDate) ? 1 : 2
  hoverDate.value = ''
  show.value = true
}

function close() {
  show.value = false
  hoverDate.value = ''
}

function selectDay(dateStr) {
  if (step.value === 1) {
    emit('update:startDate', dateStr)
    emit('update:endDate', '')
    step.value = 2
  } else {
    let s = props.startDate, e = dateStr
    if (e < s) [s, e] = [e, s]
    emit('update:startDate', s)
    emit('update:endDate', e)
    step.value = 1
    close()
  }
}

function onHover(dateStr) {
  if (step.value === 2) hoverDate.value = dateStr
}

function dayClass(item) {
  const d  = item.dateStr
  const s  = props.startDate
  const rawEnd = step.value === 2 && hoverDate.value ? hoverDate.value : props.endDate
  const lo = (s && rawEnd) ? (s < rawEnd ? s : rawEnd) : s
  const hi = (s && rawEnd) ? (s < rawEnd ? rawEnd : s) : ''
  return {
    'day-other':    item.other,
    'day-start':    !!s && d === s,
    'day-end':      !!props.endDate && d === props.endDate,
    'day-hover-end':step.value === 2 && d === hoverDate.value,
    'day-in-range': !!(lo && hi && d > lo && d < hi),
  }
}

function clear() {
  emit('update:startDate', '')
  emit('update:endDate', '')
  step.value = 1
}
</script>

<template>
  <div class="drp-wrap" :class="{ 'drp-wrap--block': block }">
    <div ref="triggerEl" class="drp-trigger" :class="[{ 'drp-trigger--block': block, 'drp-open': show }, `drp-trigger--${variant}`]" @click="open">
      <span class="seg" :class="{ 'seg-active': show && step === 1 }">{{ display(startDate) }}</span>
      <span class="arrow">→</span>
      <span class="seg" :class="{ 'seg-active': show && step === 2 }">{{ display(endDate) }}</span>
    </div>

    <Teleport to="body">
      <div v-if="show" class="drp-backdrop" @click="close"></div>
      <div v-if="show" class="drp-panel" :style="panelStyle" @click.stop>
        <div class="drp-hint">{{ step === 1 ? '▶ 請點選起始日' : '▶ 請點選結束日' }}</div>
        <div class="drp-nav">
          <button class="nav-btn" @click="prevMonth">◀</button>
          <span class="month-label">{{ viewYear }}年 {{ MONTH_NAMES[viewMonth] }}</span>
          <button class="nav-btn" @click="nextMonth">▶</button>
        </div>
        <div class="drp-grid">
          <div v-for="wd in WEEKDAYS" :key="wd" class="wd">{{ wd }}</div>
          <div
            v-for="item in calendarDays"
            :key="item.dateStr"
            class="day"
            :class="dayClass(item)"
            @click="selectDay(item.dateStr)"
            @mouseenter="onHover(item.dateStr)"
          >{{ item.day }}</div>
        </div>
        <div class="drp-footer">
          <button class="btn-clear" @click="clear">清除</button>
          <button class="btn-close" @click="close">關閉</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.drp-wrap { position: relative; display: inline-block; }
.drp-wrap--block { display: block; }
.drp-trigger--block { width: 100%; height: 40px; box-sizing: border-box; justify-content: center; }

.drp-trigger {
  display: flex; align-items: center; gap: 4px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #f8fafc;
  padding: 4px 10px; cursor: pointer;
  font-size: 14px; font-weight: 500; user-select: none; white-space: nowrap;
  transition: border-color 0.15s, background 0.15s; height: 36px; box-sizing: border-box;
}

.seg { min-width: 68px; text-align: center; color: #475569; }
.arrow { font-size: 12px; color: #cbd5e1; }

/* Blue */
.drp-trigger--blue:hover, .drp-trigger--blue.drp-open { background: #eff6ff; border-color: #3b82f6; }
.drp-trigger--blue:hover .seg, .drp-trigger--blue.drp-open .seg { color: #1e40af; }
.drp-trigger--blue:hover .arrow, .drp-trigger--blue.drp-open .arrow { color: #93c5fd; }
.drp-trigger--blue .seg.seg-active { color: #2563eb; font-weight: bold; }

/* Amber */
.drp-trigger--amber:hover, .drp-trigger--amber.drp-open { background: #fffbeb; border-color: #f59e0b; }
.drp-trigger--amber:hover .seg, .drp-trigger--amber.drp-open .seg { color: #92400e; }
.drp-trigger--amber:hover .arrow, .drp-trigger--amber.drp-open .arrow { color: #fcd34d; }
.drp-trigger--amber .seg.seg-active { color: #d97706; font-weight: bold; }

/* Indigo */
.drp-trigger--indigo:hover, .drp-trigger--indigo.drp-open { background: #f5f3ff; border-color: #6366f1; }
.drp-trigger--indigo:hover .seg, .drp-trigger--indigo.drp-open .seg { color: #3730a3; }
.drp-trigger--indigo:hover .arrow, .drp-trigger--indigo.drp-open .arrow { color: #c7d2fe; }
.drp-trigger--indigo .seg.seg-active { color: #4f46e5; font-weight: bold; }

.drp-backdrop { position: fixed; inset: 0; z-index: 999; }

.drp-panel {
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  padding: 16px; width: 288px; z-index: 1000;
}

.drp-hint {
  text-align: center; font-size: 13px; color: #2563eb;
  font-weight: bold; margin-bottom: 10px;
  background: #eff6ff; border-radius: 6px; padding: 5px 0;
}

.drp-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.nav-btn {
  background: none; border: 1px solid #e5e7eb; border-radius: 6px;
  width: 30px; height: 30px; cursor: pointer; font-size: 12px; color: #374151;
}
.nav-btn:hover { background: #f3f4f6; }
.month-label { font-size: 15px; font-weight: bold; color: #1e3a5f; }

.drp-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
}
.wd {
  text-align: center; font-size: 12px; color: #9ca3af;
  padding: 4px 0; font-weight: bold;
}
.day {
  text-align: center; padding: 7px 0; font-size: 13px;
  cursor: pointer; border-radius: 6px; color: #374151;
  transition: background 0.1s;
}
.day:hover:not(.day-start):not(.day-end):not(.day-hover-end) { background: #eff6ff; color: #2563eb; }
.day.day-other { color: #d1d5db; }
.day.day-in-range { background: #dbeafe; color: #1d4ed8; border-radius: 0; }
.day.day-start {
  background: #2563eb; color: #fff; font-weight: bold;
  border-radius: 6px 0 0 6px;
}
.day.day-end, .day.day-hover-end {
  background: #2563eb; color: #fff; font-weight: bold;
  border-radius: 0 6px 6px 0;
}
.day.day-start.day-end { border-radius: 6px; }

.drp-footer {
  display: flex; justify-content: space-between;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid #f3f4f6;
}
.btn-clear, .btn-close {
  font-size: 13px; padding: 5px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;
}
.btn-clear { background: none; border: 1px solid #e5e7eb; color: #6b7280; }
.btn-clear:hover { background: #f9fafb; }
.btn-close { background: #2563eb; border: none; color: #fff; }
.btn-close:hover { background: #1d4ed8; }

/* ── 深色主題 ── */
:global(.dark .drp-trigger) { background: #1e293b; border-color: #334155; }
:global(.dark .drp-trigger .seg) { color: #94a3b8; }
:global(.dark .drp-trigger .arrow) { color: #334155; }

:global(.dark .drp-trigger--blue:hover),
:global(.dark .drp-trigger--blue.drp-open) { background: #172554; border-color: #3b82f6; }
:global(.dark .drp-trigger--blue:hover .seg),
:global(.dark .drp-trigger--blue.drp-open .seg) { color: #93c5fd; }
:global(.dark .drp-trigger--blue .seg.seg-active) { color: #60a5fa; }

:global(.dark .drp-trigger--amber:hover),
:global(.dark .drp-trigger--amber.drp-open) { background: #1c1208; border-color: #f59e0b; }
:global(.dark .drp-trigger--amber:hover .seg),
:global(.dark .drp-trigger--amber.drp-open .seg) { color: #fbbf24; }
:global(.dark .drp-trigger--amber .seg.seg-active) { color: #fcd34d; }

:global(.dark .drp-trigger--indigo:hover),
:global(.dark .drp-trigger--indigo.drp-open) { background: #1e1b4b; border-color: #6366f1; }
:global(.dark .drp-trigger--indigo:hover .seg),
:global(.dark .drp-trigger--indigo.drp-open .seg) { color: #c7d2fe; }
:global(.dark .drp-trigger--indigo .seg.seg-active) { color: #818cf8; }

:global(.dark .drp-panel) { background: #1e293b; border-color: #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
:global(.dark .drp-hint) { background: #1e3a5f; color: #60a5fa; }

:global(.dark .nav-btn) { border-color: #334155; color: #94a3b8; }
:global(.dark .nav-btn:hover) { background: #334155; }
:global(.dark .month-label) { color: #e2e8f0; }

:global(.dark .wd) { color: #64748b; }
:global(.dark .day) { color: #cbd5e1; }
:global(.dark .day:hover:not(.day-start):not(.day-end):not(.day-hover-end)) { background: #1e3a5f; color: #60a5fa; }
:global(.dark .day.day-other) { color: #334155; }
:global(.dark .day.day-in-range) { background: #1e3a5f; color: #93c5fd; }

:global(.dark .drp-footer) { border-top-color: #334155; }
:global(.dark .btn-clear) { border-color: #334155; color: #94a3b8; }
:global(.dark .btn-clear:hover) { background: #334155; }
</style>
