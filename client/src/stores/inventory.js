import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/index.js'

export const useInventoryStore = defineStore('inventory', () => {
  const stocks = ref([])
  const equipmentTypes = ref([])
  const logs = ref([])
  const loading = ref(false)

  async function fetchInventory(force = false) {
    if (!force && stocks.value.length > 0) return
    loading.value = true
    try {
      stocks.value = await api.getInventory()
    } finally {
      loading.value = false
    }
  }

  async function fetchEquipmentTypes(force = false) {
    if (!force && equipmentTypes.value.length > 0) return
    equipmentTypes.value = await api.getEquipmentTypes()
  }

  async function fetchLogs(force = false) {
    if (!force && logs.value.length > 0) return
    logs.value = await api.getInventoryLogs()
  }

  async function adjust(equipment_type_id, change_amount, reason) {
    await api.adjustInventory({ equipment_type_id, change_amount, reason })
    // 更新庫存與日誌
    await Promise.all([fetchInventory(true), fetchLogs(true)])
  }

  return { stocks, equipmentTypes, logs, loading, fetchInventory, fetchEquipmentTypes, fetchLogs, adjust }
})
