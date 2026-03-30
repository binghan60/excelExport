<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useInventoryStore } from '../stores/inventory.js'
import { api } from '../api/index.js'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'

const store = useInventoryStore()
const logs = ref([])
const rowEdits = reactive({})
const showAddForm = ref(false)
const addForm = ref({ name: '', unit: '個' })
const addSaving = ref(false)
const addError = ref('')
const addSuccess = ref('')

onMounted(async () => {
  await store.fetchInventory()
  logs.value = await api.getInventoryLogs()
  store.stocks.forEach(s => initRow(s.id))
})

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
  addError.value = ''
  if (!addForm.value.name.trim() || !addForm.value.unit.trim()) { addError.value = '請完整填寫名稱與單位'; return }

  addSaving.value = true
  try {
    await api.addEquipmentType({ name: addForm.value.name.trim(), unit: addForm.value.unit.trim() })
    await store.fetchInventory()
    logs.value = await api.getInventoryLogs()
    store.stocks.forEach(s => { if (!rowEdits[s.id]) initRow(s.id) })
    addSuccess.value = `「${addForm.value.name}」新增成功`
    addForm.value = { name: '', unit: '個' }
    showAddForm.value = false
    setTimeout(() => { addSuccess.value = '' }, 3000)
  } catch (e) {
    addError.value = e.message
  } finally {
    addSaving.value = false
  }
}

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
    <!-- 標題 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">庫存資產管理</h1>
        <p class="text-sm font-medium text-slate-400 dark:text-slate-500">設備庫存總量維護與異動記錄</p>
      </div>
      <AppButton variant="emerald" @click="showAddForm = !showAddForm">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </template>
        新增設備品項
      </AppButton>
    </div>

    <!-- 新增設備表單 -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="scale-95 opacity-0" enter-to-class="scale-100 opacity-100">
      <div v-if="showAddForm" class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)]">
        <h3 class="text-base font-semibold mb-5 flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          建立新設備類別
        </h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="space-y-1.5 flex-1 min-w-48">
            <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">設備名稱</label>
            <input v-model="addForm.name" class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-emerald-500 text-base text-slate-700 dark:text-slate-200 transition-all" placeholder="例如：H型鋼 300x300">
          </div>
          <div class="space-y-1.5 w-28">
            <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">單位</label>
            <input v-model="addForm.unit" class="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-emerald-500 text-base text-center text-slate-700 dark:text-slate-200 transition-all" placeholder="支/片">
          </div>
          <div class="flex gap-3">
            <AppButton variant="emerald" :disabled="addSaving" @click="addEquipmentType">確認新增</AppButton>
            <button @click="showAddForm = false" class="h-10 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">取消</button>
          </div>
        </div>
        <p v-if="addError" class="mt-4 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg inline-block">{{ addError }}</p>
      </div>
    </Transition>

    <div v-if="addSuccess" class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl font-semibold text-base text-center">{{ addSuccess }}</div>

    <!-- 庫存清單 -->
    <AppCard title="設備庫存清單" noPadding>
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
                <td class="px-6 py-4 text-center font-mono-num font-semibold text-slate-600 dark:text-slate-300 text-base">{{ s.total_quantity }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal ml-0.5">{{ s.unit }}</span></td>
                <td class="px-6 py-4 text-center font-mono-num font-semibold text-emerald-600 dark:text-emerald-400 text-base">{{ s.rented_out }} <span class="text-xs text-slate-400 dark:text-slate-500 font-normal ml-0.5">{{ s.unit }}</span></td>
                <td class="px-6 py-4 text-center">
                  <span class="font-mono-num font-bold text-lg" :class="s.available <= 0 ? 'text-red-500' : s.available < 5 ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'">{{ s.available }}</span>
                  <span class="text-xs text-slate-400 dark:text-slate-500 ml-1">{{ s.unit }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <span v-if="rowEdits[s.id]?.success" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ rowEdits[s.id].success }}</span>
                      <button @click="toggleRow(s.id)"
                      class="h-9 px-4 rounded-xl border font-semibold text-xs transition-all duration-300 ease-out active:scale-[0.97]"
                      :class="rowEdits[s.id]?.open
                        ? 'border-red-200/80 dark:border-red-800/80 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                        : 'border-slate-200/60 dark:border-slate-600/60 text-slate-500 dark:text-slate-400 hover:border-emerald-400/60 dark:hover:border-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'">
                      {{ rowEdits[s.id]?.open ? '取消' : '異動數量' }}
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
                        <button @click="rowEdits[s.id].amount = String((Number(rowEdits[s.id].amount)||0) - 1)" class="w-9 h-9 font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-lg">－</button>
                        <input v-model="rowEdits[s.id].amount" type="number" class="w-24 text-center text-base font-bold font-mono-num outline-none bg-transparent text-slate-800 dark:text-slate-200" placeholder="0">
                        <button @click="rowEdits[s.id].amount = String((Number(rowEdits[s.id].amount)||0) + 1)" class="w-9 h-9 font-semibold text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors text-lg">＋</button>
                      </div>
                    </div>
                    <div class="space-y-1.5 flex-1 max-w-md">
                      <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">異動備註</label>
                      <input v-model="rowEdits[s.id].reason" class="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg outline-none focus:border-emerald-500 text-base" placeholder="購入新品、損壞報廢、年度清點...">
                    </div>
                    <div class="pt-5">
                      <AppButton variant="emerald" @click="confirmAdjust(s)" :disabled="rowEdits[s.id].saving || !rowEdits[s.id].amount">確認更新</AppButton>
                    </div>
                    <p v-if="rowEdits[s.id].error" class="text-xs font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900">{{ rowEdits[s.id].error }}</p>
                  </div>
                </td>
              </tr>
            </template>
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
              <td class="px-6 py-3 text-center text-slate-500 dark:text-slate-400 text-xs font-mono-num">{{ fmtDate(log.created_at) }}</td>
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
  </div>
</template>
