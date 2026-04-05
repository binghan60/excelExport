<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRentalsStore } from '../stores/rentals.js'
import { useAdminStore } from '../stores/admin.js'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import MonthPicker from '../components/MonthPicker.vue'
import ExportPreviewModal from '../components/base/ExportPreviewModal.vue'

const rentalsStore = useRentalsStore()
const adminStore = useAdminStore()

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const yearMonth = ref(currentMonth)
const filterClient = ref('')
const filterSite = ref('')
const openClients = ref(new Set())
const exportingSet = ref(new Set())
const errorMap = ref({})

const previewGroup = ref(null)

onMounted(() => {
  rentalsStore.fetchAll()
  adminStore.fetchAll()
})

function resetFilters() {
  yearMonth.value = currentMonth
  filterClient.value = ''
  filterSite.value = ''
}

const clientGroups = computed(() => {
  const ym = yearMonth.value
  const map = {}
  const clientFilter = filterClient.value
  const siteFilter = filterSite.value
  for (const inv of rentalsStore.rentals) {
    if (ym && inv.year_month !== ym) continue
    if (siteFilter && inv.site_name !== siteFilter) continue
    if (!map[inv.client_name]) map[inv.client_name] = { rentals: [], freights: [] }
    map[inv.client_name].rentals.push(inv)
  }
  for (const inv of rentalsStore.freights) {
    if (ym && inv.year_month !== ym) continue
    // 只有當工地篩選空白，或該客戶已有租賃資料時才帶入運費
    if (siteFilter && !map[inv.client_name]) continue
    if (!map[inv.client_name]) map[inv.client_name] = { rentals: [], freights: [] }
    map[inv.client_name].freights.push(inv)
  }
  return Object.entries(map)
    .filter(([name]) => !clientFilter || name === clientFilter)
    .sort(([a], [b]) => a.localeCompare(b, 'zh-TW'))
    .map(([client_name, data]) => ({
      client_name,
      ...data,
      rentalTotal: data.rentals.reduce((s, inv) =>
        s + (inv.rows || []).reduce((rs, r) =>
          rs + (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0), 0), 0),
      freightTotal: data.freights.reduce((s, inv) =>
        s + (inv.rows || []).reduce((rs, r) => rs + (r.amount ?? 0), 0), 0),
    }))
    .map(g => ({ ...g, subtotal: g.rentalTotal + g.freightTotal }))
})

function toggle(name) {
  if (openClients.value.has(name)) {
    openClients.value.delete(name)
  } else {
    openClients.value.add(name)
  }
  openClients.value = new Set(openClients.value)
}

function startExport(group) {
  previewGroup.value = group
}

async function exportSummary(groupArg) {
  const group = groupArg || previewGroup.value
  if (!group) return
  
  const key = group.client_name
  errorMap.value[key] = ''
  exportingSet.value.add(key)
  exportingSet.value = new Set(exportingSet.value)
  
  try {
    if (group.rentals.length === 0) {
      await api.exportQuotation(group.client_name, yearMonth.value)
    } else {
      for (const inv of group.rentals) {
        await api.exportRental(inv.id)
      }
      await api.exportSummary(group.client_name, yearMonth.value)
    }
    previewGroup.value = null // 若從預覽進入，完成後關閉
  } catch (e) {
    errorMap.value[key] = e.message
  } finally {
    exportingSet.value.delete(key)
    exportingSet.value = new Set(exportingSet.value)
  }
}

