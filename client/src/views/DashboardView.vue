<script setup>
import { onMounted, ref, watch, onUnmounted, nextTick, computed } from 'vue'
import { useInventoryStore } from '../stores/inventory.js'
import { useRentalsStore } from '../stores/rentals.js'
import { useTheme } from '../composables/useTheme.js'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import RevenueChart from '../components/RevenueChart.vue'

const inventoryStore = useInventoryStore()
const rentalsStore = useRentalsStore()
const ganttContainer = ref(null)
const { isDark } = useTheme()

const hiddenEquipmentTypes = ref([])
const toggleEquipmentType = (type) => {
  if (hiddenEquipmentTypes.value.includes(type)) {
    hiddenEquipmentTypes.value = hiddenEquipmentTypes.value.filter(t => t !== type)
  } else {
    hiddenEquipmentTypes.value.push(type)
  }
  updateGanttData()
}

const COLORS_LIGHT = { '土桶': '#2563eb', '鋼軌': '#d97706', '鐵板': '#e11d48', '鐵網': '#7e22ce' }
const COLORS_DARK  = { '土桶': '#1e40af', '鋼軌': '#92400e', '鐵板': '#9f1239', '鐵網': '#4c1d95' }
const COLORS = computed(() => isDark.value ? COLORS_DARK : COLORS_LIGHT)

const today = new Date()
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

const filters = ref({ startDate: formatDate(firstDay), endDate: formatDate(lastDay), client: '', site: '', equipment: '' })
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function resetFilters() { filters.value = { startDate: formatDate(firstDay), endDate: formatDate(lastDay), client: '', site: '', equipment: '' } }


const options = computed(() => {
  const clients = new Set(), sites = new Set(), equipments = new Set()
  rentalsStore.rentals.forEach(inv => {
    if (inv.client_name) clients.add(inv.client_name)
    if (inv.site_name) sites.add(inv.site_name)
    if (inv.rows) {
      inv.rows.forEach(r => { if (r.equipment_name) equipments.add(r.equipment_name) })
    }
  })
  return { 
    clients: [...clients].sort(), 
    sites: [...sites].sort(), 
    equipments: [...equipments].sort() 
  }
})



onMounted(async () => {
  await Promise.all([inventoryStore.fetchInventory(), rentalsStore.fetchAll()])
  initGantt()
  updateGanttData()
})

onUnmounted(() => gantt.clearAll())

function initGantt() {
  if (!ganttContainer.value) return
  gantt.config.readonly = true
  gantt.locale.labels.column_text = "出租明細 (客戶 品項*數量)"
  gantt.locale.labels.column_start_date = "開始"
  gantt.locale.labels.column_duration = "天數"
  gantt.config.columns = [
    { name: "text", label: "出租內容", width: 180 },
    { name: "start_date", label: "開始日期", align: "center", width: 100 },
    { name: "duration", label: "天數", align: "center", width: 60 }
  ]
  gantt.config.scales = [
    { unit: 'day', step: 1, format: '%d' }
  ]
  gantt.init(ganttContainer.value)
}

function updateGanttData() {
  gantt.config.start_date = new Date(filters.value.startDate); gantt.config.end_date = new Date(filters.value.endDate)
  const data = []
  rentalsStore.rentals.forEach(inv => {
    const matchClient = !filters.value.client || inv.client_name === filters.value.client
    const matchSite = !filters.value.site || inv.site_name === filters.value.site
    if (matchClient && matchSite && inv.rows) {
      inv.rows.filter(r => {
        const matchesDate = !!r.start_date
        const matchesEquipment = !filters.value.equipment || r.equipment_name === filters.value.equipment
        const isShown = !hiddenEquipmentTypes.value.includes(r.equipment_name)
        return matchesDate && matchesEquipment && isShown
      }).forEach((r, idx) => {
        const baseColor = COLORS.value[r.equipment_name] || (isDark.value ? '#475569' : '#94a3b8')
        data.push({
          id: `${inv.id}-${r.id || idx}`,
          text: `${inv.client_name} ${r.equipment_name}*${r.quantity ?? ''}(${r.unit || ''})`,
          start_date: new Date(`${r.start_date} 00:00:00`),
          end_date: new Date(`${r.end_date || r.return_date || r.start_date} 23:59:59`),
          color: baseColor, textColor: '#ffffff'
        })
      })
    }
  })
  gantt.clearAll(); gantt.parse({ data }); gantt.render()
}

watch(filters, () => { nextTick(() => updateGanttData()) }, { deep: true })
watch(() => rentalsStore.rentals, () => { nextTick(() => updateGanttData()) }, { deep: true })
watch(isDark, () => { nextTick(() => updateGanttData()) })
</script>

