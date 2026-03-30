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
const filters = ref({ client: '', site: '', month: currentMonth })
const expandedId = ref(null)

onMounted(() => store.fetchAll())

const options = computed(() => {
  const clients = new Set(), sites = new Set()
  store.freights.forEach(f => {
    if (f.client_name) clients.add(f.client_name)
    if (Array.isArray(f.rows)) {
      f.rows.forEach(r => {
        if (r.route_from) sites.add(r.route_from)
        if (r.route_to) sites.add(r.route_to)
      })
    }
  })
  return { clients: [...clients].sort(), sites: [...sites].sort() }
})

const filteredFreights = computed(() => store.freights.filter(f => {
  const hasSiteMatch = !filters.value.site || (f.rows && f.rows.some(r => r.route_from === filters.value.site || r.route_to === filters.value.site))
  return (!filters.value.client || f.client_name === filters.value.client) &&
         hasSiteMatch &&
         (!filters.value.month || f.year_month === filters.value.month)
}))

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }
async function remove(id) { if (confirm('確定要刪除這筆運費請款單？')) await store.deleteFreight(id) }
function resetFilters() { filters.value = { client: '', site: '', month: currentMonth } }
function fmt(n) { return n != null ? Number(n).toLocaleString() : '—' }
function rowSubtotal(f) {
  return (f.rows || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <!-- 標題區域 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">運費請款單</h1>
        <p class="text-sm font-medium text-slate-400 dark:text-slate-500">運輸費用記錄與管理</p>
      </div>
      <AppButton variant="amber" size="lg" @click="router.push('/freights/new')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </template>
        新增運費單據
      </AppButton>
    </div>

    <!-- 篩選面板 -->
    <AppCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶</label>
          <select v-model="filters.client" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-amber-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部客戶</option>
            <option v-for="c in options.clients" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地</label>
          <select v-model="filters.site" class="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-amber-500 outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="">全部工地</option>
            <option v-for="s in options.sites" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">月份</label>
          <MonthPicker v-model="filters.month" variant="amber" dense />
        </div>
        <AppButton variant="soft-amber" size="dense" @click="resetFilters">重設篩選</AppButton>
      </div>
    </AppCard>

    <!-- 清單區域 -->
    <div v-if="store.loading" class="py-32 text-center text-sm text-slate-400 dark:text-slate-600">載入中...</div>

    <div v-else-if="filteredFreights.length === 0" class="py-32 flex flex-col items-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-30"><path d="M10 17h4V5H2v12h3m15 0h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
      <p class="text-base font-medium">找不到符合條件的運費單</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="f in filteredFreights"
        :key="f.id"
        class="group bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ease-out shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)]"
        :class="expandedId === f.id
          ? 'border-amber-400/70 dark:border-amber-600/70 ring-4 ring-amber-50 dark:ring-amber-950/40 shadow-[0_4px_16px_0_rgba(217,119,6,0.08)]'
          : 'border-slate-200/60 dark:border-slate-700/60 hover:border-amber-300/70 dark:hover:border-amber-700/70 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.04)]'"
      >
        <!-- ── 摘要列（可點擊展開） ── -->
        <div
          class="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
          @click="toggleExpand(f.id)"
        >
          <div class="flex items-center gap-4">
            <!-- 展開箭頭 + 圖示 -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
              :class="expandedId === f.id
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round"
                class="transition-transform duration-300"
                :class="{ 'rotate-90': expandedId === f.id }"
              ><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-3 flex-wrap">
                <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">{{ f.client_name }}</h3>
                <span class="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded border border-amber-100 dark:border-amber-900">運費帳單</span>
              </div>

            </div>
          </div>

          <div class="flex items-center gap-6">
            <!-- 月份 -->
            <div class="hidden md:block text-right border-r border-slate-100 dark:border-slate-700 pr-6">
              <p class="text-xs text-slate-400 dark:text-slate-500 mb-0.5">月份</p>
              <p class="text-base font-semibold text-slate-600 dark:text-slate-300 font-mono-num">{{ f.year_month }}</p>
            </div>
            <!-- 未稅合計 -->
            <div class="text-right border-r border-slate-100 dark:border-slate-700 pr-6">
              <p class="text-xs text-slate-400 dark:text-slate-500 mb-0.5">未稅合計</p>
              <p class="text-base font-bold text-amber-600 dark:text-amber-400 font-mono-num">{{ fmt(rowSubtotal(f)) }}</p>
            </div>
            <!-- 操作按鈕 -->
            <div class="flex items-center gap-2">
              <button
                @click.stop="router.push(`/freights/${f.id}`)"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60 hover:bg-amber-500 hover:text-white hover:border-transparent transition-all duration-300 ease-out active:scale-[0.95] hover:shadow-[0_2px_8px_0_rgba(217,119,6,0.3)]"
                title="編輯"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                @click.stop="remove(f.id)"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/60 hover:bg-red-600 hover:text-white hover:border-transparent transition-all duration-300 ease-out active:scale-[0.95] hover:shadow-[0_2px_8px_0_rgba(239,68,68,0.3)]"
                title="刪除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- ── 展開明細 ── -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="expandedId === f.id" class="border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/20 px-6 pb-6 pt-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <table class="w-full border-collapse min-w-140">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap w-10">#</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap w-28">運輸日期</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">運輸路線 (起點 ➔ 迄點)</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap w-56">載運品項</th>
                    <th class="px-4 py-3 text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide text-right pr-6 whitespace-nowrap w-32">金額（未稅）</th>
                    <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap w-64">備註</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                  <tr
                    v-for="(row, i) in f.rows"
                    :key="i"
                    class="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors"
                  >
                    <td class="px-4 py-3 text-center text-slate-300 dark:text-slate-600 font-semibold text-xs">{{ i + 1 }}</td>
                    <td class="px-4 py-3 font-mono-num text-sm text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">{{ row.date || '—' }}</td>
                    <td class="px-4 py-3 text-sm whitespace-nowrap">
                      <div class="flex items-center justify-center gap-3">
                        <span class="text-slate-700 dark:text-slate-300 font-medium w-20 text-right truncate" :title="row.route_from">{{ row.route_from || '—' }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 dark:text-slate-500 shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        <span class="text-slate-700 dark:text-slate-300 font-medium w-20 text-left truncate" :title="row.route_to">{{ row.route_to || '—' }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{{ row.cargo || '—' }}</td>
                    <td class="px-4 py-3 text-right pr-6 font-mono-num font-bold text-amber-600 dark:text-amber-400 text-sm whitespace-nowrap">
                      {{ row.amount != null && row.amount !== '' ? fmt(row.amount) : '—' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">{{ row.notes || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 結算小計 -->
            <div class="flex flex-col items-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <div class="flex items-center gap-10 text-slate-500 dark:text-slate-400">
                <span class="text-xs font-semibold uppercase tracking-wide">運費小計（未稅）</span>
                <span class="text-base font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-28 text-right">{{ fmt(rowSubtotal(f)) }} <small class="text-xs font-normal">元</small></span>
              </div>
              <div class="flex items-center gap-10 text-slate-500 dark:text-slate-400">
                <span class="text-xs font-semibold uppercase tracking-wide">營業稅額（5%）</span>
                <span class="text-base font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-28 text-right">{{ fmt(Math.round(rowSubtotal(f) * 0.05)) }} <small class="text-xs font-normal">元</small></span>
              </div>
              <div class="w-40 h-px bg-slate-200 dark:bg-slate-700 my-0.5"></div>
              <div class="flex items-center gap-10">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">含稅總計</span>
                </div>
                <span class="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono-num w-28 text-right">
                  {{ fmt(rowSubtotal(f) + Math.round(rowSubtotal(f) * 0.05)) }}
                  <small class="text-sm font-semibold opacity-60">元</small>
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
