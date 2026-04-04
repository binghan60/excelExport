<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useInventoryStore } from '../stores/inventory.js'
import { useAdminStore } from '../stores/admin.js'
import { useSwal } from '../composables/useSwal.js'
import { api } from '../api/index.js'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import ConfirmModal from '../components/base/ConfirmModal.vue'

// ── Tab 狀態 ──────────────────────────────────────────────
const activeTab = ref('equipment')

const tabs = [
  { key: 'equipment', label: '設備管理', color: 'emerald' },
  { key: 'customers', label: '客戶管理', color: 'blue' },
  { key: 'sites',     label: '工地管理', color: 'amber' },
]

// ── Stores ────────────────────────────────────────────────
const store = useInventoryStore()
const adminStore = useAdminStore()
const swal = useSwal()
const logs = ref([])
const rowEdits = reactive({})

// ── 刪除確認 ──────────────────────────────────────────────
const confirmDelete = reactive({
  show: false,
  type: '', // 'equipment', 'customer', 'site'
  id: null,
  title: '',
  message: ''
})

function openDeleteConfirm(type, item) {
  confirmDelete.type = type
  confirmDelete.id = item.id
  confirmDelete.show = true
  
  if (type === 'equipment') {
    confirmDelete.title = '確認刪除設備'
    confirmDelete.message = `確定要刪除「${item.name}」嗎？這將會移除所有相關的庫存記錄。`
  } else if (type === 'customer') {
    confirmDelete.title = '確認刪除客戶'
    confirmDelete.message = `確定要刪除客戶「${item.name}」嗎？`
  } else if (type === 'site') {
    confirmDelete.title = '確認刪除工地'
    confirmDelete.message = `確定要刪除工地「${item.name}」嗎？`
  }
}

async function handleConfirmDelete() {
  const { type, id } = confirmDelete
  confirmDelete.show = false
  
  try {
    if (type === 'equipment') {
      await api.deleteEquipmentType(id)
      await store.fetchInventory()
      logs.value = await api.getInventoryLogs()
      delete rowEdits[id]
    } else if (type === 'customer') {
      await adminStore.deleteCustomer(id)
    } else if (type === 'site') {
      await adminStore.deleteSite(id)
    }
  } catch (e) {
    swal.error(e.message)
  }
}

// 設備 Modal
const showEquipModal = ref(false)
const addEquipSaving = ref(false)

const { validateField: validateModalField } = useForm()
const { value: equipName, errorMessage: equipNameError, resetField: resetEquipName } =
  useField('equip_name', yup.string().required('請填寫設備名稱'), { initialValue: '' })
const { value: equipUnit, errorMessage: equipUnitError, resetField: resetEquipUnit } =
  useField('equip_unit', yup.string().required('請填寫計量單位'), { initialValue: '個' })
const { value: newCustomer, errorMessage: customerError, resetField: resetCustomerField } =
  useField('new_customer', yup.string().required('請填寫客戶名稱'), { initialValue: '' })
const { value: newSite, errorMessage: siteError, resetField: resetSiteField } =
  useField('new_site', yup.string().required('請填寫工地名稱'), { initialValue: '' })

function openEquipModal() {
  resetEquipName()
  resetEquipUnit()
  showEquipModal.value = true
}

function closeEquipModal() {
  showEquipModal.value = false
  resetEquipName()
  resetEquipUnit()
}

function initRow(id) {
  rowEdits[id] = { open: false, amount: '', reason: '', saving: false, error: '', success: '' }
}

function toggleRow(id) {
  rowEdits[id].open = !rowEdits[id].open
  if (!rowEdits[id].open) {
    rowEdits[id].amount = ''; rowEdits[id].reason = ''; rowEdits[id].error = ''
  }
}

