<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useInventoryStore } from '../stores/inventory.js'
import { useAdminStore } from '../stores/admin.js'
import { api } from '../api/index.js'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'

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
const logs = ref([])
const rowEdits = reactive({})
const deleteEquipId = ref(null)

// 設備 Modal
const showEquipModal = ref(false)
const addEquipForm = ref({ name: '', unit: '個' })
const addEquipSaving = ref(false)
const addEquipError = ref('')

function openEquipModal() {
  addEquipForm.value = { name: '', unit: '個' }
  addEquipError.value = ''
  showEquipModal.value = true
}

function closeEquipModal() {
  showEquipModal.value = false
  addEquipError.value = ''
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
  addEquipError.value = ''
  if (!addEquipForm.value.name.trim() || !addEquipForm.value.unit.trim()) {
    addEquipError.value = '請完整填寫名稱與單位'; return
  }
  addEquipSaving.value = true
  try {
    await api.addEquipmentType({ name: addEquipForm.value.name.trim(), unit: addEquipForm.value.unit.trim() })
    await store.fetchInventory()
    logs.value = await api.getInventoryLogs()
    store.stocks.forEach(s => { if (!rowEdits[s.id]) initRow(s.id) })
    closeEquipModal()
  } catch (e) {
    addEquipError.value = e.message
  } finally {
    addEquipSaving.value = false
  }
}

async function deleteEquipment(id) {
  if (deleteEquipId.value === id) {
    try {
      await api.deleteEquipmentType(id)
      await store.fetchInventory()
      logs.value = await api.getInventoryLogs()
      delete rowEdits[id]
    } catch (e) {
      alert(e.message)
    } finally {
      deleteEquipId.value = null
    }
  } else {
    deleteEquipId.value = id
    setTimeout(() => { if (deleteEquipId.value === id) deleteEquipId.value = null }, 3000)
  }
}

// ── 客戶 Tab ──────────────────────────────────────────────
const deleteCustomerId = ref(null)
const showCustomerModal = ref(false)
const newCustomer = ref('')
const customerSaving = ref(false)
const customerError = ref('')
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
    alert(e.message)
  }
}

function openCustomerModal() { newCustomer.value = ''; customerError.value = ''; showCustomerModal.value = true }
function closeCustomerModal() { showCustomerModal.value = false; customerError.value = '' }

async function addCustomer() {
  customerError.value = ''
  if (!newCustomer.value.trim()) { customerError.value = '請填寫客戶名稱'; return }
  customerSaving.value = true
  try {
    await adminStore.addCustomer(newCustomer.value.trim())
    closeCustomerModal()
  } catch (e) {
    customerError.value = e.message
  } finally {
    customerSaving.value = false
  }
}

async function deleteCustomer(id) {
  if (deleteCustomerId.value === id) {
    try { await adminStore.deleteCustomer(id) } catch (e) { alert(e.message) } finally { deleteCustomerId.value = null }
  } else {
    deleteCustomerId.value = id
    setTimeout(() => { if (deleteCustomerId.value === id) deleteCustomerId.value = null }, 3000)
  }
}

// ── 工地 Tab ──────────────────────────────────────────────
const deleteSiteId = ref(null)
const showSiteModal = ref(false)
const newSite = ref('')
const siteSaving = ref(false)
const siteError = ref('')

function openSiteModal() { newSite.value = ''; siteError.value = ''; showSiteModal.value = true }
function closeSiteModal() { showSiteModal.value = false; siteError.value = '' }

async function addSite() {
  siteError.value = ''
  if (!newSite.value.trim()) { siteError.value = '請填寫工地名稱'; return }
  siteSaving.value = true
  try {
    await adminStore.addSite(newSite.value.trim())
    closeSiteModal()
  } catch (e) {
    siteError.value = e.message
  } finally {
    siteSaving.value = false
  }
}

