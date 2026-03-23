const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || '伺服器錯誤')
  }
  return res.json()
}

export const api = {
  // 庫存
  getInventory: () => request('GET', '/inventory'),
  getEquipmentTypes: () => request('GET', '/inventory/equipment-types'),
  adjustInventory: (body) => request('POST', '/inventory/adjust', body),
  addEquipmentType: (body) => request('POST', '/inventory/type', body),
  getInventoryLogs: () => request('GET', '/inventory/logs'),

  // 租賃請款單
  getRentals: () => request('GET', '/rentals'),
  getRental: (id) => request('GET', `/rentals/${id}`),
  createRental: (body) => request('POST', '/rentals', body),
  updateRental: (id, body) => request('PATCH', `/rentals/${id}`, body),
  deleteRental: (id) => request('DELETE', `/rentals/${id}`),

  // 運費請款單
  getFreights: () => request('GET', '/freight'),
  getFreight: (id) => request('GET', `/freight/${id}`),
  createFreight: (body) => request('POST', '/freight', body),
  updateFreight: (id, body) => request('PATCH', `/freight/${id}`, body),
  deleteFreight: (id) => request('DELETE', `/freight/${id}`),

  // 匯出（下載）
  exportRental: async (id) => {
    const res = await fetch(`${BASE}/export/rental/${id}`, { method: 'POST' })
    if (!res.ok) throw new Error('匯出失敗')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodeURIComponent(res.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1] || 'rental.xlsx')
    a.click()
    URL.revokeObjectURL(url)
  },
  exportSummary: async (client_name, year_month) => {
    const res = await fetch(`${BASE}/export/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name, year_month }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '匯出失敗' }))
      throw new Error(err.error || '匯出失敗')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodeURIComponent(res.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1] || 'summary.xlsx')
    a.click()
    URL.revokeObjectURL(url)
  },
  exportFreight: async (id) => {
    const res = await fetch(`${BASE}/export/freight/${id}`, { method: 'POST' })
    if (!res.ok) throw new Error('匯出失敗')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodeURIComponent(res.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1] || 'freight.xlsx')
    a.click()
    URL.revokeObjectURL(url)
  },
  exportQuotation: async (client_name, year_month) => {
    const res = await fetch(`${BASE}/export/quotation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name, year_month }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '匯出失敗' }))
      throw new Error(err.error || '匯出失敗')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodeURIComponent(res.headers.get('Content-Disposition')?.split("filename*=UTF-8''")[1] || 'quotation.xlsx')
    a.click()
    URL.revokeObjectURL(url)
  },
}