function fmt(num) {
  return num ? num.toLocaleString() : '0'
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <ExportPreviewModal
      :show="!!previewGroup"
      :group="previewGroup || {}"
      :year-month="yearMonth"
      :loading="exportingSet.has(previewGroup?.client_name)"
      @confirm="exportSummary()"
      @cancel="previewGroup = null"
    />
    <!-- 頁面標題 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">月結報表總覽</h1>
        <p class="text-base font-medium text-slate-400 dark:text-slate-500">帳務匯總與報表產製</p>
      </div>
    </div>

    <!-- 篩選面板 -->
    <AppCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">月份</label>
          <MonthPicker v-model="yearMonth" variant="violet" dense show-all />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶</label>
          <select v-model="filterClient" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-violet-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部客戶</option>
            <option v-for="name in adminStore.allCustomerNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地</label>
          <select v-model="filterSite" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-violet-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部工地</option>
            <option v-for="name in adminStore.allSiteNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
        <AppButton variant="soft-violet" size="dense" @click="resetFilters">重設篩選</AppButton>
      </div>
    </AppCard>

    <!-- 空狀態 -->
    <div v-if="clientGroups.length === 0" class="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
      <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <p class="text-base font-medium text-slate-400 dark:text-slate-500">{{ yearMonth }} 尚無結算數據</p>
    </div>

    <!-- 廠商分組列表 -->
    <div v-else class="space-y-4">
      <div
        v-for="group in clientGroups"
        :key="group.client_name"
        class="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ease-out shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)]"
        :class="openClients.has(group.client_name)
          ? 'border-violet-400/70 dark:border-violet-600/70 ring-4 ring-violet-50 dark:ring-violet-950/50 shadow-[0_4px_16px_0_rgba(124,58,237,0.08)]'
          : 'border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/80 dark:hover:border-slate-600/80 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.04)]'"
      >
        <!-- 手風琴標題 -->
        <div class="flex flex-col md:flex-row items-center justify-between px-6 py-4 cursor-pointer gap-4 transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 select-none" @click="toggle(group.client_name)">
          <div class="flex items-center gap-4 flex-1">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
              :class="openClients.has(group.client_name)
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200" :class="{ 'rotate-180': openClients.has(group.client_name) }"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">{{ group.client_name }}</h3>
              <div class="flex gap-2 mt-1">
                <span v-if="group.rentals.length" class="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded border border-blue-100 dark:border-blue-900">租賃 ×{{ group.rentals.length }}</span>
                <span v-if="group.freights.length" class="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded border border-amber-100 dark:border-amber-900">運費 ×{{ group.freights.length }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-right">
              <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">本月應收（未稅）</p>
              <p class="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono-num">{{ fmt(group.subtotal) }} <span class="text-xs font-normal text-slate-400 dark:text-slate-500">元</span></p>
            </div>

            <div class="flex items-center gap-2">
              <!-- 預覽按鈕 (眼睛圖示) - 恢復為點擊觸發 -->
              <button
                class="relative group/btn w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-violet-600 hover:text-white transition-all duration-300 active:scale-90"
                @click.stop="startExport(group)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                
                <!-- Hover 提示文字 -->
                <span class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                  預覽對帳單
                </span>
              </button>

              <!-- 匯出按鈕 (原文字按鈕) -->
              <AppButton
                variant="violet"
                size="md"
                :loading="exportingSet.has(group.client_name)"
                @click.stop="exportSummary(group)"
              >
                <template #icon>
                  <svg v-if="!exportingSet.has(group.client_name)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </template>
                匯出對帳單
              </AppButton>
            </div>
          </div>
        </div>

        <!-- 展開明細 -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="openClients.has(group.client_name)" class="px-6 pb-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/20 dark:bg-slate-800/20 space-y-8 pt-6">
            <div v-if="errorMap[group.client_name]" class="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900 font-semibold flex items-center gap-3 text-base">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ errorMap[group.client_name] }}
            </div>

            <!-- 租賃明細 -->
            <div v-for="inv in group.rentals" :key="'r'+inv.id" class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-1 h-4 bg-blue-500 rounded-full"></div>
                <h4 class="text-base font-semibold text-slate-700 dark:text-slate-300">租賃費用 — {{ inv.equipment_name }}</h4>
                <span v-if="inv.site_name" class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded">{{ inv.site_name }}</span>
              </div>
              <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                <table class="w-full text-center border-collapse min-w-160">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">出貨日</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">歸還日</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">數量</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">日租金</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">計費起</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">計費迄</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">天數</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide whitespace-nowrap">小計 (未稅)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono-num text-sm">
                    <tr v-for="(row, i) in inv.rows" :key="i" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ row.delivery_date || '—' }}</td>
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ row.return_date || '—' }}</td>
                      <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{{ row.quantity ?? '0' }}</td>
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ row.daily_rate ?? '0' }}</td>
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ row.start_date || '—' }}</td>
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ row.end_date || '—' }}</td>
                      <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{{ row.days ?? '0' }}</td>
                      <td class="px-4 py-3 text-blue-600 dark:text-blue-400 font-bold">{{ fmt((row.quantity??0)*(row.daily_rate??0)*(row.days??0)) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 運費明細 -->
            <div v-for="inv in group.freights" :key="'f'+inv.id" class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h4 class="text-base font-semibold text-slate-700 dark:text-slate-300">運輸費用明細</h4>
              </div>
              <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                <table class="w-full text-center border-collapse min-w-120">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide w-32 whitespace-nowrap">載運日期</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-left pl-8 whitespace-nowrap">路徑</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">內容</th>
                      <th class="px-4 py-2.5 text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide whitespace-nowrap">金額 (未稅)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                    <tr v-for="(row, i) in inv.rows" :key="i" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono-num">{{ row.date || '—' }}</td>
                      <td class="px-4 py-3 text-left pl-8 text-slate-600 dark:text-slate-300">{{ [row.route_from, row.route_to].filter(Boolean).join(' → ') || '—' }}</td>
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ row.cargo || '—' }}</td>
                      <td class="px-4 py-3 text-amber-600 dark:text-amber-400 font-bold font-mono-num">{{ row.amount != null ? fmt(row.amount) : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 當月結算 -->
            <div class="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end sm:items-end gap-4 sm:gap-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div class="space-y-2 text-right">
                <div v-if="group.rentals.length" class="flex items-center justify-end gap-4">
                  <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">租賃合計</span>
                  <span class="text-base font-bold text-slate-700 dark:text-slate-300 font-mono-num">{{ fmt(group.rentalTotal) }}</span>
                </div>
                <div v-if="group.freights.length" class="flex items-center justify-end gap-4">
                  <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">運費合計</span>
                  <span class="text-base font-bold text-slate-700 dark:text-slate-300 font-mono-num">{{ fmt(group.freightTotal) }}</span>
                </div>
              </div>

              <div class="text-right sm:border-l border-slate-200 dark:border-slate-700 sm:pl-8">
                <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">未稅小計</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono-num">{{ fmt(group.subtotal) }}</p>
              </div>

              <div class="text-right border-l-2 border-violet-500 dark:border-violet-600 pl-6 sm:pl-8">
                <p class="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wide mb-1">含稅總計（5%）</p>
                <p class="text-3xl font-bold text-violet-600 dark:text-violet-400 font-mono-num">{{ fmt(group.subtotal + Math.round(group.subtotal * 0.05)) }} <span class="text-sm font-normal text-slate-400 dark:text-slate-500">元</span></p>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
