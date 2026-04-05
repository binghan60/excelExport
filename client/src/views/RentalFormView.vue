<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useSwal } from '../composables/useSwal.js'
import { api } from '../api/index.js'
import { useRentalsStore } from '../stores/rentals.js'
import { useAdminStore } from '../stores/admin.js'
import DateRangePicker from '../components/DateRangePicker.vue'
import MonthPicker from '../components/MonthPicker.vue'
import NumberInput from '../components/base/NumberInput.vue'
import AppInput from '../components/base/AppInput.vue'
import AppButton from '../components/base/AppButton.vue'
import AutocompleteInput from '../components/base/AutocompleteInput.vue'

const { fire: swalFire } = useSwal()
const router = useRouter()
const route = useRoute()
const store = useRentalsStore()
const adminStore = useAdminStore()

const equipmentTypes = ref([])
const saving = ref(false)
const serverError = ref('')

// ── VeeValidate：頂層欄位 ──────────────────────────────────
const { validate } = useForm()
const { value: clientName, errorMessage: clientNameError, handleChange: onClientNameChange, setValue: setClientName } =
  useField('client_name', yup.string().required('請填寫客戶名稱'))
const { value: yearMonth, errorMessage: yearMonthError, setValue: setYearMonth } =
  useField('year_month', yup.string().required('請選擇結帳年月'))

// 動態欄位的列層錯誤（設備必選）
const rowErrors = ref([])

const form = ref({
  vendor: '',
  site_name: '',
  rows: [{
    is_continued: false,
    equipment_type_id: '',
    delivery_date: '',
    return_date: '',
    quantity: '',
    daily_rate: '',
    start_date: '',
    end_date: '',
    days: '',
    notes: '',
  }],
})

const editId = computed(() => route.params.id ? String(route.params.id) : null)
const isEdit = computed(() => !!editId.value)

onMounted(async () => {
  api.getEquipmentTypes().then(res => { equipmentTypes.value = res })
  adminStore.fetchAll()
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  setYearMonth(defaultMonth)

  if (isEdit.value) {
    const data = await api.getRental(editId.value)
    setClientName(data.client_name)
    setYearMonth(data.year_month)
    form.value.vendor = data.vendor
    form.value.site_name = data.site_name
    form.value.rows = []
    if (data.rows && data.rows.length > 0) {
      data.rows.forEach((r) => {
        form.value.rows.push({
          is_continued: !!r.is_continued,
          equipment_type_id: r.equipment_type_id || '',
          delivery_date: r.delivery_date || '',
          return_date: r.return_date || '',
          quantity: r.quantity ?? '',
          daily_rate: r.daily_rate ?? '',
          start_date: r.start_date || '',
          end_date: r.end_date || '',
          days: r.days ?? '',
          notes: r.notes || '',
        })
      })
    } else {
      addRow()
    }
  }
  rowErrors.value = form.value.rows.map(() => '')
})

function addRow() {
  const lastRow = form.value.rows[form.value.rows.length - 1]
  form.value.rows.push({
    is_continued: false,
    equipment_type_id: lastRow?.equipment_type_id || '',
    delivery_date: '', return_date: '', quantity: '', daily_rate: '',
    start_date: '', end_date: '', days: '', notes: '',
  })
  rowErrors.value.push('')
}

function duplicateRow(idx) {
  const source = form.value.rows[idx]
  form.value.rows.splice(idx + 1, 0, { ...source })
  rowErrors.value.splice(idx + 1, 0, '')
}

