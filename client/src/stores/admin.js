import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/index.js'

export const useAdminStore = defineStore('admin', () => {
  const customers = ref([])
  const sites = ref([])
  const loading = ref(false)

  // 供 datalist / filter 使用的純字串陣列（只來自後台管理）
  const allCustomerNames = computed(() => customers.value.map(c => c.name))
  const allSiteNames     = computed(() => sites.value.map(s => s.name))

  async function fetchAll() {
    loading.value = true
    try {
      ;[customers.value, sites.value] = await Promise.all([api.getCustomers(), api.getSites()])
    } finally {
      loading.value = false
    }
  }

  // ── 客戶 CRUD ──────────────────────────────────────────────
  async function addCustomer(name) {
    const c = await api.addCustomer({ name })
    customers.value = [...customers.value, c].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
    return c
  }

  async function deleteCustomer(id) {
    await api.deleteCustomer(id)
    customers.value = customers.value.filter(c => c.id !== id)
  }

  // ── 工地 CRUD ──────────────────────────────────────────────
  async function addSite(name) {
    const s = await api.addSite({ name })
    sites.value = [...sites.value, s].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
    return s
  }

  async function deleteSite(id) {
    await api.deleteSite(id)
    sites.value = sites.value.filter(s => s.id !== id)
  }

  // ── 從歷史請款單批次匯入 ────────────────────────────────────
  async function importFromInvoices() {
    const result = await api.importAdminFromInvoices()
    // 重新抓取以反映新增的資料
    ;[customers.value, sites.value] = await Promise.all([api.getCustomers(), api.getSites()])
    return result // { customers: N, sites: N }
  }

  return {
    customers, sites, loading,
    allCustomerNames, allSiteNames,
    fetchAll, addCustomer, deleteCustomer, addSite, deleteSite,
    importFromInvoices,
  }
})
