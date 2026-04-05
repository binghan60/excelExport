<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useSwal } from '../composables/useSwal.js'
import { api } from '../api/index.js'
import { useRentalsStore } from '../stores/rentals.js'
import { useAdminStore } from '../stores/admin.js'
import MonthPicker from '../components/MonthPicker.vue'
import DatePicker from '../components/DatePicker.vue'
import NumberInput from '../components/base/NumberInput.vue'
import AppInput from '../components/base/AppInput.vue'
import AppButton from '../components/base/AppButton.vue'
import AutocompleteInput from '../components/base/AutocompleteInput.vue'

const { fire: swalFire } = useSwal()
const router = useRouter()
const route = useRoute()
const store = useRentalsStore()
const adminStore = useAdminStore()

const saving = ref(false)
const serverError = ref('')

const todayStr = new Date().toISOString().slice(0, 10)

// ── VeeValidate ───────────────────────────────────────────
const { validate } = useForm()
const { value: clientName, errorMessage: clientNameError, handleChange: onClientNameChange, setValue: setClientName } =
  useField('client_name', yup.string().required('請填寫客戶名稱'))
const { value: yearMonth, errorMessage: yearMonthError, setValue: setYearMonth } =
  useField('year_month', yup.string().required('請選擇請款年月'))

const form = ref({
  site_name: '',
  rows: [{
    date: todayStr, route_from: '', route_to: '', cargo: '', amount: '', notes: '',
  }],
})

const editId = computed(() => route.params.id ? String(route.params.id) : null)
const isEdit = computed(() => !!editId.value)

onMounted(async () => {
  adminStore.fetchAll()
  const now = new Date()
  setYearMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  if (isEdit.value) {
    const data = await api.getFreight(editId.value)
    setClientName(data.client_name)
    setYearMonth(data.year_month)
    form.value.site_name = data.site_name || ''
    form.value.rows = []
    data.rows.forEach((r) => {
      form.value.rows.push({
        date: r.date || '',
        route_from: r.route_from || '',
        route_to: r.route_to || '',
        cargo: r.cargo || '',
        amount: r.amount ?? '',
        notes: r.notes || '',
      })
    })
  }
})

const subtotal = computed(() => form.value.rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0))
const tax = computed(() => Math.round(subtotal.value * 0.05))
const total = computed(() => subtotal.value + tax.value)

function fmt(num) { return num.toLocaleString() }

const isDeleting = ref(false)

function removeRow(idx) {
  if (form.value.rows.length > 1) {
    isDeleting.value = true
    form.value.rows.splice(idx, 1)
    setTimeout(() => { isDeleting.value = false }, 50)
  }
}

function duplicateRow(idx) {
  const curr = form.value.rows[idx]
  form.value.rows.splice(idx + 1, 0, {
    date: curr.date,
    route_from: curr.route_from,
    route_to: curr.route_to,
    cargo: curr.cargo,
    amount: curr.amount,
    notes: curr.notes
  })
}

function swapRoute(idx) {
  const curr = form.value.rows[idx]
  const tmp = curr.route_from
  curr.route_from = curr.route_to
  curr.route_to = tmp
}

function addRow() {
  const lastRow = form.value.rows[form.value.rows.length - 1]
  form.value.rows.push({
    date: lastRow?.date || todayStr,
    route_from: '', route_to: '', cargo: '', amount: '', notes: ''
  })
}

