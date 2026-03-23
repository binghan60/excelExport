<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },   // 'YYYY-MM-DD'
  placeholder: { type: String, default: '選擇日期' },
  variant: { type: String, default: 'blue' },  // blue | amber
})
const emit = defineEmits(['update:modelValue'])

const show       = ref(false)
const triggerEl  = ref(null)
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
  const y = viewYear.value, m = viewMonth.value
  const firstDow = new Date(y, m, 1).getDay()
  const lastDate = new Date(y, m + 1, 0).getDate()
  const prevLast = new Date(y, m, 0).getDate()
  const days = []
  for (let i = firstDow - 1; i >= 0; i--)
    days.push({ dateStr: fmt(y, m - 1, prevLast - i), day: prevLast - i, other: true })
  for (let d = 1; d <= lastDate; d++)
    days.push({ dateStr: fmt(y, m, d), day: d, other: false })
  let extra = 1
  while (days.length < 42)
    days.push({ dateStr: fmt(y, m + 1, extra++), day: extra - 1, other: true })
  return days
})

function fmt(y, m, d) {
  const dt = new Date(y, m, d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

const display = computed(() => {
  if (!props.modelValue) return ''
  const [y, m, d] = props.modelValue.split('-')
  return `${y}/${m}/${d}`
})

function open() {
  if (props.modelValue) {
    const [y, m] = props.modelValue.split('-')
    viewYear.value = +y; viewMonth.value = +m - 1
  } else {
    viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth()
  }
  const rect = triggerEl.value.getBoundingClientRect()
  const panelW = 280, margin = 8
  const clampedLeft = Math.min(rect.left, window.innerWidth - panelW - margin)
  panelStyle.value = {
    position: 'fixed',
    top: (rect.bottom + 6) + 'px',
    left: Math.max(margin, clampedLeft) + 'px',
    zIndex: 1000,
  }
  show.value = true
}

function select(dateStr) {
  emit('update:modelValue', dateStr)
  show.value = false
}

function clear() {
  emit('update:modelValue', '')
  show.value = false
}
</script>

<template>
  <div class="dp-wrap">
    <div
      ref="triggerEl"
      class="dp-trigger"
      :class="[
        variant === 'amber' ? 'dp-accent--amber' : 'dp-accent--blue',
        { 'dp-open': show }
      ]"
      @click="open"
    >
      <span :class="display ? 'dp-value' : 'dp-placeholder'">{{ display || placeholder }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           class="dp-icon">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>

    <Teleport to="body">
      <div v-if="show" class="dp-backdrop" @click="show = false"></div>
      <div v-if="show" class="dp-panel" :style="panelStyle" @click.stop>
        <!-- 月份導覽 -->
        <div class="dp-nav">
          <button class="dp-nav-btn" @click="prevMonth">◀</button>
          <span class="dp-month-label">{{ viewYear }}年 {{ MONTH_NAMES[viewMonth] }}</span>
          <button class="dp-nav-btn" @click="nextMonth">▶</button>
        </div>
        <!-- 星期列 -->
        <div class="dp-grid">
          <div v-for="wd in WEEKDAYS" :key="wd" class="dp-wd">{{ wd }}</div>
          <!-- 日期格 -->
          <div
            v-for="item in calendarDays"
            :key="item.dateStr"
            class="dp-day"
            :class="{
              'dp-day--other':    item.other,
              'dp-day--selected': item.dateStr === modelValue,
              'dp-day--amber':    variant === 'amber' && item.dateStr === modelValue,
            }"
            @click="select(item.dateStr)"
          >{{ item.day }}</div>
        </div>
        <!-- 底部 -->
        <div class="dp-footer">
          <button class="dp-btn-clear" @click="clear">清除</button>
          <button class="dp-btn-close" :class="variant === 'amber' ? 'dp-btn--amber' : 'dp-btn--blue'" @click="show = false">關閉</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dp-wrap { display: block; width: 100%; }

/* ── Trigger ── */
.dp-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  height: 36px; padding: 0 10px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #f8fafc;
  cursor: pointer; user-select: none; font-size: 13px; font-weight: 500;
  transition: border-color 0.15s, background 0.15s; box-sizing: border-box; width: 100%;
}
.dp-value { color: #334155; }
.dp-placeholder { color: #94a3b8; }

.dp-accent--blue:hover, .dp-accent--blue.dp-open { background: #eff6ff; border-color: #3b82f6; }
.dp-accent--blue:hover .dp-value, .dp-accent--blue.dp-open .dp-value { color: #1e40af; }
.dp-accent--blue:hover .dp-placeholder, .dp-accent--blue.dp-open .dp-placeholder { color: #93c5fd; }

.dp-accent--amber:hover, .dp-accent--amber.dp-open { background: #fffbeb; border-color: #f59e0b; }
.dp-accent--amber:hover .dp-value, .dp-accent--amber.dp-open .dp-value { color: #92400e; }
.dp-accent--amber:hover .dp-placeholder, .dp-accent--amber.dp-open .dp-placeholder { color: #fcd34d; }

.dp-icon { opacity: 0.5; flex-shrink: 0; }

/* ── Backdrop & Panel ── */
.dp-backdrop { position: fixed; inset: 0; z-index: 999; }

.dp-panel {
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  padding: 14px; width: 272px;
}

/* ── Nav ── */
.dp-nav {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.dp-nav-btn {
  background: none; border: 1px solid #e5e7eb; border-radius: 6px;
  width: 28px; height: 28px; cursor: pointer; font-size: 11px; color: #374151;
}
.dp-nav-btn:hover { background: #f3f4f6; }
.dp-month-label { font-size: 14px; font-weight: 700; color: #1e3a5f; }

/* ── Grid ── */
.dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.dp-wd   { text-align: center; font-size: 11px; color: #9ca3af; padding: 3px 0; font-weight: 600; }
.dp-day  {
  text-align: center; padding: 6px 0; font-size: 13px;
  cursor: pointer; border-radius: 6px; color: #374151; transition: background 0.1s;
}
.dp-day:hover:not(.dp-day--selected) { background: #eff6ff; color: #2563eb; }
.dp-day--other { color: #d1d5db; }
.dp-day--selected       { background: #2563eb; color: #fff; font-weight: 700; }
.dp-day--selected.dp-day--amber { background: #d97706; }

/* ── Footer ── */
.dp-footer {
  display: flex; justify-content: space-between;
  margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6;
}
.dp-btn-clear, .dp-btn-close {
  font-size: 12px; padding: 4px 14px; border-radius: 6px; cursor: pointer; font-weight: 600;
}
.dp-btn-clear { background: none; border: 1px solid #e5e7eb; color: #6b7280; }
.dp-btn-clear:hover { background: #f9fafb; }
.dp-btn--blue  { background: #2563eb; border: none; color: #fff; }
.dp-btn--blue:hover  { background: #1d4ed8; }
.dp-btn--amber { background: #d97706; border: none; color: #fff; }
.dp-btn--amber:hover { background: #b45309; }

/* ── 深色主題 ── */
:global(.dark .dp-trigger) { background: #1e293b; border-color: #334155; }
:global(.dark .dp-trigger .dp-value) { color: #cbd5e1; }
:global(.dark .dp-trigger .dp-placeholder) { color: #475569; }

:global(.dark .dp-accent--blue:hover),
:global(.dark .dp-accent--blue.dp-open) { background: #172554; border-color: #3b82f6; }
:global(.dark .dp-accent--blue:hover .dp-value),
:global(.dark .dp-accent--blue.dp-open .dp-value) { color: #93c5fd; }

:global(.dark .dp-accent--amber:hover),
:global(.dark .dp-accent--amber.dp-open) { background: #1c1208; border-color: #f59e0b; }
:global(.dark .dp-accent--amber:hover .dp-value),
:global(.dark .dp-accent--amber.dp-open .dp-value) { color: #fbbf24; }

:global(.dark .dp-panel) { background: #1e293b; border-color: #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
:global(.dark .dp-nav-btn) { border-color: #334155; color: #94a3b8; }
:global(.dark .dp-nav-btn:hover) { background: #334155; }
:global(.dark .dp-month-label) { color: #e2e8f0; }
:global(.dark .dp-wd)  { color: #64748b; }
:global(.dark .dp-day) { color: #cbd5e1; }
:global(.dark .dp-day:hover:not(.dp-day--selected)) { background: #1e3a5f; color: #60a5fa; }
:global(.dark .dp-day--other) { color: #334155; }
:global(.dark .dp-footer) { border-top-color: #334155; }
:global(.dark .dp-btn-clear) { border-color: #334155; color: #94a3b8; }
:global(.dark .dp-btn-clear:hover) { background: #334155; }
</style>
