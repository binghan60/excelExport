<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api/index.js'
import { useRentalsStore } from '../stores/rentals.js'
import DateRangePicker from '../components/DateRangePicker.vue'
import MonthPicker from '../components/MonthPicker.vue'
import NumberInput from '../components/base/NumberInput.vue'
import AppInput from '../components/base/AppInput.vue'

const router = useRouter()
const route = useRoute()
const store = useRentalsStore()

const equipmentTypes = ref([])
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = ref({
  equipment_type_id: '',
  client_name: '',
  vendor: '',
  site_name: '',
  year_month: '',
  rows: Array.from({ length: 7 }, () => ({
    is_continued: false,
    delivery_date: '',
    return_date: '',
    quantity: '',
    daily_rate: '',
    start_date: '',
    end_date: '',
    days: '',
    notes: '',
  })),
})

const editId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEdit = computed(() => !!editId.value)

onMounted(async () => {
  equipmentTypes.value = await api.getEquipmentTypes()
  const now = new Date()
  form.value.year_month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  if (isEdit.value) {
    const data = await api.getRental(editId.value)
    form.value.equipment_type_id = data.equipment_type_id
    form.value.client_name = data.client_name
    form.value.vendor = data.vendor || ''
    form.value.site_name = data.site_name || ''
    form.value.year_month = data.year_month
    data.rows.forEach((r, i) => {
      if (i < 7) form.value.rows[i] = {
        is_continued: !!r.is_continued,
        delivery_date: r.delivery_date || '',
        return_date: r.return_date || '',
        quantity: r.quantity ?? '',
        daily_rate: r.daily_rate ?? '',
        start_date: r.start_date || '',
        end_date: r.end_date || '',
        days: r.days ?? '',
        notes: r.notes || '',
      }
    })
  }
})

function fmt(n) { return n ? n.toLocaleString() : '0' }

function calcDays(rowIdx) {
  const row = form.value.rows[rowIdx]
  if (row.start_date && row.end_date) {
    const diff = Math.round((new Date(row.end_date) - new Date(row.start_date)) / 86400000)
    row.days = diff > 0 ? diff : ''
  }
}

function setDelivery(i, val) { form.value.rows[i].delivery_date = val }
function setReturn(i, val)   { form.value.rows[i].return_date = val }
function setStart(i, val)    { form.value.rows[i].start_date = val; calcDays(i) }
function setEnd(i, val)      { form.value.rows[i].end_date = val; calcDays(i) }

function rowTotal(row) {
  const q = parseFloat(row.quantity) || 0
  const r = parseFloat(row.daily_rate) || 0
  const d = parseFloat(row.days) || 0
  return q * r * d
}

const subtotal = computed(() => form.value.rows.reduce((s, r) => s + rowTotal(r), 0))
const tax = computed(() => Math.round(subtotal.value * 0.05))
const total = computed(() => subtotal.value + tax.value)

