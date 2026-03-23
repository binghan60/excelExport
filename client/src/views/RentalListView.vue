<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRentalsStore } from '../stores/rentals.js'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import MonthPicker from '../components/MonthPicker.vue'

const router = useRouter()
const store = useRentalsStore()

const currentMonth = new Date().toISOString().slice(0, 7)
const filters = ref({ client: '', site: '', equipment: '', month: currentMonth })
const expandedId = ref(null)

onMounted(() => store.fetchAll())

const options = computed(() => {
  const clients = new Set(), sites = new Set(), equipments = new Set()
  store.rentals.forEach(inv => {
    if (inv.client_name) clients.add(inv.client_name)
    if (inv.site_name) sites.add(inv.site_name)
    if (inv.equipment_name) equipments.add(inv.equipment_name)
  })
  return { clients: [...clients].sort(), sites: [...sites].sort(), equipments: [...equipments].sort() }
})

const filteredRentals = computed(() => store.rentals.filter(inv => {
  return (!filters.value.client || inv.client_name === filters.value.client) &&
         (!filters.value.site || inv.site_name === filters.value.site) &&
         (!filters.value.equipment || inv.equipment_name === filters.value.equipment) &&
         (!filters.value.month || inv.year_month === filters.value.month)
}))

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }
async function remove(id) { if (confirm('確定要刪除這筆請款單？')) await store.deleteRental(id) }
function resetFilters() { filters.value = { client: '', site: '', equipment: '', month: currentMonth } }
function fmt(n) { return n ? n.toLocaleString() : '0' }
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <!-- 標題區域 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">租賃請款紀錄</h1>
        <p class="text-sm font-medium text-slate-400 dark:text-slate-500">帳務歷史與明細審閱</p>
      </div>
      <AppButton size="lg" @click="router.push('/rentals/new')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </template>
        建立新單據
      </AppButton>
    </div>

    <!-- 篩選面板 -->
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
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">月份</label>
          <MonthPicker v-model="filters.month" />
        </div>
        <AppButton variant="secondary" @click="resetFilters">重設篩選</AppButton>
      </div>
    </AppCard>

    <div v-if="store.loading" class="py-32 text-center text-sm text-slate-400 dark:text-slate-600">載入中...</div>

    <div v-else-if="filteredRentals.length === 0" class="py-32 flex flex-col items-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-30"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p class="text-base font-medium">找不到符合條件的單據</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="inv in filteredRentals" :key="inv.id"
        class="group bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ease-out shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)]"
        :class="expandedId === inv.id ? 'border-blue-400/70 dark:border-blue-600/70 ring-4 ring-blue-50 dark:ring-blue-950/50 shadow-[0_4px_16px_0_rgba(37,99,235,0.08)]' : 'border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/80 dark:hover:border-slate-600/80 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.04)]'"
      >
        <!-- 簡項視圖 -->
        <div class="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer" @click="toggleExpand(inv.id)">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
              :class="expandedId === inv.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-500'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200" :class="{ 'rotate-90': expandedId === inv.id }"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">{{ inv.client_name }}</h3>
                <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded border border-blue-100 dark:border-blue-900">{{ inv.equipment_name }}</span>
              </div>
              <p v-if="inv.site_name" class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ inv.site_name }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="hidden md:block text-right border-r border-slate-100 dark:border-slate-700 pr-6">
              <p class="text-xs text-slate-400 dark:text-slate-500 mb-0.5">月份</p>
              <p class="text-sm font-semibold text-slate-600 dark:text-slate-300 font-mono-num">{{ inv.year_month }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click.stop="router.push(`/rentals/${inv.id}`)" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-blue-600 hover:text-white transition-all duration-300 ease-out active:scale-[0.95] border border-slate-200/60 dark:border-slate-700/60 hover:border-transparent hover:shadow-[0_2px_8px_0_rgba(37,99,235,0.3)]" title="編輯">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button @click.stop="remove(inv.id)" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-red-500 hover:text-white transition-all duration-300 ease-out active:scale-[0.95] border border-slate-200/60 dark:border-slate-700/60 hover:border-transparent" title="刪除">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 展開細節 -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="expandedId === inv.id" class="px-6 pb-6 pt-0 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/20">
            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-4">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">狀態</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">出貨 / 歸還</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">數量</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">計費區間</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">天數</th>
                    <th class="px-4 py-3 text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide text-right pr-6 whitespace-nowrap">小計 (未稅)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                  <tr v-for="(row, rIdx) in inv.rows" :key="rIdx" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="px-4 py-3 text-center whitespace-nowrap">
                      <span v-if="row.is_continued" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs">續租</span>
                      <span v-else class="text-slate-300 dark:text-slate-600 text-sm">—</span>
                    </td>
                    <td class="px-4 py-3 font-mono-num text-sm text-center whitespace-nowrap">
                      <span class="text-slate-700 dark:text-slate-300 font-semibold">{{ row.delivery_date || '—' }}</span>
                      <span class="mx-2 text-slate-300 dark:text-slate-600">/</span>
                      <span class="text-slate-500 dark:text-slate-400">{{ row.return_date || '—' }}</span>
                    </td>
                    <td class="px-4 py-3 text-center whitespace-nowrap">
                      <span class="font-mono-num font-semibold text-slate-800 dark:text-slate-200 text-sm">{{ row.quantity || '0' }}</span>
                      <span class="text-xs text-slate-400 dark:text-slate-500 ml-1">{{ inv.unit }}</span>
                    </td>
                    <td class="px-4 py-3 font-mono-num text-sm text-center whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {{ row.start_date || '—' }}<span class="mx-1.5 text-slate-300 dark:text-slate-600">~</span>{{ row.end_date || '—' }}
                    </td>
                    <td class="px-4 py-3 text-center whitespace-nowrap">
                      <span class="font-mono-num font-semibold text-slate-800 dark:text-slate-200 text-sm">{{ row.days || '0' }}</span>
                      <span class="text-xs text-slate-400 dark:text-slate-500 ml-1">天</span>
                    </td>
                    <td class="px-4 py-3 text-right pr-6 font-mono-num font-bold text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">
                      {{ fmt((row.quantity??0)*(row.daily_rate??0)*(row.days??0)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