function removeRow(idx) {
  form.value.rows.splice(idx, 1)
  rowErrors.value.splice(idx, 1)
  if (form.value.rows.length === 0) addRow()
}

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
  serverError.value = ''

  // 驗證頂層欄位（await 確保錯誤狀態已更新）
  const { valid } = await validate()

  // 驗證每行的設備選擇
  let rowsValid = true
  rowErrors.value = form.value.rows.map(r => {
    if (!r.equipment_type_id) { rowsValid = false; return '請選擇設備品項' }
    return ''
  })

  if (!valid || !rowsValid) return

  saving.value = true
  const payload = {
    client_name: clientName.value,
    year_month: yearMonth.value,
    vendor: form.value.vendor,
    site_name: form.value.site_name,
    rows: form.value.rows
      .filter(r => r.quantity || r.start_date || r.delivery_date)
      .map(r => ({
        ...r,
        quantity: r.quantity !== '' ? Number(r.quantity) : null,
        daily_rate: r.daily_rate !== '' ? Number(r.daily_rate) : null,
        days: r.days !== '' ? Number(r.days) : null,
      })),
  }

  // 先觸發 Store 異動（內含同步 unshift）再跳轉，達成 Optimistic UI
  const promise = isEdit.value
    ? store.updateRental(editId.value, payload)
    : store.createRental(payload)

  router.push('/rentals')

  try {
    await promise
    swalFire({
      icon: 'success',
      title: isEdit.value ? '修改完成' : '建立成功',
      text: '租賃請款單已儲存',
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true,
    })
  } catch (e) {
    swalFire({ icon: 'error', title: '儲存失敗', text: e.message || '請稍後再試' })
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
        <AppButton
          variant="secondary"
          @click="router.push('/rentals')"
          class="w-10 h-10 !p-0"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </template>
        </AppButton>
        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{{ isEdit ? '編輯請款單據' : '建立新租賃單' }}</h1>
          <p class="text-base font-medium text-slate-400 dark:text-slate-500">租賃請款明細資料輸入</p>
        </div>
      </div>

    </div>

    <div v-if="serverError" class="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900 font-semibold flex items-center gap-3 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ serverError }}
    </div>
    <!-- 基本資料 -->
    <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">基本資料</h3>
      </div>
      <div class="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div class="space-y-1.5">
          <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            <span class="text-red-500 text-sm leading-none">*</span>客戶名稱
          </label>
          <AutocompleteInput
            :model-value="clientName"
            @update:model-value="onClientNameChange"
            :options="adminStore.allCustomerNames"
            placeholder="請選擇客戶名稱"
            variant="blue" dense
            :class="clientNameError ? '[&_input]:border-red-400 [&_input]:focus:border-red-500' : ''"
          />
          <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
            <template v-if="clientNameError">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ clientNameError }}
            </template>
          </p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">廠商代號</label>
          <AppInput v-model="form.vendor" variant="blue" dense placeholder="請輸入廠商代號" />
          <p class="h-4"></p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地名稱</label>
          <AutocompleteInput v-model="form.site_name" :options="adminStore.allSiteNames" placeholder="請選擇工地名稱" variant="blue" dense />
          <p class="h-4"></p>
        </div>
        <div class="space-y-1.5 w-full md:w-72">
          <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            <span class="text-red-500 text-sm leading-none">*</span>結帳年月
          </label>
          <MonthPicker :model-value="yearMonth" @update:model-value="setYearMonth" variant="blue" dense :class="yearMonthError ? '[&_button]:border-red-400' : ''" />
          <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
            <template v-if="yearMonthError">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ yearMonthError }}
            </template>
          </p>
        </div>
      </div>
    </section>

    <!-- 明細列表 -->
    <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">租賃明細</h3>
        <span class="text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900">共 {{ form.rows.length }} 行</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100/80 dark:border-slate-700/60">
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">續租</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">設備品項 *</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">出貨/歸還</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">數量</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">日租金</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">計費區間</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">天數</th>
              <th class="px-2 py-3 text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide text-right pr-4 whitespace-nowrap">小計</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">備註</th>
              <th class="px-2 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center w-24 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800 [&_td]:align-top">
            <tr v-for="(row, i) in form.rows" :key="i" class="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-2 py-3 text-center">
                <label class="inline-flex items-center justify-center h-9 cursor-pointer">
                  <input type="checkbox" v-model="row.is_continued" class="sr-only">
                  <div
                    class="w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-150"
                    :class="row.is_continued
                      ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-500'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'"
                  >
                    <svg v-show="row.is_continued" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </label>
                <p class="mt-1 h-4"></p>
              </td>
              <td class="px-2 py-3 w-40">
                <select v-model="row.equipment_type_id"
                  @change="rowErrors[i] = ''"
                  class="w-full h-9 px-2 bg-white dark:bg-slate-900 border rounded-lg focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  :class="rowErrors[i] ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'"
                >
                  <option value="">請選擇</option>
                  <option v-for="et in equipmentTypes" :key="et.id" :value="et.id">{{ et.name }}</option>
                </select>
                <p class="mt-1 h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <template v-if="rowErrors[i]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ rowErrors[i] }}
                  </template>
                </p>
              </td>
              <td class="px-2 py-3 w-44">
                <DateRangePicker variant="blue"
                  :start-date="row.delivery_date"
                  :end-date="row.return_date"
                  @update:start-date="setDelivery(i, $event)"
                  @update:end-date="setReturn(i, $event)"
                />
              </td>
              <td class="px-1 py-3 ">
                <NumberInput v-model="row.quantity" class="w-24 mx-auto" />
              </td>
              <td class="px-1 py-3">
                <NumberInput v-model="row.daily_rate" :step="100" class="w-24 mx-auto" />
              </td>
              <td class="px-2 py-3 w-44">
                <DateRangePicker variant="blue"
                  :start-date="row.start_date"
                  :end-date="row.end_date"
                  @update:start-date="setStart(i, $event)"
                  @update:end-date="setEnd(i, $event)"
                />
              </td>
              <td class="px-2 py-3 text-center">
                <NumberInput v-model="row.days" :min="0" class="w-24 mx-auto" />
              </td>
              <td class="px-2 py-3 text-right pr-4">
                <span class="font-mono-num font-bold text-blue-600 dark:text-blue-400 text-xs">
                  {{ rowTotal(row) > 0 ? fmt(rowTotal(row)) : '—' }}
                </span>
              </td>
              <td class="px-2 py-3 min-w-24">
                <AppInput v-model="row.notes" variant="blue" dense placeholder="請輸入備註" />
              </td>
              <td class="px-2 py-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <AppButton
                    variant="soft-blue"
                    size="sm"
                    class="w-9 h-9 !p-0"
                    @click.prevent="duplicateRow(i)"
                    title="複製此行"
                  >
                    <template #icon>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </template>
                  </AppButton>
                  <AppButton
                    variant="soft-red"
                    size="sm"
                    class="w-9 h-9 !p-0"
                    @click.prevent="removeRow(i)"
                    title="刪除此行"
                  >
                    <template #icon>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </template>
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center bg-slate-50/20 dark:bg-slate-800/20">
        <AppButton
          variant="soft-blue"
          block
          @click="addRow"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </template>
          增加一筆空白行
        </AppButton>
      </div>

      <!-- 結算區 -->
      <div class="sticky bottom-0 z-10 px-8 py-5 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 flex items-end justify-between gap-6 border-t border-slate-200 dark:border-slate-700 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <!-- 送出按鈕 -->
        <AppButton variant="primary" size="lg" :loading="saving" @click="save">
          <template #icon>
            <svg v-if="!saving" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </template>
          {{ saving ? '正在儲存…' : (isEdit ? '儲存修改' : '建立租賃單') }}
        </AppButton>
        <!-- 金額摘要 -->
        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-12 text-slate-500 dark:text-slate-400">
            <span class="text-xs font-semibold uppercase tracking-wide">應收小計（未稅）</span>
            <span class="text-lg font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-32 text-right">{{ fmt(subtotal) }} <small class="text-xs font-normal">元</small></span>
          </div>
          <div class="flex items-center gap-12 text-slate-500 dark:text-slate-400">
            <span class="text-xs font-semibold uppercase tracking-wide">營業稅額（5%）</span>
            <span class="text-lg font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-32 text-right">{{ fmt(tax) }} <small class="text-xs font-normal">元</small></span>
          </div>
          <div class="w-48 h-px bg-slate-200 dark:bg-slate-700 my-0.5"></div>
          <div class="flex items-center gap-12">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse"></span>
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">含稅總計</span>
            </div>
            <span class="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono-num w-32 text-right">{{ fmt(total) }} <small class="text-sm font-semibold opacity-60">元</small></span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
