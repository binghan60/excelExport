import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/index.js'

export const useRentalsStore = defineStore('rentals', () => {
  const rentals = ref([])
  const freights = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      ;[rentals.value, freights.value] = await Promise.all([api.getRentals(), api.getFreights()])
    } finally {
      loading.value = false
    }
  }

  async function createRental(body) {
    const created = await api.createRental(body)
    rentals.value.unshift(created)
    return created
  }

  async function updateRental(id, body) {
    const updated = await api.updateRental(id, body)
    const idx = rentals.value.findIndex(r => r.id === id)
    if (idx !== -1) rentals.value[idx] = updated
    return updated
  }

  async function deleteRental(id) {
    await api.deleteRental(id)
    rentals.value = rentals.value.filter(r => r.id !== id)
  }

  async function createFreight(body) {
    const created = await api.createFreight(body)
    freights.value.unshift(created)
    return created
  }

  async function updateFreight(id, body) {
    const updated = await api.updateFreight(id, body)
    const idx = freights.value.findIndex(r => r.id === id)
    if (idx !== -1) freights.value[idx] = updated
    return updated
  }

  async function deleteFreight(id) {
    await api.deleteFreight(id)
    freights.value = freights.value.filter(r => r.id !== id)
  }

  return {
    rentals, freights, loading,
    fetchAll,
    createRental, updateRental, deleteRental,
    createFreight, updateFreight, deleteFreight,
  }
})