async function save() {
  errorMsg.value = ''
  if (!form.value.equipment_type_id) { errorMsg.value = '請選擇設備種類'; return }
  if (!form.value.client_name.trim()) { errorMsg.value = '請填寫客戶名稱'; return }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      equipment_type_id: Number(form.value.equipment_type_id),
      rows: form.value.rows
        .filter(r => r.quantity || r.start_date || r.delivery_date)
        .map(r => ({
          ...r,
          quantity: r.quantity !== '' ? Number(r.quantity) : null,
          daily_rate: r.daily_rate !== '' ? Number(r.daily_rate) : null,
          days: r.days !== '' ? Number(r.days) : null,
        })),
    }
    if (isEdit.value) {
      await store.updateRental(editId.value, payload)
    } else {
      await store.createRental(payload)
    }
    successMsg.value = '單據已儲存成功'
    setTimeout(() => router.push('/rentals'), 1000)
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <div class="space-y-6 pb-20 animate-in fade-in duration-500">
    <!-- 頂部操作列 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          @click="router.push('/rentals')"
          class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300/60 dark:hover:border-blue-700/60 transition-all duration-300 ease-out active:scale-[0.95] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{{ isEdit ? '編輯請款單據' : '建立新租賃單' }}</h1>
          <p class="text-sm font-medium text-slate-400 dark:text-slate-500">租賃請款明細資料輸入</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="h-10 px-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 text-sm shadow-[0_1px_4px_0_rgba(0,0,0,0.15)] hover:shadow-[0_2px_10px_0_rgba(37,99,235,0.3)]"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? '正在儲存…' : '儲存單據' }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900 font-semibold flex items-center gap-3 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900 font-semibold flex items-center gap-3 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      {{ successMsg }}
    </div>

    <!-- 基本資料 -->
    <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">基本資料</h3>
      </div>
      <div class="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">設備種類 *</label>
          <select v-model="form.equipment_type_id" class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-950/60 outline-none text-sm text-slate-700 dark:text-slate-200 transition-all cursor-pointer font-medium">
            <option value="">選擇設備...</option>
            <option v-for="et in equipmentTypes" :key="et.id" :value="et.id">{{ et.name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶名稱 *</label>
          <AppInput v-model="form.client_name" variant="blue" placeholder="輸入廠商名稱" />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">廠商代號</label>
          <AppInput v-model="form.vendor" variant="blue" placeholder="代號" />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地名稱</label>
          <AppInput v-model="form.site_name" variant="blue" placeholder="工程案名" />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">結帳年月 *</label>
          <MonthPicker v-model="form.year_month" variant="blue" />
        </div>
      </div>
    </section>

    <!-- 明細列表 -->
    <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">租賃明細</h3>
        <span class="text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900">共 7 行</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse min-w-195">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100/80 dark:border-slate-700/60">
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">續租</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">出貨 / 歸還日期</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">數量</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">日租金</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">計費區間</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">天數</th>
              <th class="px-4 py-3 text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide text-right pr-6 whitespace-nowrap">小計 (未稅)</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">備註</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="(row, i) in form.rows" :key="i" class="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 text-center">
                <input type="checkbox" v-model="row.is_continued" class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer">
              </td>
              <td class="px-4 py-3">
                <DateRangePicker variant="blue"
                  :start-date="row.delivery_date"
                  :end-date="row.return_date"
                  @update:start-date="setDelivery(i, $event)"
                  @update:end-date="setReturn(i, $event)"
                />
              </td>
              <td class="px-4 py-3 w-24">
                <NumberInput v-model="row.quantity" />
              </td>
              <td class="px-4 py-3 w-28">
                <NumberInput v-model="row.daily_rate" :step="100" />
              </td>
              <td class="px-4 py-3">
                <DateRangePicker variant="blue"
                  :start-date="row.start_date"
                  :end-date="row.end_date"
                  @update:start-date="setStart(i, $event)"
                  @update:end-date="setEnd(i, $event)"
                />
              </td>
              <td class="px-4 py-3 w-20">
                <NumberInput v-model="row.days" :min="0" />
              </td>
              <td class="px-4 py-3 text-right pr-6">
                <span class="font-mono-num font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {{ rowTotal(row) > 0 ? fmt(rowTotal(row)) : '—' }}
                </span>
              </td>
              <td class="px-4 py-3 min-w-36">
                <AppInput v-model="row.notes" variant="blue" placeholder="備註..." />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 結算區 -->
      <div class="p-8 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-end gap-3 border-t border-slate-100 dark:border-slate-700">
        <div class="flex items-center gap-12 text-slate-500 dark:text-slate-400">
          <span class="text-xs font-semibold uppercase tracking-wide">應收小計（未稅）</span>
          <span class="text-lg font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-32 text-right">{{ fmt(subtotal) }} <small class="text-xs font-normal">元</small></span>
        </div>
        <div class="flex items-center gap-12 text-slate-500 dark:text-slate-400">
          <span class="text-xs font-semibold uppercase tracking-wide">營業稅額（5%）</span>
          <span class="text-lg font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-32 text-right">{{ fmt(tax) }} <small class="text-xs font-normal">元</small></span>
        </div>
        <div class="w-48 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
        <div class="flex items-center gap-12">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse"></span>
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">含稅總計</span>
          </div>
          <span class="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono-num w-32 text-right">{{ fmt(total) }} <small class="text-sm font-semibold opacity-60">元</small></span>
        </div>
      </div>
    </section>
  </div>
</template>