async function confirmAdjust(stock) {
  const edit = rowEdits[stock.id]
  edit.error = ''
  const amt = Number(edit.amount)
  if (!edit.amount || amt === 0) { edit.error = '請填寫數量'; return }
  edit.saving = true
  try {
    await store.adjust(stock.id, amt, edit.reason)
    logs.value = await api.getInventoryLogs()
    edit.amount = ''; edit.reason = ''; edit.open = false
    edit.success = `已異動 ${amt} ${stock.unit}`
    setTimeout(() => { edit.success = '' }, 2500)
  } catch (e) {
    edit.error = e.message
  } finally {
    edit.saving = false
  }
}

async function addEquipmentType() {
  const [r1, r2] = await Promise.all([
    validateModalField('equip_name'),
    validateModalField('equip_unit'),
  ])
  if (!r1.valid || !r2.valid) return
  addEquipSaving.value = true
  try {
    await api.addEquipmentType({ name: equipName.value.trim(), unit: equipUnit.value.trim() })
    await store.fetchInventory()
    logs.value = await api.getInventoryLogs()
    store.stocks.forEach(s => { if (!rowEdits[s.id]) initRow(s.id) })
    closeEquipModal()
  } catch (e) {
    swal.error(e.message)
  } finally {
    addEquipSaving.value = false
  }
}

// ── 客戶 Tab ──────────────────────────────────────────────
const showCustomerModal = ref(false)
const customerSaving = ref(false)
const importMsg = ref('')

async function importFromInvoices() {
  try {
    const { customers, sites } = await adminStore.importFromInvoices()
    const parts = []
    if (customers > 0) parts.push(`新增 ${customers} 位客戶`)
    if (sites > 0)     parts.push(`新增 ${sites} 個工地`)
    importMsg.value = parts.length ? parts.join('、') : '沒有需要新增的資料'
    setTimeout(() => { importMsg.value = '' }, 3500)
  } catch (e) {
    swal.error(e.message)
  }
}

function openCustomerModal() { resetCustomerField(); showCustomerModal.value = true }
function closeCustomerModal() { showCustomerModal.value = false; resetCustomerField() }

async function addCustomer() {
  const { valid } = await validateModalField('new_customer')
  if (!valid) return
  customerSaving.value = true
  try {
    await adminStore.addCustomer(newCustomer.value.trim())
    closeCustomerModal()
  } catch (e) {
    swal.error(e.message)
  } finally {
    customerSaving.value = false
  }
}

// ── 工地 Tab ──────────────────────────────────────────────
const showSiteModal = ref(false)
const siteSaving = ref(false)

function openSiteModal() { resetSiteField(); showSiteModal.value = true }
function closeSiteModal() { showSiteModal.value = false; resetSiteField() }

async function addSite() {
  const { valid } = await validateModalField('new_site')
  if (!valid) return
  siteSaving.value = true
  try {
    await adminStore.addSite(newSite.value.trim())
    closeSiteModal()
  } catch (e) {
    swal.error(e.message)
  } finally {
    siteSaving.value = false
  }
}