async function save() {
  serverError.value = ''
  const { valid } = await validate()
  if (!valid) return

  saving.value = true
  const payload = {
    client_name: clientName.value,
    year_month: yearMonth.value,
    site_name: form.value.site_name,
    rows: form.value.rows
      .filter(r => r.date || r.route_from || r.route_to || r.amount)
      .map(r => ({ ...r, amount: r.amount !== '' ? Number(r.amount) : null })),
  }

  // 先觸發 Store 異動（內含同步 unshift）再跳轉，達成 Optimistic UI
  const promise = isEdit.value
    ? store.updateFreight(editId.value, payload)
    : store.createFreight(payload)

  router.push('/freights')

  try {
    await promise
    swalFire({
      icon: 'success',
      title: isEdit.value ? '修改完成' : '建立成功',
      text: '運費請款單已儲存',
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
          @click="router.push('/freights')"
          class="w-10 h-10 !p-0"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </template>
        </AppButton>
        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{{ isEdit ? '修改運費請款' : '建立新運費單' }}</h1>
          <p class="text-base font-medium text-slate-400 dark:text-slate-500">運費請款明細資料輸入</p>
        </div>
      </div>

    </div>

    <!-- 訊息提示 -->
    <div v-if="serverError" class="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900 font-semibold flex items-center gap-3 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ serverError }}
    </div>
    <!-- 基本資料 -->
    <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60">
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">基本資料</h3>
      </div>
      <div class="p-4 md:p-6 flex flex-wrap gap-4 md:gap-6">
        <div class="space-y-1.5 w-full md:w-72">
          <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            <span class="text-red-500 text-sm leading-none">*</span>客戶名稱
          </label>
          <AutocompleteInput
            :model-value="clientName"
            @update:model-value="onClientNameChange"
            :options="adminStore.allCustomerNames"
            placeholder="請選擇客戶名稱"
            variant="amber" dense
            :class="clientNameError ? '[&_input]:border-red-400 [&_input]:focus:border-red-500' : ''"
          />
          <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
            <template v-if="clientNameError">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ clientNameError }}
            </template>
          </p>
        </div>
        <div class="space-y-1.5 w-full md:w-72">
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地名稱</label>
          <AutocompleteInput v-model="form.site_name" :options="adminStore.allSiteNames" placeholder="請選擇工地名稱" variant="amber" dense />
          <p class="h-4"></p>
        </div>
        <div class="space-y-1.5 w-full md:w-72">
          <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            <span class="text-red-500 text-sm leading-none">*</span>請款年月
          </label>
          <MonthPicker :model-value="yearMonth" @update:model-value="setYearMonth" variant="amber" dense :class="yearMonthError ? '[&_button]:border-red-400' : ''" />
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
        <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">運費明細</h3>
        <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded border border-amber-100 dark:border-amber-900">共 {{ form.rows.length }} 行</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse min-w-260">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100/80 dark:border-slate-700/60">
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center w-12">#</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide w-44 whitespace-nowrap">運輸日期</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">起點</th>
              <th class="px-1 py-3 w-8"></th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">迄點</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">載運設備／品項</th>
              <th class="px-4 py-3 text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide text-right pr-6 w-40 whitespace-nowrap">金額（未稅）</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">備註</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center w-28 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="(row, i) in form.rows" :key="i" class="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
              <td class="px-4 py-3 text-center text-slate-300 dark:text-slate-600 font-semibold text-xs">{{ i + 1 }}</td>
              <td class="px-4 py-3">
                <DatePicker v-model="row.date" variant="amber" placeholder="請選擇日期" />
              </td>
              <td class="px-4 py-3">
                <AppInput v-model="row.route_from" variant="amber" dense placeholder="請輸入起點" />
              </td>
              <td class="px-1 py-3 text-center">
                <AppButton
                  variant="soft-amber"
                  size="sm"
                  class="w-9 h-9 !p-0 mx-auto"
                  @click="swapRoute(i)"
                  title="對調起迄點"
                >
                  <template #icon>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9H3l5-5"/><path d="M3 15h18l-5 5"/></svg>
                  </template>
                </AppButton>
              </td>
              <td class="px-4 py-3">
                <AppInput v-model="row.route_to" variant="amber" dense placeholder="請輸入迄點" />
              </td>
              <td class="px-4 py-3">
                <AppInput v-model="row.cargo" variant="amber" dense placeholder="請輸入設備品項" />
              </td>
              <td class="px-4 py-3">
                <NumberInput v-model="row.amount" variant="amber" align="right" :step="100" class="w-32 mx-auto" />
              </td>
              <td class="px-4 py-3">
                <AppInput v-model="row.notes" variant="amber" dense placeholder="請輸入備註" />
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex flex-wrap items-center justify-center gap-2">
                  <AppButton
                    variant="soft-amber"
                    size="sm"
                    class="w-9 h-9 !p-0"
                    @click="duplicateRow(i)"
                    title="複製此行"
                  >
                    <template #icon>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </template>
                  </AppButton>
                  <AppButton
                    v-if="form.rows.length > 1"
                    variant="soft-red"
                    size="sm"
                    class="w-9 h-9 !p-0"
                    @click="removeRow(i)"
                    title="刪除本行"
                  >
                    <template #icon>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </template>
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 手動新增行按鈕 -->
      <div class="px-6 py-4 border-t border-slate-100/80 dark:border-slate-700/60 transition-colors bg-slate-50/20 dark:bg-slate-800/20">
        <AppButton
          variant="soft-amber"
          block
          @click="addRow"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </template>
          增加一筆空白行
        </AppButton>
      </div>

      <!-- 結算 -->
      <div class="sticky bottom-0 z-10 px-8 py-5 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md flex items-end justify-between gap-6 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <!-- 送出按鈕 -->
        <AppButton variant="amber" size="lg" :loading="saving" @click="save">
          <template #icon>
            <svg v-if="!saving" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </template>
          {{ saving ? '正在儲存…' : (isEdit ? '儲存修改' : '建立運費單') }}
        </AppButton>
        <!-- 金額摘要 -->
        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-12 text-slate-500 dark:text-slate-400">
            <span class="text-xs font-semibold uppercase tracking-wide">運費小計（未稅）</span>
            <span class="text-lg font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-32 text-right">{{ fmt(subtotal) }} <small class="text-xs font-normal">元</small></span>
          </div>
          <div class="flex items-center gap-12 text-slate-500 dark:text-slate-400">
            <span class="text-xs font-semibold uppercase tracking-wide">營業稅額（5%）</span>
            <span class="text-lg font-semibold font-mono-num text-slate-600 dark:text-slate-300 w-32 text-right">{{ fmt(tax) }} <small class="text-xs font-normal">元</small></span>
          </div>
          <div class="w-48 h-px bg-slate-200 dark:bg-slate-700 my-0.5"></div>
          <div class="flex items-center gap-12">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">含稅總計</span>
            </div>
            <span class="text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono-num w-32 text-right">{{ fmt(total) }} <small class="text-sm font-semibold opacity-60">元</small></span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
