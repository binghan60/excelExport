<script setup>
import { computed } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps({
  show: Boolean,
  group: {
    type: Object,
    default: () => ({})
  },
  yearMonth: String,
  loading: Boolean
})

const emit = defineEmits(['confirm', 'cancel'])

const tax = computed(() => Math.round((props.group.subtotal || 0) * 0.05))
const total = computed(() => (props.group.subtotal || 0) + tax.value)

function fmt(num) {
  return num ? num.toLocaleString() : '0'
}

// 扁平化所有項目以利預覽 (模擬後端 buildSummaryExcel 邏輯)
const allRows = computed(() => {
  const rows = []
  let seq = 1

  // 租賃部分
  if (props.group.rentals) {
    for (const inv of props.group.rentals) {
      // 從 equipment_names 陣列取得主要設備名稱，若無則從第一列 rows 取得
      const eqName = inv.equipment_names?.[0] || inv.rows?.[0]?.equipment_name || '設備'
      const unit = inv.unit || inv.rows?.[0]?.unit || '只'
      
      // 插入標題列
      rows.push({ isHeader: true, label: `【${eqName}租賃】${inv.site_name ? ' ' + inv.site_name : ''}` })
      for (const r of (inv.rows || [])) {
        rows.push({
          seq: seq++,
          item: `${r.equipment_name || eqName}租賃`,
          desc: r.delivery_date || '',
          qty: r.quantity ?? '',
          unit: r.unit || unit,
          price: r.daily_rate ?? '',
          start: r.start_date || '',
          end: r.end_date || '',
          days: r.days ?? '',
          subtotal: (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0),
          notes: r.notes || ''
        })
      }
    }
  }

  // 運費部分
  if (props.group.freights && props.group.freights.length > 0) {
    rows.push({ isHeader: true, label: '【運費項目】' })
    for (const inv of props.group.freights) {
      for (const r of (inv.rows || [])) {
        rows.push({
          seq: seq++,
          item: '運費',
          desc: r.date || '',
          qty: 1,
          unit: '趟',
          price: r.amount ?? '',
          start: '',
          end: '',
          days: '',
          subtotal: r.amount ?? 0,
          notes: [r.route_from, r.route_to].filter(Boolean).join(' → ') + (r.cargo ? ` (${r.cargo})` : '')
        })
      }
    }
  }

  return rows
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="emit('cancel')"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[95vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
            </div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">總請款單預覽 (Excel 格式還原)</h3>
          </div>
          <button @click="emit('cancel')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- 模擬 Excel 內容區 -->
        <div class="flex-1 overflow-auto p-4 md:p-8 bg-slate-100 dark:bg-slate-950">
          <div class="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 mx-auto min-w-[1000px] p-[1.5cm] font-['Microsoft_JhengHei'] text-black dark:text-slate-200">
            
            <!-- Excel 抬頭 -->
            <div class="text-center mb-8 space-y-1">
              <h1 class="text-2xl font-bold tracking-widest">友仁起重行</h1>
              <h2 class="text-xl font-bold tracking-widest">柏億起重工程有限公司</h2>
              <div class="pt-2">
                <h3 class="text-lg font-bold border-b-2 border-black dark:border-white inline-block px-12 pb-1">請 款 單</h3>
              </div>
            </div>

            <!-- 資訊列 -->
            <div class="grid grid-cols-11 border-t border-l border-black dark:border-slate-600 text-sm mb-0">
              <div class="col-span-2 bg-slate-50 dark:bg-slate-800/50 border-r border-b border-black dark:border-slate-600 p-2 font-bold text-center">廠商名稱</div>
              <div class="col-span-5 border-r border-b border-black dark:border-slate-600 p-2 px-4 font-bold">{{ group.client_name }}</div>
              <div class="col-span-2 bg-slate-50 dark:bg-slate-800/50 border-r border-b border-black dark:border-slate-600 p-2 font-bold text-center">年月</div>
              <div class="col-span-2 border-r border-b border-black dark:border-slate-600 p-2 text-center font-mono-num">{{ yearMonth }}</div>
            </div>

            <!-- 表格主體 -->
            <table class="w-full border-collapse border-l border-black dark:border-slate-600 text-xs text-center">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-800 font-bold">
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-10">項次</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-24">項目</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-28">說明</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-12">數量</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-12">單位</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-20">單價/租金</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-24">起日</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-24">迄日</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-10">天數</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2 w-28">小計</th>
                  <th class="border-r border-b border-black dark:border-slate-600 p-2">備註</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(row, idx) in allRows" :key="idx">
                  <!-- 類別標題列 -->
                  <tr v-if="row.isHeader" class="bg-blue-50/50 dark:bg-blue-900/20 font-bold">
                    <td colspan="11" class="border-r border-b border-black dark:border-slate-600 p-2 text-left pl-4">
                      {{ row.label }}
                    </td>
                  </tr>
                  <!-- 資料列 -->
                  <tr v-else class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num">{{ row.seq }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2">{{ row.item }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2">{{ row.desc }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num">{{ row.qty }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2">{{ row.unit }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num">{{ fmt(row.price) }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num">{{ row.start }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num">{{ row.end }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num">{{ row.days }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 font-bold font-mono-num">{{ fmt(row.subtotal) }}</td>
                    <td class="border-r border-b border-black dark:border-slate-600 p-2 text-left px-2 text-[10px] leading-tight">{{ row.notes }}</td>
                  </tr>
                </template>

                <!-- 合計/稅/總計 -->
                <tr class="font-bold">
                  <td colspan="9" class="border-r border-b border-black dark:border-slate-600 p-2 text-right bg-slate-50 dark:bg-slate-800">合計金額</td>
                  <td colspan="2" class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num text-lg">{{ fmt(group.subtotal) }}</td>
                </tr>
                <tr class="font-bold">
                  <td colspan="9" class="border-r border-b border-black dark:border-slate-600 p-2 text-right bg-slate-50 dark:bg-slate-800">營業稅 5%</td>
                  <td colspan="2" class="border-r border-b border-black dark:border-slate-600 p-2 font-mono-num text-lg">{{ fmt(tax) }}</td>
                </tr>
                <tr class="bg-slate-100 dark:bg-slate-800 font-black">
                  <td colspan="9" class="border-r border-b border-black dark:border-slate-600 p-3 text-right text-base">總計</td>
                  <td colspan="2" class="border-r border-b border-black dark:border-slate-600 p-3 font-mono-num text-2xl text-violet-600 dark:text-violet-400 underline decoration-double decoration-1 underline-offset-4">{{ fmt(total) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 頁尾 -->
            <div class="mt-6 flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-2">
              <span>聯絡地址：台南市永康區中山南路758巷5弄16號</span>
              <div class="flex gap-8">
                <span>電話：06-2531198</span>
                <span>行動電話：0912-160158</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-4 shrink-0">
          <button
            class="px-8 py-3 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            @click="emit('cancel')"
          >
            返回修改
          </button>
          <AppButton
            variant="violet"
            size="xl"
            class="px-12"
            :loading="loading"
            @click="emit('confirm')"
          >
            確認無誤，立即匯出 Excel
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.font-mono-num {
  font-family: 'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace;
}
</style>
