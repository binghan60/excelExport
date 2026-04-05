import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/index.js'

export const useRentalsStore = defineStore('rentals', () => {
  const rentals = ref([])
  const freights = ref([])
  const loading = ref(false)

  async function fetchRentals(force = false) {
    if (!force && rentals.value.length > 0) return
    loading.value = true
    try {
      rentals.value = await api.getRentals()
    } finally {
      loading.value = false
    }
  }

  async function fetchFreights(force = false) {
    if (!force && freights.value.length > 0) return
    loading.value = true
    try {
      freights.value = await api.getFreights()
    } finally {
      loading.value = false
    }
  }

  async function fetchAll(force = false) {
    loading.value = (rentals.value.length === 0 || freights.value.length === 0)
    try {
      await Promise.all([fetchRentals(force), fetchFreights(force)])
    } finally {
      loading.value = false
    }
  }

  async function createRental(body) {
    const tempId = `_pending_${Date.now()}`
    rentals.value.unshift({ ...body, id: tempId, equipment_names: [], _pending: true })
    try {
      const created = await api.createRental(body)
      const idx = rentals.value.findIndex(r => r.id === tempId)
      if (idx !== -1) rentals.value.splice(idx, 1, created)
      return created
    } catch (e) {
      rentals.value = rentals.value.filter(r => r.id !== tempId)
      throw e
    }
  }

  async function updateRental(id, body) {
    const idx = rentals.value.findIndex(r => r.id === id)
    const original = idx !== -1 ? { ...rentals.value[idx] } : null
    if (idx !== -1) rentals.value[idx] = { ...rentals.value[idx], ...body, _pending: true }
    try {
      const updated = await api.updateRental(id, body)
      const i = rentals.value.findIndex(r => r.id === id)
      if (i !== -1) rentals.value[i] = updated
      return updated
    } catch (e) {
      if (original) { const i = rentals.value.findIndex(r => r.id === id); if (i !== -1) rentals.value[i] = original }
      throw e
    }
  }

  async function deleteRental(id) {
    await api.deleteRental(id)
    rentals.value = rentals.value.filter(r => r.id !== id)
  }

  async function createFreight(body) {
    const tempId = `_pending_${Date.now()}`
    freights.value.unshift({ ...body, id: tempId, _pending: true })
    try {
      const created = await api.createFreight(body)
      const idx = freights.value.findIndex(r => r.id === tempId)
      if (idx !== -1) freights.value.splice(idx, 1, created)
      return created
    } catch (e) {
      freights.value = freights.value.filter(r => r.id !== tempId)
      throw e
    }
  }

  async function updateFreight(id, body) {
    const idx = freights.value.findIndex(r => r.id === id)
    const original = idx !== -1 ? { ...freights.value[idx] } : null
    if (idx !== -1) freights.value[idx] = { ...freights.value[idx], ...body, _pending: true }
    try {
      const updated = await api.updateFreight(id, body)
      const i = freights.value.findIndex(r => r.id === id)
      if (i !== -1) freights.value[i] = updated
      return updated
    } catch (e) {
      if (original) { const i = freights.value.findIndex(r => r.id === id); if (i !== -1) freights.value[i] = original }
      throw e
    }
  }

  async function deleteFreight(id) {
    await api.deleteFreight(id)
    freights.value = freights.value.filter(r => r.id !== id)
  }

  return {
    rentals, freights, loading,
    fetchAll, fetchRentals, fetchFreights,
    createRental, updateRental, deleteRental,
    createFreight, updateFreight, deleteFreight,
  }
})
