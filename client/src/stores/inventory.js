import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/index.js'

export const useInventoryStore = defineStore('inventory', () => {
  const stocks = ref([])
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

  async function adjust(equipment_type_id, change_amount, reason) {
    await api.adjustInventory({ equipment_type_id, change_amount, reason })
    await fetchInventory()
  }

  return { stocks, loading, fetchInventory, adjust }
})
