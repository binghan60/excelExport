<script setup>
import { onMounted, onUnmounted, ref, computed, reactive, watch } from 'vue'
import { useInventoryStore } from '../stores/inventory.js'
import { useRentalsStore } from '../stores/rentals.js'
import { useAdminStore } from '../stores/admin.js'
import { useTheme } from '../composables/useTheme.js'

import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import MonthPicker from '../components/MonthPicker.vue'
import RevenueChart from '../components/RevenueChart.vue'
import GanttTooltip from '../components/GanttTooltip.vue'

const inventoryStore = useInventoryStore()
const rentalsStore = useRentalsStore()
const adminStore = useAdminStore()
const { isDark } = useTheme()

// Tooltip 狀態
const tooltip = ref({ show: false, x: 0, y: 0, content: {} })
const handleMouseMove = (e, task) => {
  tooltip.value = { show: true, x: e.clientX, y: e.clientY, content: task }
}
const handleMouseLeave = () => { tooltip.value.show = false }

// 基礎顏色庫
const BASE_COLORS = [
  { light: '#dc2626', dark: '#ef4444' }, // red
  { light: '#ea580c', dark: '#fb923c' }, // orange
  { light: '#ca8a04', dark: '#facc15' }, // yellow
  { light: '#16a34a', dark: '#4ade80' }, // green
  { light: '#0d9488', dark: '#2dd4bf' }, // teal
  { light: '#2563eb', dark: '#60a5fa' }, // blue
  { light: '#7c3aed', dark: '#a78bfa' }, // violet
  { light: '#db2777', dark: '#f472b6' }, // pink
]

const FIXED_COLORS = { '土桶': 0, '鋼軌': 1, '鐵板': 2, '鐵網': 3 }

const COLORS = computed(() => {
  const map = {}
  const usedIndices = new Set(Object.values(FIXED_COLORS))
  const freeIndices = BASE_COLORS.map((_, i) => i).filter(i => !usedIndices.has(i))
  let freeSlot = 0
  equipmentOptions.value.forEach(name => {
    const fixedIdx = FIXED_COLORS[name]
    const idx = fixedIdx !== undefined ? fixedIdx : freeIndices[freeSlot++ % freeIndices.length]
    const colorSet = BASE_COLORS[idx]
    map[name] = isDark.value ? colorSet.dark : colorSet.light
  })
  return map
})

const today = new Date()
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
const filters = ref({ month: currentMonth, client: '', site: '', equipment: '' })

function resetFilters() {
  filters.value = { month: currentMonth, client: '', site: '', equipment: '' }
}

const equipmentOptions = computed(() => {
  const equipments = new Set()
  rentalsStore.rentals.forEach(inv => {
    if (inv.rows) inv.rows.forEach(r => { if (r.equipment_name) equipments.add(r.equipment_name) })
  })
  return [...equipments].sort()
})

const effectiveRange = computed(() => {
  if (filters.value.month) {
    const [y, m] = filters.value.month.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return {
      start: `${filters.value.month}-01`,
      end:   `${filters.value.month}-${String(last).padStart(2, '0')}`
    }
  }
  let minDate = '', maxDate = ''
  rentalsStore.rentals.forEach(inv => {
    const matchClient = !filters.value.client || inv.client_name === filters.value.client
    const matchSite = !filters.value.site || inv.site_name === filters.value.site
    if (!matchClient || !matchSite || !inv.rows) return
    inv.rows.forEach(r => {
      if (!r.start_date) return
      const matchEquipment = !filters.value.equipment || r.equipment_name === filters.value.equipment
      if (!matchEquipment) return
      if (!minDate || r.start_date < minDate) minDate = r.start_date
      const end = r.end_date || r.return_date || r.start_date
      if (!maxDate || end > maxDate) maxDate = end
    })
  })
  return { start: minDate, end: maxDate }
})

const chartDates = computed(() => {
  const dates = []
  const { start, end } = effectiveRange.value
  if (!start || !end) return dates
  const startD = new Date(start)
  const endD   = new Date(end)
  let current = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate())
  const endObj = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate())
  while (current <= endObj) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
})

const totalDays = computed(() => chartDates.value.length || 1)

