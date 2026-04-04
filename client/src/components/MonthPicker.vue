<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  variant:    { type: String, default: 'blue' },    // blue | amber
  transparent: { type: Boolean, default: false },   // SummaryView 用
  dense:       { type: Boolean, default: false },   // 36px 緊湊樣式
  showAll:     { type: Boolean, default: false },   // 顯示「全部」按鈕（篩選用）
})
const emit = defineEmits(['update:modelValue'])

const show      = ref(false)
const triggerEl = ref(null)
const panelStyle = ref({})
const viewYear  = ref(new Date().getFullYear())

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const display = computed(() => {
  if (!props.modelValue) return props.showAll ? '全部' : '選擇月份'
  const [y, m] = props.modelValue.split('-')
  return `${y}年 ${parseInt(m)}月`
})

function selectAll() {
  emit('update:modelValue', '')
  show.value = false
}

function open() {
  if (props.modelValue) viewYear.value = parseInt(props.modelValue.split('-')[0])
  const rect = triggerEl.value.getBoundingClientRect()
  const panelW = 248
  const margin = 8
  const clampedLeft = Math.min(rect.left, window.innerWidth - panelW - margin)
  panelStyle.value = {
    position: 'fixed',
    top: (rect.bottom + 6) + 'px',
    left: Math.max(margin, clampedLeft) + 'px',
    zIndex: 1000,
  }
  show.value = true
}

function select(month) {
  emit('update:modelValue', `${viewYear.value}-${String(month).padStart(2, '0')}`)
  show.value = false
}

function isSelected(month) {
  if (!props.modelValue) return false
  const [y, m] = props.modelValue.split('-')
  return parseInt(y) === viewYear.value && parseInt(m) === month
}
</script>

<template>
  <div class="mp-wrap" :class="{ 'mp-wrap--full': !transparent }">
    <div
      ref="triggerEl"
      class="mp-trigger"
      :class="[
        transparent ? 'mp-trigger--transparent' : 'mp-trigger--full',
        variant === 'amber' ? 'mp-accent--amber' : variant === 'indigo' ? 'mp-accent--indigo' : 'mp-accent--blue',
        { 'mp-open': show, 'mp--dense': dense }
      ]"
      @click="open"
    >
      {{ display }}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mp-chevron"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

    <Teleport to="body">
      <div v-if="show" class="mp-backdrop" @click="show = false"></div>
      <div v-if="show" class="mp-panel" :style="panelStyle" @click.stop>
        <div class="mp-nav">
          <button class="mp-nav-btn" @click="viewYear--">◀</button>
          <span class="mp-year">{{ viewYear }}年</span>
          <button class="mp-nav-btn" @click="viewYear++">▶</button>
        </div>
        <div class="mp-grid">
          <button
            v-for="(name, i) in MONTHS"
            :key="i"
            class="mp-month"
            :class="isSelected(i + 1) ? 'mp-month--selected' : ''"
            @click="select(i + 1)"
          >{{ name }}</button>
        </div>
        <div v-if="showAll" class="mp-footer">
          <button class="mp-btn-all" :class="{ 'mp-btn-all--active': !modelValue }" @click="selectAll">全部</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mp-wrap--full { display: block; width: 100%; }

/* ── Trigger ── */
.mp-trigger {
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none; font-weight: 600;
  transition: border-color 0.15s, background 0.15s;
}

.mp-trigger--full {
  height: 40px; padding: 0 12px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #f8fafc; color: #475569;
  font-size: 14px; width: 100%; box-sizing: border-box;
}
.mp--dense { height: 36px; padding: 0 10px; }

.mp-trigger--transparent {
  background: transparent; border: none; padding: 0; font-size: 16px;
  color: #334155;
}
.mp-trigger--transparent:hover { opacity: 0.75; }