// ── 初始化 ────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([store.fetchInventory(), adminStore.fetchAll()])
  logs.value = await api.getInventoryLogs()
  store.stocks.forEach(s => initRow(s.id))
})

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">

    <!-- 標題列 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">後台管理</h1>
        <p class="text-base font-medium text-slate-400 dark:text-slate-500">管理設備、客戶與工地選項，新增後即可在下拉選單中選取</p>
      </div>
      <!-- 新增按鈕（隨 Tab 切換） -->
      <AppButton v-if="activeTab === 'equipment'" variant="emerald" size="lg" @click="openEquipModal">
        <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></template>
        新增設備品項
      </AppButton>
      <AppButton v-else-if="activeTab === 'customers'" variant="primary" size="lg" @click="openCustomerModal">
        <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></template>
        新增客戶
      </AppButton>
      <AppButton v-else-if="activeTab === 'sites'" variant="amber" size="lg" @click="openSiteModal">
        <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></template>
        新增工地
      </AppButton>
    </div>

    <!-- Tab 列 -->
    <div class="flex gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out select-none"
        :class="activeTab === tab.key
          ? tab.key === 'equipment'
            ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]'
            : tab.key === 'customers'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]'
              : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ══ 設備管理 Tab ══ -->
    <template v-if="activeTab === 'equipment'">
      <AppCard title="設備品項清單" noPadding>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">設備品項</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">總儲量</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">外借中</th>
                <th class="px-6 py-3 text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide text-center">在庫可用</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <template v-for="s in store.stocks" :key="s.id">
                <tr class="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-base">{{ s.name }}</td>
                  <td class="px-6 py-4 text-center font-semibold text-slate-600 dark:text-slate-300 text-base">{{ s.total_quantity }} <span class="text-xs text-slate-400 ml-0.5">{{ s.unit }}</span></td>
                  <td class="px-6 py-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 text-base">{{ s.rented_out }} <span class="text-xs text-slate-400 ml-0.5">{{ s.unit }}</span></td>
                  <td class="px-6 py-4 text-center">
                    <span class="font-bold text-lg" :class="s.available <= 0 ? 'text-red-500' : s.available < 5 ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'">{{ s.available }}</span>
                    <span class="text-xs text-slate-400 ml-1">{{ s.unit }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <span v-if="rowEdits[s.id]?.success" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ rowEdits[s.id].success }}</span>
                      <button @click="toggleRow(s.id)"
                        class="h-9 px-4 rounded-xl border font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                        :class="rowEdits[s.id]?.open
                          ? 'border-red-200/80 dark:border-red-800/80 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                          : 'border-slate-200/60 dark:border-slate-600/60 text-slate-500 dark:text-slate-400 hover:border-emerald-400/60 hover:text-emerald-600 hover:bg-emerald-50/50'">
                        {{ rowEdits[s.id]?.open ? '取消' : '異動數量' }}
                      </button>
                      <button @click="openDeleteConfirm('equipment', s)"
                        class="h-9 px-3 rounded-xl border border-slate-200/60 dark:border-slate-600/60 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50 font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]">
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- 內嵌調整區 -->
                <tr v-if="rowEdits[s.id]?.open" class="bg-emerald-50/20 dark:bg-emerald-950/10">
                  <td colspan="5" class="px-8 py-6 border-t-0">
                    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6">
                      <div class="space-y-1.5">
                        <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                          <span class="text-red-500 text-sm leading-none">*</span>異動數量（正進負出）
                        </label>
                        <div class="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1 rounded-lg">
                          <button @click="rowEdits[s.id].amount = String((Number(rowEdits[s.id].amount)||0) - 1)" aria-label="減少數量" title="減少數量" class="w-9 h-9 font-semibold text-slate-400 hover:text-red-500 transition-colors text-lg">－</button>
                          <input v-model="rowEdits[s.id].amount" type="number" class="w-24 text-center text-base font-bold outline-none bg-transparent text-slate-800 dark:text-slate-200" placeholder="0">
                          <button @click="rowEdits[s.id].amount = String((Number(rowEdits[s.id].amount)||0) + 1)" aria-label="增加數量" title="增加數量" class="w-9 h-9 font-semibold text-slate-400 hover:text-emerald-500 transition-colors text-lg">＋</button>
                        </div>
                        <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
                          <template v-if="rowEdits[s.id].error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {{ rowEdits[s.id].error }}
                          </template>
                        </p>
                      </div>
                      <div class="space-y-1.5 flex-1 max-w-md">
                        <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">異動備註</label>
                        <input v-model="rowEdits[s.id].reason" class="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg outline-none focus:border-emerald-500 text-base" placeholder="購入新品、損壞報廢、年度清點...">
                      </div>
                      <div class="pt-5">
                        <AppButton variant="emerald" @click="confirmAdjust(s)" :disabled="rowEdits[s.id].saving || !rowEdits[s.id].amount">確認更新</AppButton>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="store.stocks.length === 0">
                <td colspan="5" class="py-16 text-center">
                  <div class="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                    <p class="text-sm">尚無設備品項，請點選「新增設備品項」</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- 異動日誌 -->
      <AppCard title="庫存異動紀錄" subtitle="變更歷史" noPadding>
        <div v-if="logs.length === 0" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <p class="text-sm">尚無異動記錄</p>
          </div>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">日期</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">設備</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">變動量</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">備註</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                <td class="px-6 py-3 text-center text-slate-500 dark:text-slate-400 text-xs">{{ fmtDate(log.created_at) }}</td>
                <td class="px-6 py-3 text-center text-slate-800 dark:text-slate-200 font-semibold text-base">{{ log.equipment_name }}</td>
                <td class="px-6 py-3 text-center">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                    :class="log.change_amount > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900'">
                    <svg v-if="log.change_amount > 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                    {{ Math.abs(log.change_amount) }} {{ log.unit }}
                  </span>
                </td>
                <td class="px-6 py-3 text-slate-500 dark:text-slate-400 text-base">{{ log.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>

    <!-- ══ 客戶管理 Tab ══ -->
    <template v-if="activeTab === 'customers'">
      <AppCard title="客戶名單" noPadding>
        <template #header-right>
          <div class="flex items-center gap-2">
            <span v-if="importMsg" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ importMsg }}</span>
            <button @click="importFromInvoices" class="h-8 px-3 rounded-lg border border-slate-200/60 dark:border-slate-600/60 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200">從請款單匯入</button>
            <span class="text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900">共 {{ adminStore.customers.length }} 筆</span>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide w-14 text-center">#</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶名稱</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr v-for="(c, i) in adminStore.customers" :key="c.id" class="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-6 py-4 text-center text-slate-300 dark:text-slate-600 font-semibold text-xs">{{ i + 1 }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                      {{ c.name.slice(0, 1) }}
                    </div>
                    <span class="text-base font-semibold text-slate-700 dark:text-slate-200">{{ c.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click="openDeleteConfirm('customer', c)"
                    class="h-9 px-3 rounded-xl border border-slate-200/60 dark:border-slate-600/60 text-slate-400 dark:text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50 font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                  >
                    刪除
                  </button>
                </td>
              </tr>
              <tr v-if="adminStore.customers.length === 0">
                <td colspan="3" class="py-16 text-center">
                  <div class="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    <p class="text-sm">尚無客戶，請點選「新增客戶」</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>

    <!-- ══ 工地管理 Tab ══ -->
    <template v-if="activeTab === 'sites'">
      <AppCard title="工地名單" noPadding>
        <template #header-right>
          <div class="flex items-center gap-2">
            <span v-if="importMsg" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ importMsg }}</span>
            <button @click="importFromInvoices" class="h-8 px-3 rounded-lg border border-slate-200/60 dark:border-slate-600/60 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/50 transition-all duration-200">從請款單匯入</button>
            <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded border border-amber-100 dark:border-amber-900">共 {{ adminStore.sites.length }} 筆</span>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide w-14 text-center">#</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地名稱</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr v-for="(s, i) in adminStore.sites" :key="s.id" class="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-6 py-4 text-center text-slate-300 dark:text-slate-600 font-semibold text-xs">{{ i + 1 }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <span class="text-base font-semibold text-slate-700 dark:text-slate-200">{{ s.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click="openDeleteConfirm('site', s)"
                    class="h-9 px-3 rounded-xl border border-slate-200/60 dark:border-slate-600/60 text-slate-400 dark:text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50 font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                  >
                    刪除
                  </button>
                </td>
              </tr>
              <tr v-if="adminStore.sites.length === 0">
                <td colspan="3" class="py-16 text-center">
                  <div class="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><path d="M3 21h18"/><path d="M9 21V9l3-3 3 3v12"/><path d="M5 21V5l3-3 3 3v16"/><path d="M13 21v-7l3-3 3 3v7"/><path d="M17 21v-3l3-3 3 3v3"/></svg>
                    <p class="text-sm">尚無工地，請點選「新增工地」</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>

    <!-- 刪除確認 Modal -->
    <ConfirmModal
      :show="confirmDelete.show"
      :title="confirmDelete.title"
      :message="confirmDelete.message"
      @confirm="handleConfirmDelete"
      @cancel="confirmDelete.show = false"
    />

  </div>

  <!-- ══ Modal：新增設備 ══ -->
  <Teleport to="body">
      <div v-if="showEquipModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" @click.self="closeEquipModal">
          <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <!-- Modal Header -->
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-1 h-4 bg-emerald-500 rounded-full"></span>
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">新增設備品項</h3>
              </div>
              <button @click="closeEquipModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <!-- Modal Body -->
            <div class="px-6 py-6 space-y-4">
              <div class="space-y-1.5">
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <span class="text-red-500 text-sm leading-none">*</span>設備名稱
                </label>
                <input
                  v-model="equipName"
                  @keydown.enter="addEquipmentType"
                  autofocus
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  :class="equipNameError ? 'border border-red-400 focus:border-red-500' : 'border border-slate-200 dark:border-slate-600 focus:border-emerald-500'"
                  placeholder="例如：H型鋼 300x300"
                >
                <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <template v-if="equipNameError">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ equipNameError }}
                  </template>
                </p>
              </div>
              <div class="space-y-1.5">
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <span class="text-red-500 text-sm leading-none">*</span>計量單位
                </label>
                <input
                  v-model="equipUnit"
                  @keydown.enter="addEquipmentType"
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  :class="equipUnitError ? 'border border-red-400 focus:border-red-500' : 'border border-slate-200 dark:border-slate-600 focus:border-emerald-500'"
                  placeholder="支 / 片 / 個"
                >
                <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <template v-if="equipUnitError">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ equipUnitError }}
                  </template>
                </p>
              </div>
            </div>
            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
              <button @click="closeEquipModal" class="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <AppButton variant="emerald" :disabled="addEquipSaving" @click="addEquipmentType">
                {{ addEquipSaving ? '新增中…' : '確認新增' }}
              </AppButton>
            </div>
          </div>
        </div>
  </Teleport>

  <!-- ══ Modal：新增客戶 ══ -->
  <Teleport to="body">
      <div v-if="showCustomerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" @click.self="closeCustomerModal">
          <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-1 h-4 bg-blue-500 rounded-full"></span>
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">新增客戶</h3>
              </div>
              <button @click="closeCustomerModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div class="px-6 py-6 space-y-4">
              <div class="space-y-1.5">
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <span class="text-red-500 text-sm leading-none">*</span>客戶名稱
                </label>
                <input
                  v-model="newCustomer"
                  @keydown.enter="addCustomer"
                  autofocus
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  :class="customerError ? 'border border-red-400 focus:border-red-500' : 'border border-slate-200 dark:border-slate-600 focus:border-blue-500'"
                  placeholder="輸入客戶名稱"
                >
                <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <template v-if="customerError">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ customerError }}
                  </template>
                </p>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
              <button @click="closeCustomerModal" class="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <AppButton variant="primary" :disabled="customerSaving" @click="addCustomer">
                {{ customerSaving ? '新增中…' : '確認新增' }}
              </AppButton>
            </div>
          </div>
        </div>
  </Teleport>

  <!-- ══ Modal：新增工地 ══ -->
  <Teleport to="body">
      <div v-if="showSiteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" @click.self="closeSiteModal">
          <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-1 h-4 bg-amber-500 rounded-full"></span>
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">新增工地</h3>
              </div>
              <button @click="closeSiteModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div class="px-6 py-6 space-y-4">
              <div class="space-y-1.5">
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <span class="text-red-500 text-sm leading-none">*</span>工地名稱
                </label>
                <input
                  v-model="newSite"
                  @keydown.enter="addSite"
                  autofocus
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  :class="siteError ? 'border border-red-400 focus:border-red-500' : 'border border-slate-200 dark:border-slate-600 focus:border-amber-500'"
                  placeholder="輸入工地名稱"
                >
                <p class="h-4 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <template v-if="siteError">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ siteError }}
                  </template>
                </p>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
              <button @click="closeSiteModal" class="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <AppButton variant="amber" :disabled="siteSaving" @click="addSite">
                {{ siteSaving ? '新增中…' : '確認新增' }}
              </AppButton>
            </div>
          </div>
        </div>
  </Teleport>
</template>