const ganttTasks = computed(() => {
  const data = []
  const { start, end } = effectiveRange.value
  if (!start || !end) return data
  const filterStart = new Date(`${start} 00:00:00`)
  const filterEnd   = new Date(`${end} 23:59:59`)

  rentalsStore.rentals.forEach(inv => {
    const matchClient = !filters.value.client || inv.client_name === filters.value.client
    const matchSite = !filters.value.site || inv.site_name === filters.value.site
    if (matchClient && matchSite && inv.rows) {
      inv.rows.forEach((r, idx) => {
        const matchesDate = !!r.start_date
        const matchEquipment = !filters.value.equipment || r.equipment_name === filters.value.equipment
        const isShown = matchEquipment
        if (matchesDate && isShown) {
          const tStart = new Date(`${r.start_date} 00:00:00`)
          const tEnd = new Date(`${r.end_date || r.return_date || r.start_date} 23:59:59`)
          if (tStart <= filterEnd && tEnd >= filterStart) {
            const renderStart = tStart < filterStart ? filterStart : tStart
            const renderEnd = tEnd > filterEnd ? filterEnd : tEnd
            const offsetDays = Math.floor((renderStart - filterStart) / 86400000)
            const durationDays = Math.max(1, Math.ceil((renderEnd - renderStart) / 86400000))
            const actualDuration = Math.max(1, Math.ceil((tEnd - tStart) / 86400000))
            const leftPercent = (offsetDays / totalDays.value) * 100
            const widthPercent = (durationDays / totalDays.value) * 100
            const baseColor = COLORS.value[r.equipment_name] || (isDark.value ? '#475569' : '#94a3b8')
            const formattedStartDate = `${String(tStart.getMonth() + 1).padStart(2, '0')}/${String(tStart.getDate()).padStart(2, '0')}`
            data.push({
              id: `${inv.id}-${r.id || idx}`,
              text: `${inv.client_name || ''} ${r.equipment_name}*${r.quantity ?? ''}(${r.unit || ''})`,
              startDateStr: formattedStartDate, 
              actualDuration, leftPercent, widthPercent, color: baseColor,
              clientName: inv.client_name, siteName: inv.site_name, equipmentName: r.equipment_name,
              quantity: r.quantity, unit: r.unit, fullStartDate: r.start_date,
              fullEndDate: r.end_date || r.return_date || r.start_date,
              isOutOfrangeLeft: tStart < filterStart, isOutOfrangeRight: tEnd > filterEnd
            })
          }
        }
      })
    }
  })
  return data
})

// KPI 速覽數據（本月 + 進行中租賃）
const kpiData = computed(() => {
  const [y, m] = currentMonth.split('-').map(Number)
  const lastMonthDate = new Date(y, m - 2, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  let curRental = 0, lastRental = 0
  rentalsStore.rentals.forEach(inv => {
    const t = (inv.rows || []).reduce((s, r) => s + (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0), 0)
    if (inv.year_month === currentMonth) curRental += t
    if (inv.year_month === lastMonth) lastRental += t
  })

  let curFreight = 0, lastFreight = 0
  rentalsStore.freights.forEach(inv => {
    const t = (inv.rows || []).reduce((s, r) => s + (r.amount ?? 0), 0)
    if (inv.year_month === currentMonth) curFreight += t
    if (inv.year_month === lastMonth) lastFreight += t
  })

  const curTotal = Math.round(curRental + curFreight)
  const lastTotal = Math.round(lastRental + lastFreight)
  const growth = lastTotal > 0 ? Number((((curTotal - lastTotal) / lastTotal) * 100).toFixed(1)) : null

  const todayStr = new Date().toISOString().split('T')[0]
  let activeCount = 0
  rentalsStore.rentals.forEach(inv => {
    const isActive = (inv.rows || []).some(r => {
      if (!r.start_date) return false
      const endDate = r.end_date || r.return_date || r.start_date
      return r.start_date <= todayStr && endDate >= todayStr
    })
    if (isActive) activeCount++
  })

  return {
    curRental: Math.round(curRental),
    curFreight: Math.round(curFreight),
    curTotal,
    growth,
    activeCount,
  }
})

// ── 數字 count-up 動畫 ──────────────────────────────────────────────────────
const animatedKpi = reactive({ curTotal: 0, curRental: 0, curFreight: 0, activeCount: 0 })
const runningRAFs = {}
function countUp(end, key, duration = 1000) {
  if (runningRAFs[key]) cancelAnimationFrame(runningRAFs[key])
  const from = animatedKpi[key]
  if (from === end) return
  const t0 = performance.now()
  function step(now) {
    const t = Math.min((now - t0) / duration, 1)
    animatedKpi[key] = Math.round(from + (end - from) * (1 - Math.pow(1 - t, 3)))
    if (t < 1) runningRAFs[key] = requestAnimationFrame(step)
    else delete runningRAFs[key]
  }
  runningRAFs[key] = requestAnimationFrame(step)
}
watch(kpiData, (val) => {
  countUp(val.curTotal,   'curTotal',   1200)
  countUp(val.curRental,  'curRental',  1000)
  countUp(val.curFreight, 'curFreight', 1000)
  countUp(val.activeCount,'activeCount', 800)
}, { deep: true, immediate: true })
onUnmounted(() => Object.values(runningRAFs).forEach(cancelAnimationFrame))

// ── 甘特今日欄位索引 ─────────────────────────────────────────────────────────
const todayColumnIndex = computed(() => {
  const t = new Date()
  const todayStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
  return chartDates.value.findIndex(d => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === todayStr
  })
})