/* Blue */
.mp-accent--blue.mp-trigger--full:hover, .mp-accent--blue.mp-trigger--full.mp-open { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
.mp-accent--blue.mp-trigger--transparent { color: #2563eb; }

/* Amber */
.mp-accent--amber.mp-trigger--full:hover, .mp-accent--amber.mp-trigger--full.mp-open { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
.mp-accent--amber.mp-trigger--transparent { color: #d97706; }

/* Indigo */
.mp-accent--indigo.mp-trigger--full:hover, .mp-accent--indigo.mp-trigger--full.mp-open { background: #f5f3ff; border-color: #6366f1; color: #3730a3; }
.mp-accent--indigo.mp-trigger--transparent { color: #4f46e5; }

.mp-chevron { margin-left: 6px; opacity: 0.5; flex-shrink: 0; }
.mp-trigger--transparent .mp-chevron { display: none; }

/* ── Panel ── */
.mp-backdrop { position: fixed; inset: 0; z-index: 999; }

.mp-panel {
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  padding: 16px; width: 240px;
}

.mp-nav {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.mp-nav-btn {
  background: none; border: 1px solid #e5e7eb; border-radius: 6px;
  width: 30px; height: 30px; cursor: pointer; font-size: 12px; color: #374151;
}
.mp-nav-btn:hover { background: #f3f4f6; }
.mp-year { font-size: 15px; font-weight: 700; color: #1e3a5f; }

.mp-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
}
.mp-month {
  padding: 8px 4px; font-size: 13px; font-weight: 500;
  border: none; border-radius: 8px; cursor: pointer;
  background: none; color: #374151; transition: background 0.1s;
}
.mp-month:hover { background: #eff6ff; color: #2563eb; }
.mp-month--selected { background: #2563eb; color: #fff; font-weight: 700; }
.mp-month--selected:hover { background: #1d4ed8; color: #fff; }

.mp-footer { margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; }
.mp-btn-all {
  width: 100%; padding: 7px 0; font-size: 13px; font-weight: 600;
  border: 1px solid #86efac; border-radius: 8px; cursor: pointer;
  background: #f0fdf4; color: #16a34a; transition: background 0.1s;
}
.mp-btn-all:hover { background: #dcfce7; }
.mp-btn-all--active { background: #16a34a; color: #fff; border-color: #16a34a; }
.mp-btn-all--active:hover { background: #15803d; }

/* ── 深色主題 ── */
:global(.dark .mp-trigger--full) { background: #1e293b; border-color: #334155; color: #94a3b8; }
:global(.dark .mp-trigger--transparent) { color: #cbd5e1; }

:global(.dark .mp-accent--blue.mp-trigger--full:hover),
:global(.dark .mp-accent--blue.mp-trigger--full.mp-open) { background: #172554; border-color: #3b82f6; color: #93c5fd; }

:global(.dark .mp-accent--indigo.mp-trigger--full:hover),
:global(.dark .mp-accent--indigo.mp-trigger--full.mp-open) { background: #1e1b4b; border-color: #6366f1; color: #c7d2fe; }

:global(.dark .mp-accent--amber.mp-trigger--full:hover),
:global(.dark .mp-accent--amber.mp-trigger--full.mp-open) { background: #1c1208; border-color: #f59e0b; color: #fbbf24; }

:global(.dark .mp-panel) { background: #1e293b; border-color: #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
:global(.dark .mp-nav-btn) { border-color: #334155; color: #94a3b8; }
:global(.dark .mp-nav-btn:hover) { background: #334155; }
:global(.dark .mp-year) { color: #e2e8f0; }
:global(.dark .mp-month) { color: #cbd5e1; }
:global(.dark .mp-month:hover) { background: #1e3a5f; color: #60a5fa; }
:global(.dark .mp-month--selected) { background: #2563eb; color: #fff; }
:global(.dark .mp-footer) { border-top-color: #334155; }
:global(.dark .mp-btn-all) { background: #052e16; border-color: #166534; color: #4ade80; }
:global(.dark .mp-btn-all:hover) { background: #14532d; }
:global(.dark .mp-btn-all--active) { background: #16a34a; color: #fff; border-color: #16a34a; }
</style>
