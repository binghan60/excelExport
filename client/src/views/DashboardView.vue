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

const COLORS_LIGHT = { '土桶': '#2563eb', '鋼軌': '#d97706', '鐵板': '#e11d48', '鐵網': '#7e22ce' }
const COLORS_DARK  = { '土桶': '#1e40af', '鋼軌': '#92400e', '鐵板': '#9f1239', '鐵網': '#4c1d95' }
const COLORS = computed(() => isDark.value ? COLORS_DARK : COLORS_LIGHT)

const today = new Date()
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

const filters = ref({ startDate: formatDate(firstDay), endDate: formatDate(lastDay), client: '', site: '', equipmentTypes: [] })
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function resetFilters() { filters.value = { startDate: formatDate(firstDay), endDate: formatDate(lastDay), client: '', site: '', equipmentTypes: equipmentOptions.value } }

const equipmentOptions = computed(() => [...new Set(rentalsStore.rentals.map(r => r.equipment_name))])

const options = computed(() => {
  const clients = new Set(), sites = new Set()
  rentalsStore.rentals.forEach(inv => {
    if (inv.client_name) clients.add(inv.client_name)
    if (inv.site_name) sites.add(inv.site_name)
  })
  return { clients: [...clients].sort(), sites: [...sites].sort() }
})

watch(() => rentalsStore.rentals, (nv) => { if (nv.length > 0 && filters.value.equipmentTypes.length === 0) filters.value.equipmentTypes = equipmentOptions.value }, { immediate: true })

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
    const matchType = filters.value.equipmentTypes.includes(inv.equipment_name)
    if (matchClient && matchSite && matchType && inv.rows) {
      const baseColor = COLORS.value[inv.equipment_name] || (isDark.value ? '#334155' : '#64748b')
      inv.rows.filter(r => r.start_date).forEach((r, idx) => {
        data.push({
          id: `${inv.id}-${r.id}-${idx}`,
          text: `${inv.client_name} ${inv.equipment_name}*${r.quantity ?? ''}(${inv.unit})`,
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶</label>
          <select v-model="filters.client" class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部客戶</option>
            <option v-for="c in options.clients" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地</label>
          <select v-model="filters.site" class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部工地</option>
            <option v-for="s in options.sites" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">日期監控區間</label>
          <DateRangePicker
            block
            :start-date="filters.startDate"
            :end-date="filters.endDate"
            @update:start-date="filters.startDate = $event"
            @update:end-date="filters.endDate = $event"
          />
        </div>
        <AppButton variant="secondary" @click="resetFilters">重設篩選</AppButton>
      </div>
      <div v-if="equipmentOptions.length" class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
        <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">顯示設備類別</label>
        <div class="flex flex-wrap gap-2">
          <label v-for="type in equipmentOptions" :key="type" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <input type="checkbox" :value="type" v-model="filters.equipmentTypes" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-300">{{ type }}</span>
          </label>
        </div>
      </div>
    </AppCard>

    <!-- 2. 請款趨勢圖 -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center gap-2.5">
        <span class="w-1 h-4 bg-indigo-500 rounded-full"></span>
        <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">近 6 個月請款趨勢</h2>
      </div>
      <div class="p-6">
        <RevenueChart :rentals="rentalsStore.rentals" :freights="rentalsStore.freights" />
      </div>
    </section>

    <!-- 4. 庫存報表 -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center gap-2.5">
        <span class="w-1 h-4 bg-blue-600 rounded-full"></span>
        <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">設備庫存現況</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">項目名稱</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">總儲量</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">外借中</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">在庫可用</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">庫存狀態</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr v-for="stock in inventoryStore.stocks" :key="stock.id" class="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-base">{{ stock.name }}</td>
              <td class="px-6 py-4 text-center font-mono-num font-semibold text-slate-600 dark:text-slate-300 text-sm">{{ stock.total_quantity }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal ml-0.5">{{ stock.unit }}</span></td>
              <td class="px-6 py-4 text-center font-mono-num font-semibold text-blue-600 dark:text-blue-400 text-sm">{{ stock.rented_out }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal ml-0.5">{{ stock.unit }}</span></td>
              <td class="px-6 py-4 text-center">
                <span class="font-mono-num font-bold text-lg" :class="stock.available <= 0 ? 'text-red-500' : stock.available < 5 ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'">{{ stock.available }}</span>
                <span class="text-xs text-slate-400 dark:text-slate-500 ml-1">{{ stock.unit }}</span>
              </td>
              <td class="px-6 py-4">
                <span v-if="stock.available <= 0" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900">缺貨中</span>
                <span v-else-if="stock.available < 5" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">存量低</span>
                <span v-else class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">供應充足</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 5. 甘特圖 -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-1 h-4 bg-blue-600 rounded-full"></span>
          <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">租賃時程視覺化</h2>
        </div>
        <div class="flex items-center gap-4">
          <div v-for="(color, name) in COLORS" :key="name" class="flex items-center gap-1.5">
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