<template>
  <div class="max-w-350 mx-auto space-y-6">
    <!-- 1. 篩選面板 -->
    <AppCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶</label>
          <select v-model="filters.client" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部客戶</option>
            <option v-for="c in options.clients" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地</label>
          <select v-model="filters.site" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部工地</option>
            <option v-for="s in options.sites" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">設備</label>
          <select v-model="filters.equipment" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部設備</option>
            <option v-for="e in options.equipments" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">查詢區間</label>
          <DateRangePicker
            block
            variant="indigo"
            :start-date="filters.startDate"
            :end-date="filters.endDate"
            @update:start-date="filters.startDate = $event"
            @update:end-date="filters.endDate = $event"
          />
        </div>
        <AppButton variant="soft-indigo" size="dense" @click="resetFilters">重設篩選</AppButton>
      </div>
    </AppCard>

    <!-- 2. 請款趨勢圖 -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center gap-2.5">
        <span class="w-1 h-4 bg-indigo-500 rounded-full"></span>
        <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">近 6 個月請款趨勢</h2>
      </div>
      <div class="p-6">
        <RevenueChart :rentals="rentalsStore.rentals" :freights="rentalsStore.freights" :filters="filters" />
      </div>
    </section>

    <!-- 4. 庫存報表 -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center gap-2.5">
        <span class="w-1 h-4 bg-emerald-600 rounded-full"></span>
        <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">設備庫存現況</h2>
      </div>
      <div class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="stock in inventoryStore.stocks"
          :key="stock.id"
          class="rounded-xl border p-5 flex flex-col gap-3 transition-all duration-200"
          :class="stock.available <= 0
            ? 'border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20'
            : stock.total_quantity > 0 && (stock.rented_out / stock.total_quantity) >= 0.8
              ? 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20'
              : 'border-slate-100 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'"
        >
          <!-- 名稱 + 狀態標籤 -->
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ stock.name }}</span>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
              :class="stock.available <= 0
                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900'
                : stock.total_quantity > 0 && (stock.rented_out / stock.total_quantity) >= 0.8
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900'"
            >
              {{ stock.available <= 0 ? '缺貨中' : stock.total_quantity > 0 && (stock.rented_out / stock.total_quantity) >= 0.8 ? '存量低' : '供應充足' }}
            </span>
          </div>

          <!-- 進度條 -->
          <div>
            <div class="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
              <span>外借中 {{ stock.rented_out }} {{ stock.unit }}</span>
              <span>總計 {{ stock.total_quantity }} {{ stock.unit }}</span>
            </div>
            <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="stock.available <= 0
                  ? 'bg-red-500'
                  : stock.total_quantity > 0 && (stock.rented_out / stock.total_quantity) >= 0.8
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'"
                :style="{ width: stock.total_quantity > 0 ? Math.min(100, Math.round(stock.rented_out / stock.total_quantity * 100)) + '%' : '0%' }"
              ></div>
            </div>
            <div class="text-right text-xs text-slate-400 dark:text-slate-500 mt-1">
              使用率 {{ stock.total_quantity > 0 ? Math.min(100, Math.round(stock.rented_out / stock.total_quantity * 100)) : 0 }}%
            </div>
          </div>

          <!-- 可用數量 -->
          <div class="flex items-end gap-1.5 mt-1">
            <span
              class="text-4xl font-bold leading-none"
              :class="stock.available <= 0
                ? 'text-red-500'
                : stock.total_quantity > 0 && (stock.rented_out / stock.total_quantity) >= 0.8
                  ? 'text-amber-500'
                  : 'text-emerald-500 dark:text-emerald-400'"
            >{{ stock.available }}</span>
            <span class="text-base text-slate-400 dark:text-slate-500 mb-1">{{ stock.unit }} 可用</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 甘特圖 -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-1 h-4 bg-indigo-600 rounded-full"></span>
          <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">租賃時程視覺化</h2>
        </div>
        <div class="flex items-center gap-4">
          <div v-for="(color, name) in COLORS" :key="name" 
            class="flex items-center gap-1.5 cursor-pointer select-none transition-all duration-200"
            :class="hiddenEquipmentTypes.includes(name) ? 'opacity-30 grayscale-[0.5]' : 'opacity-100'"
            @click="toggleEquipmentType(name)"
          >
            <span class="w-2.5 h-2.5 rounded-full" :style="{ background: color }"></span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ name }}</span>
          </div>
        </div>
      </div>
      <div class="p-6">
        <div class="h-64 md:h-140 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden relative">
          <div ref="ganttContainer" class="w-full h-full"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
/* ── dhtmlx-gantt 暗色模式覆寫 ── */
.dark .gantt_container,
.dark .gantt_grid,
.dark .gantt_task { background: #0f172a; border-color: #334155; }

.dark .gantt_grid_scale,
.dark .gantt_task_scale { background: #1e293b; border-color: #334155; }

.dark .gantt_grid_head_cell,
.dark .gantt_scale_cell { color: #94a3b8; border-color: #334155; }

.dark .gantt_row,
.dark .gantt_row.odd { background: #0f172a; }
.dark .gantt_row:hover,
.dark .gantt_row.odd:hover { background: #1e293b; }

.dark .gantt_cell { border-color: #1e293b; color: #cbd5e1; }

.dark .gantt_task_row,
.dark .gantt_task_row.odd { background: #0f172a; }
.dark .gantt_task_cell { border-color: #1e293b; }
.dark .gantt_task_cell.weekend { background: #1e293b; }

.dark .gantt_grid_data .gantt_cell { border-color: #1e293b; }
.dark .gantt_ver_scroll,
.dark .gantt_hor_scroll { background: #1e293b; }
</style>