onMounted(() => {
  // 不使用 await 以避免阻塞組件初次渲染，且 store 內部已有快取機制
  inventoryStore.fetchInventory()
  inventoryStore.fetchEquipmentTypes() // 背景預取設備種類
  inventoryStore.fetchLogs()           // 背景預取庫存日誌
  rentalsStore.fetchAll()
  adminStore.fetchAll()
})
</script>

<template>
  <div class="h-full flex flex-col gap-3 overflow-hidden tech-bg">
    <!-- Row 1: KPI 速覽（橫向緊湊卡片） -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
      <!-- 本月總收入 -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 flex items-center gap-3 shadow-sm" style="animation-delay:0ms">
        <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">本月總收入</p>
          <p class="text-lg font-black font-mono-num text-slate-900 dark:text-white tracking-tight leading-tight">
            {{ animatedKpi.curTotal.toLocaleString() }}<span class="text-xs font-bold text-slate-400 ml-0.5">元</span>
          </p>
        </div>
        <span v-if="kpiData.growth !== null" class="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
          :class="kpiData.growth >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'">
          {{ kpiData.growth >= 0 ? '▲' : '▼' }} {{ Math.abs(kpiData.growth) }}%
        </span>
      </div>

      <!-- 本月租賃 -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 flex items-center gap-3 shadow-sm" style="animation-delay:80ms">
        <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">本月租賃</p>
          <p class="text-lg font-black font-mono-num text-slate-900 dark:text-white tracking-tight leading-tight">
            {{ animatedKpi.curRental.toLocaleString() }}<span class="text-xs font-bold text-slate-400 ml-0.5">元</span>
          </p>
        </div>
      </div>

      <!-- 本月運費 -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 flex items-center gap-3 shadow-sm" style="animation-delay:160ms">
        <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">本月運費</p>
          <p class="text-lg font-black font-mono-num text-slate-900 dark:text-white tracking-tight leading-tight">
            {{ animatedKpi.curFreight.toLocaleString() }}<span class="text-xs font-bold text-slate-400 ml-0.5">元</span>
          </p>
        </div>
      </div>

      <!-- 進行中租賃 -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 flex items-center gap-3 shadow-sm" style="animation-delay:240ms">
        <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">進行中租賃</p>
          <p class="text-lg font-black font-mono-num text-slate-900 dark:text-white tracking-tight leading-tight">
            {{ animatedKpi.activeCount }}<span class="text-xs font-bold text-slate-400 ml-0.5">筆</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Row 2: 篩選列（緊湊單行） -->
    <AppCard class="shrink-0">
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
        <select v-model="filters.client" class="h-8 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <option value="">全部客戶</option>
          <option v-for="name in adminStore.allCustomerNames" :key="name" :value="name">{{ name }}</option>
        </select>
        <select v-model="filters.site" class="h-8 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <option value="">全部工地</option>
          <option v-for="name in adminStore.allSiteNames" :key="name" :value="name">{{ name }}</option>
        </select>
        <select v-model="filters.equipment" class="h-8 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <option value="">全部設備</option>
          <option v-for="e in equipmentOptions" :key="e" :value="e">{{ e }}</option>
        </select>
        <MonthPicker v-model="filters.month" variant="indigo" dense show-all />
        <AppButton variant="soft-indigo" size="dense" @click="resetFilters">重設篩選</AppButton>
      </div>
    </AppCard>

    <!-- Row 3: 趨勢圖（大螢幕左 2/3）+ 庫存監控（右 1/3） -->
    <div class="flex flex-col lg:flex-row gap-3 shrink-0 lg:h-56">
      <section class="flex-1 lg:w-2/3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[250px] lg:min-h-0">
        <div class="px-4 py-2 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-1 h-3.5 bg-indigo-500 rounded-full"></span>
            <h2 class="text-xs font-semibold text-slate-900 dark:text-slate-100">近 6 個月請款趨勢</h2>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <svg width="14" height="6" viewBox="0 0 14 6"><line x1="0" y1="3" x2="14" y2="3" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="4 3"/></svg>
              <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">租賃</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <svg width="14" height="6" viewBox="0 0 14 6"><line x1="0" y1="3" x2="14" y2="3" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 3"/></svg>
              <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">運費</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <svg width="14" height="6" viewBox="0 0 14 6"><line x1="0" y1="3" x2="14" y2="3" stroke="#6366f1" stroke-width="2.5"/></svg>
              <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">總額</span>
            </div>
          </div>
        </div>
        <div class="flex-1 px-4 py-2 min-h-0">
          <RevenueChart :rentals="rentalsStore.rentals" :freights="rentalsStore.freights" :filters="filters" :compact="true" />
        </div>
      </section>

      <section class="lg:w-1/3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[250px] lg:min-h-0">
        <div class="px-4 py-2 border-b border-slate-100/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-baseline gap-2 shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-1 h-3.5 bg-emerald-600 rounded-full"></span>
            <h2 class="text-xs font-semibold text-slate-900 dark:text-slate-100">庫存即時監控</h2>
          </div>
        </div>
        <div class="flex-1 px-4 py-2 flex flex-col justify-around min-h-0 overflow-y-auto custom-scrollbar">
          <div v-for="stock in inventoryStore.stocks" :key="stock.id" class="flex items-center gap-2">
            <span class="w-16 text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">{{ stock.name }}</span>
            <div class="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :style="{ width: `${stock.total_quantity > 0 ? (stock.rented_out / stock.total_quantity) * 100 : 0}%` }"
                :class="stock.available <= 0 ? 'bg-rose-500' : (stock.rented_out / (stock.total_quantity || 1)) >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'">
              </div>
            </div>
            <span class="text-sm font-mono-num text-slate-600 dark:text-slate-400 shrink-0 w-10 text-right">
              {{ stock.available }}<span class="text-slate-300 dark:text-slate-600">/{{ stock.total_quantity }}</span>
            </span>
            <span class="text-[10px] px-1 py-0.5 rounded font-bold shrink-0 w-9 text-center"
              :class="stock.available <= 0 ? 'bg-rose-500 text-white animate-pulse' : (stock.rented_out / (stock.total_quantity || 1)) >= 0.8 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'">
              {{ stock.available <= 0 ? '缺貨' : (stock.rented_out / (stock.total_quantity || 1)) >= 0.8 ? '偏低' : '充足' }}
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- Row 4: 甘特圖（flex-1 填滿剩餘空間） -->
    <section class="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div class="px-4 py-2 border-b border-slate-100/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2">
          <span class="w-1 h-3.5 bg-indigo-600 rounded-full"></span>
          <h2 class="text-xs font-semibold text-slate-900 dark:text-slate-100">租賃時程視覺化</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div v-for="(color, name) in COLORS" :key="name" class="flex items-center gap-1.5 select-none px-1.5 py-1">
            <span class="w-2.5 h-2.5 rounded-full shadow-sm" :style="{ background: color }"></span>
            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ name }}</span>
          </div>
        </div>
      </div>
      <div class="flex-1 min-h-0 p-3">
        <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden h-full flex flex-col bg-white dark:bg-slate-900 text-sm">
          <div class="overflow-auto flex-1 relative custom-scrollbar">
            <div class="min-w-max md:min-w-0">
              <div class="flex sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                <div class="w-48 shrink-0 px-3 py-1 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 flex items-center text-xs">出租內容</div>
                <div class="w-24 shrink-0 px-2 py-1 border-r border-slate-200 dark:border-slate-700 sticky left-48 z-30 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs">開始日期</div>
                <div class="w-14 shrink-0 px-2 py-1 border-r border-slate-200 dark:border-slate-700 sticky left-72 z-30 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs">天數</div>
                <div class="flex flex-1 min-w-75">
                  <div v-for="(date, idx) in chartDates" :key="date.toISOString()" class="flex-1 min-w-5 border-r border-slate-200 dark:border-slate-700 text-center py-1 relative"
                    :class="idx === todayColumnIndex ? 'text-indigo-600 dark:text-indigo-400 font-black today-header' : 'text-slate-500 dark:text-slate-400'">
                    {{ String(date.getDate()).padStart(2, '0') }}
                  </div>
                </div>
              </div>
              <div v-for="task in ganttTasks" :key="task.id" class="flex border-b border-slate-100 dark:border-slate-800/60 group text-sm">
                <div class="w-48 shrink-0 px-3 py-1.5 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 truncate text-slate-800 dark:text-slate-300 transition-colors text-xs" @mousemove="handleMouseMove($event, task)" @mouseleave="handleMouseLeave">{{ task.text }}</div>
                <div class="w-24 shrink-0 px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 sticky left-48 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors text-xs">{{ task.startDateStr }}</div>
                <div class="w-14 shrink-0 px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 sticky left-72 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors text-xs">{{ task.actualDuration }}</div>
                <div class="flex flex-1 relative bg-transparent min-w-75 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/30 transition-colors">
                  <div class="absolute inset-0 flex pointer-events-none">
                    <div v-for="(_, idx) in chartDates" :key="idx" class="flex-1 min-w-5 border-r border-slate-100/50 dark:border-slate-800/30"></div>
                  </div>
                  <div class="relative py-0.5 w-full flex items-center">
                    <div class="absolute h-4 shadow-sm z-0 flex items-center px-1 text-[9px] font-semibold text-white overflow-hidden whitespace-nowrap transition-all duration-300 hover:opacity-90 cursor-default"
                      :style="{ left: `${task.leftPercent}%`, width: `${task.widthPercent}%`, backgroundColor: task.color, borderTopLeftRadius: task.isOutOfrangeLeft ? '0px' : '6px', borderBottomLeftRadius: task.isOutOfrangeLeft ? '0px' : '6px', borderTopRightRadius: task.isOutOfrangeRight ? '0px' : '6px', borderBottomRightRadius: task.isOutOfrangeRight ? '0px' : '6px' }"
                      @mousemove="handleMouseMove($event, task)" @mouseleave="handleMouseLeave">
                    </div>
                  </div>
                  <!-- 今日欄位 overlay（疊在底层，避免影響 Bar 顯示） -->
                  <div v-if="todayColumnIndex >= 0" class="absolute inset-y-0 pointer-events-none today-col z-0"
                    :style="{ left: `${(todayColumnIndex / totalDays) * 100}%`, width: `${(1 / totalDays) * 100}%` }">
                  </div>
                </div>
              </div>
              <div v-if="ganttTasks.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400 sticky left-0 w-full flex justify-center items-center h-50">目前沒有符合條件的租賃資料</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <GanttTooltip v-bind="tooltip" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { display: none; }
.custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ── 背景科技格線 ── */
@keyframes grid-drift {
  from { background-position: 0 0; }
  to   { background-position: 32px 32px; }
}
.tech-bg {
  background-image:
    linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px);
  background-size: 32px 32px;
  animation: grid-drift 16s linear infinite;
}
:global(.dark) .tech-bg {
  background-image:
    linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
}



/* ── 甘特今日欄位高亮 ── */
.today-col {
  background: linear-gradient(to bottom,
    rgba(99,102,241,0.10),
    rgba(99,102,241,0.04));
  border-left: 1px solid rgba(99,102,241,0.3);
  border-right: 1px solid rgba(99,102,241,0.3);
}

/* 今日 header 底部發光標記 */
.today-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: rgba(99,102,241,0.7);
  border-radius: 9999px;
}
</style>