async function deleteSite(id) {
  if (deleteSiteId.value === id) {
    try { await adminStore.deleteSite(id) } catch (e) { alert(e.message) } finally { deleteSiteId.value = null }
  } else {
    deleteSiteId.value = id
    setTimeout(() => { if (deleteSiteId.value === id) deleteSiteId.value = null }, 3000)
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
        <p class="text-sm font-medium text-slate-400 dark:text-slate-500">管理設備、客戶與工地選項，新增後即可在下拉選單中選取</p>
      </div>
      <!-- 新增按鈕（隨 Tab 切換） -->
      <AppButton v-if="activeTab === 'equipment'" variant="emerald" @click="openEquipModal">
        <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></template>
        新增設備品項
      </AppButton>
      <AppButton v-else-if="activeTab === 'customers'" variant="primary" @click="openCustomerModal">
        <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></template>
        新增客戶
      </AppButton>
      <AppButton v-else-if="activeTab === 'sites'" variant="amber" @click="openSiteModal">
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
        class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out select-none"
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
                      <button @click="deleteEquipment(s.id)"
                        class="h-9 px-3 rounded-xl border font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                        :class="deleteEquipId === s.id
                          ? 'border-red-400 text-white bg-red-500'
                          : 'border-slate-200/60 dark:border-slate-600/60 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50'">
                        {{ deleteEquipId === s.id ? '確認刪除' : '刪除' }}
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- 內嵌調整區 -->
                <tr v-if="rowEdits[s.id]?.open" class="bg-emerald-50/20 dark:bg-emerald-950/10">
                  <td colspan="5" class="px-8 py-6 border-t-0">
                    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6">
                      <div class="space-y-1.5">
                        <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">異動數量（正進負出）</label>
                        <div class="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1 rounded-lg">
                          <button @click="rowEdits[s.id].amount = String((Number(rowEdits[s.id].amount)||0) - 1)" class="w-9 h-9 font-semibold text-slate-400 hover:text-red-500 transition-colors text-lg">－</button>
                          <input v-model="rowEdits[s.id].amount" type="number" class="w-24 text-center text-base font-bold outline-none bg-transparent text-slate-800 dark:text-slate-200" placeholder="0">
                          <button @click="rowEdits[s.id].amount = String((Number(rowEdits[s.id].amount)||0) + 1)" class="w-9 h-9 font-semibold text-slate-400 hover:text-emerald-500 transition-colors text-lg">＋</button>
                        </div>
                      </div>
                      <div class="space-y-1.5 flex-1 max-w-md">
                        <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">異動備註</label>
                        <input v-model="rowEdits[s.id].reason" class="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg outline-none focus:border-emerald-500 text-base" placeholder="購入新品、損壞報廢、年度清點...">
                      </div>
                      <div class="pt-5">
                        <AppButton variant="emerald" @click="confirmAdjust(s)" :disabled="rowEdits[s.id].saving || !rowEdits[s.id].amount">確認更新</AppButton>
                      </div>
                      <p v-if="rowEdits[s.id].error" class="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{{ rowEdits[s.id].error }}</p>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="store.stocks.length === 0">
                <td colspan="5" class="py-16 text-center text-sm text-slate-400 dark:text-slate-600">尚無設備品項，請點選「新增設備品項」</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- 異動日誌 -->
      <AppCard title="庫存異動紀錄" subtitle="變更歷史" noPadding>
        <div v-if="logs.length === 0" class="py-16 text-center text-sm text-slate-400 dark:text-slate-600">尚無異動記錄</div>
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
                    @click="deleteCustomer(c.id)"
                    class="h-9 px-3 rounded-xl border font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                    :class="deleteCustomerId === c.id
                      ? 'border-red-400 text-white bg-red-500'
                      : 'border-slate-200/60 dark:border-slate-600/60 text-slate-400 dark:text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50'"
                  >
                    {{ deleteCustomerId === c.id ? '確認刪除' : '刪除' }}
                  </button>
                </td>
              </tr>
              <tr v-if="adminStore.customers.length === 0">
                <td colspan="3" class="py-16 text-center text-sm text-slate-400 dark:text-slate-600">尚無客戶，請點選「新增客戶」</td>
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
                    @click="deleteSite(s.id)"
                    class="h-9 px-3 rounded-xl border font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                    :class="deleteSiteId === s.id
                      ? 'border-red-400 text-white bg-red-500'
                      : 'border-slate-200/60 dark:border-slate-600/60 text-slate-400 dark:text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50'"
                  >
                    {{ deleteSiteId === s.id ? '確認刪除' : '刪除' }}
                  </button>
                </td>
              </tr>
              <tr v-if="adminStore.sites.length === 0">
                <td colspan="3" class="py-16 text-center text-sm text-slate-400 dark:text-slate-600">尚無工地，請點選「新增工地」</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>

  </div>

  <!-- ══ Modal：新增設備 ══ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showEquipModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="closeEquipModal">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          appear
        >
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
                <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">設備名稱 *</label>
                <input
                  v-model="addEquipForm.name"
                  @keydown.enter="addEquipmentType"
                  autofocus
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  placeholder="例如：H型鋼 300x300"
                >
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">計量單位 *</label>
                <input
                  v-model="addEquipForm.unit"
                  @keydown.enter="addEquipmentType"
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  placeholder="支 / 片 / 個"
                >
              </div>
              <p v-if="addEquipError" class="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">{{ addEquipError }}</p>
            </div>
            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
              <button @click="closeEquipModal" class="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <AppButton variant="emerald" :disabled="addEquipSaving" @click="addEquipmentType">
                {{ addEquipSaving ? '新增中…' : '確認新增' }}
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ Modal：新增客戶 ══ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showCustomerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="closeCustomerModal">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          appear
        >
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
                <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">客戶名稱 *</label>
                <input
                  v-model="newCustomer"
                  @keydown.enter="addCustomer"
                  autofocus
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  placeholder="輸入客戶名稱"
                >
              </div>
              <p v-if="customerError" class="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">{{ customerError }}</p>
            </div>
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
              <button @click="closeCustomerModal" class="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <AppButton variant="primary" :disabled="customerSaving" @click="addCustomer">
                {{ customerSaving ? '新增中…' : '確認新增' }}
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ Modal：新增工地 ══ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showSiteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="closeSiteModal">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          appear
        >
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
                <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">工地名稱 *</label>
                <input
                  v-model="newSite"
                  @keydown.enter="addSite"
                  autofocus
                  class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-base text-slate-700 dark:text-slate-200 transition-all"
                  placeholder="輸入工地名稱"
                >
              </div>
              <p v-if="siteError" class="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">{{ siteError }}</p>
            </div>
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
              <button @click="closeSiteModal" class="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <AppButton variant="amber" :disabled="siteSaving" @click="addSite">
                {{ siteSaving ? '新增中…' : '確認新增' }}
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
