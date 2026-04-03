<script setup>
import { onMounted, ref, computed } from 'vue'
import { useInventoryStore } from '../stores/inventory.js'
import { useRentalsStore } from '../stores/rentals.js'
import { useAdminStore } from '../stores/admin.js'
import { useTheme } from '../composables/useTheme.js'

import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import RevenueChart from '../components/RevenueChart.vue'

const inventoryStore = useInventoryStore()
const rentalsStore = useRentalsStore()
const adminStore = useAdminStore()
const { isDark } = useTheme()

const hiddenEquipmentTypes = ref([])
const toggleEquipmentType = (type) => {
  if (hiddenEquipmentTypes.value.includes(type)) {
    hiddenEquipmentTypes.value = hiddenEquipmentTypes.value.filter(t => t !== type)
  } else {
    hiddenEquipmentTypes.value.push(type)
  }
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

function resetFilters() { 
  filters.value = { startDate: formatDate(firstDay), endDate: formatDate(lastDay), client: '', site: '', equipment: '' } 
}

const equipmentOptions = computed(() => {
  const equipments = new Set()
  rentalsStore.rentals.forEach(inv => {
    if (inv.rows) inv.rows.forEach(r => { if (r.equipment_name) equipments.add(r.equipment_name) })
  })
  return [...equipments].sort()
})

// === 純 CSS 甘特圖資料計算 ===
const chartDates = computed(() => {
  const dates = []
  if (!filters.value.startDate || !filters.value.endDate) return dates
  const start = new Date(filters.value.startDate)
  const end = new Date(filters.value.endDate)
  
  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endObj = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  
  while (current <= endObj) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
})

// 為了計算百分比，需要先知道目前的總天數
const totalDays = computed(() => chartDates.value.length || 1)

const ganttTasks = computed(() => {
  const data = []
  if (!filters.value.startDate || !filters.value.endDate) return data
  
  const filterStart = new Date(`${filters.value.startDate} 00:00:00`)
  const filterEnd = new Date(`${filters.value.endDate} 23:59:59`)

  rentalsStore.rentals.forEach(inv => {
    const matchClient = !filters.value.client || inv.client_name === filters.value.client
    const matchSite = !filters.value.site || inv.site_name === filters.value.site
    
    if (matchClient && matchSite && inv.rows) {
      inv.rows.forEach((r, idx) => {
        const matchesDate = !!r.start_date
        const matchesEquipment = !filters.value.equipment || r.equipment_name === filters.value.equipment
        const isShown = !hiddenEquipmentTypes.value.includes(r.equipment_name)
        
        if (matchesDate && matchesEquipment && isShown) {
          const tStart = new Date(`${r.start_date} 00:00:00`)
          const tEnd = new Date(`${r.end_date || r.return_date || r.start_date} 23:59:59`)

          // 判斷是否在查詢區間內交疊
          if (tStart <= filterEnd && tEnd >= filterStart) {
            // 計算實際顯示的起迄範圍 (限制在查詢區間內)
            const renderStart = tStart < filterStart ? filterStart : tStart
            const renderEnd = tEnd > filterEnd ? filterEnd : tEnd

            // 計算天數與位移
            const offsetDays = Math.floor((renderStart - filterStart) / 86400000)
            const durationDays = Math.max(1, Math.ceil((renderEnd - renderStart) / 86400000))
            const actualDuration = Math.max(1, Math.ceil((tEnd - tStart) / 86400000))

            // 轉換為百分比 (%) 來畫圖
            const leftPercent = (offsetDays / totalDays.value) * 100
            const widthPercent = (durationDays / totalDays.value) * 100

            const baseColor = COLORS.value[r.equipment_name] || (isDark.value ? '#475569' : '#94a3b8')

            // 將原本的 YYYY-MM-DD 轉為 MM/DD 格式
            const formattedStartDate = `${String(tStart.getMonth() + 1).padStart(2, '0')}/${String(tStart.getDate()).padStart(2, '0')}`

            data.push({
              id: `${inv.id}-${r.id || idx}`,
              text: `${inv.client_name || ''} ${r.equipment_name}*${r.quantity ?? ''}(${r.unit || ''})`,
              startDateStr: formattedStartDate, 
              actualDuration,
              leftPercent,
              widthPercent,
              color: baseColor,
              // 若超出顯示範圍，處理邊角的圓角樣式
              isOutOfrangeLeft: tStart < filterStart,
              isOutOfrangeRight: tEnd > filterEnd
            })
          }
        }
      })
    }
  })
  return data
})

onMounted(async () => {
  await Promise.all([inventoryStore.fetchInventory(), rentalsStore.fetchAll(), adminStore.fetchAll()])
})
</script>

<template>
  <div class="max-w-350 mx-auto space-y-6">
    <AppCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶</label>
          <select v-model="filters.client" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部客戶</option>
            <option v-for="name in adminStore.allCustomerNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地</label>
          <select v-model="filters.site" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部工地</option>
            <option v-for="name in adminStore.allSiteNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">設備</label>
          <select v-model="filters.equipment" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部設備</option>
            <option v-for="e in equipmentOptions" :key="e" :value="e">{{ e }}</option>
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

    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center gap-2.5">
        <span class="w-1 h-4 bg-indigo-500 rounded-full"></span>
        <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">近 6 個月請款趨勢</h2>
      </div>
      <div class="p-6">
        <RevenueChart :rentals="rentalsStore.rentals" :freights="rentalsStore.freights" :filters="filters" />
      </div>
    </section>

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

    <section class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <span class="w-1 h-4 bg-indigo-600 rounded-full"></span>
          <h2 class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">租賃時程視覺化</h2>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <div v-for="(color, name) in COLORS" :key="name" 
            class="flex items-center gap-1.5 cursor-pointer select-none transition-all duration-200"
            :class="hiddenEquipmentTypes.includes(name) ? 'opacity-30 grayscale-[0.5]' : 'opacity-100'"
            @click="toggleEquipmentType(name)"
          >
            <span class="w-2.5 h-2.5 rounded-full shadow-sm" :style="{ background: color }"></span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ name }}</span>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden relative h-[400px] flex flex-col bg-white dark:bg-slate-900 text-sm">
          
          <div class="overflow-auto flex-1 relative custom-scrollbar">
            <div class="min-w-max md:min-w-0">
              
              <div class="flex sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                <div class="w-[160px] shrink-0 px-4 py-2 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 flex items-center">出租內容</div>
                <div class="w-[90px] shrink-0 px-2 py-2 border-r border-slate-200 dark:border-slate-700 sticky left-[160px] z-30 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">開始日期</div>
                <div class="w-[50px] shrink-0 px-2 py-2 border-r border-slate-200 dark:border-slate-700 sticky left-[250px] z-30 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">天數</div>
                
                <div class="flex flex-1 min-w-[300px]">
                  <div v-for="date in chartDates" :key="date.toISOString()" class="flex-1 min-w-[20px] border-r border-slate-200 dark:border-slate-700 text-center py-2 text-slate-500 dark:text-slate-400 text-xs">
                    {{ String(date.getDate()).padStart(2, '0') }}
                  </div>
                </div>
              </div>

              <div v-for="task in ganttTasks" :key="task.id" class="flex border-b border-slate-100 dark:border-slate-800/60 group">
                <div class="w-[160px] shrink-0 px-4 py-2.5 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 truncate text-slate-800 dark:text-slate-300 transition-colors" :title="task.text">
                  {{ task.text }}
                </div>
                <div class="w-[90px] shrink-0 px-2 py-2.5 border-r border-slate-200 dark:border-slate-700 sticky left-[160px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors">
                  {{ task.startDateStr }}
                </div>
                <div class="w-[50px] shrink-0 px-2 py-2.5 border-r border-slate-200 dark:border-slate-700 sticky left-[250px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors">
                  {{ task.actualDuration }}
                </div>

                <div class="flex flex-1 relative bg-transparent min-w-[300px] group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/30 transition-colors">
                  <div class="absolute inset-0 flex pointer-events-none">
                    <div v-for="n in chartDates.length" :key="n" class="flex-1 min-w-[20px] border-r border-slate-100/50 dark:border-slate-800/30"></div>
                  </div>
                  
                  <div class="relative py-2 w-full flex items-center">
                    <div 
                      class="absolute h-[26px] shadow-sm z-0 flex items-center px-1.5 text-[10px] sm:text-xs font-semibold text-white overflow-hidden whitespace-nowrap transition-all duration-300 hover:opacity-90"
                      :style="{ 
                        left: `${task.leftPercent}%`, 
                        width: `${task.widthPercent}%`,
                        backgroundColor: task.color,
                        borderTopLeftRadius: task.isOutOfrangeLeft ? '0px' : '6px',
                        borderBottomLeftRadius: task.isOutOfrangeLeft ? '0px' : '6px',
                        borderTopRightRadius: task.isOutOfrangeRight ? '0px' : '6px',
                        borderBottomRightRadius: task.isOutOfrangeRight ? '0px' : '6px',
                      }"
                      :title="`${task.text}\n開始: ${task.startDateStr}\n天數: ${task.actualDuration} 天`"
                    >
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="ganttTasks.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400 sticky left-0 w-full flex justify-center items-center h-[200px]">
                目前沒有符合條件的租賃資料
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 隱藏滾動條但保持原本的滾動功能 (無痕滾動) */
.custom-scrollbar {
  -ms-overflow-style: none;  /* 適用於 IE 與 Edge */
  scrollbar-width: none;     /* 適用於 Firefox */
}
.custom-scrollbar::-webkit-scrollbar {
  display: none;             /* 適用於 Chrome, Safari 與 Opera */
}
</style>