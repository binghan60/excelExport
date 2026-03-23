import express from 'express'
const router = express.Router()
import { RentalInvoice, FreightInvoice } from '../db/database.js'
import { buildRentalExcel, buildFreightExcel, buildQuotationExcel, buildSummaryExcel } from '../services/excelExport.js'

function fmtRental(doc) {
  const et = doc.populated('equipment_type_id') ? doc.equipment_type_id : null
  return {
    id:             doc._id.toString(),
    equipment_name: et?.name,
    unit:           et?.unit,
    client_name:    doc.client_name,
    vendor:         doc.vendor || '',
    site_name:      doc.site_name || '',
    year_month:     doc.year_month,
    rows:           doc.rows ?? [],
  }
}

function fmtFreight(doc) {
  return {
    id:          doc._id.toString(),
    client_name: doc.client_name,
    year_month:  doc.year_month,
    rows:        doc.rows ?? [],
  }
}

// POST /api/export/rental/:id
router.post('/rental/:id', async (req, res) => {
  try {
    const doc = await RentalInvoice.findById(req.params.id)
      .populate('equipment_type_id', 'name unit')
    if (!doc) return res.status(404).json({ error: '找不到請款單' })

    const invoice = fmtRental(doc)
    const wb = await buildRentalExcel(invoice)
    const filename = encodeURIComponent(`${invoice.equipment_name}租賃_${invoice.client_name}_${invoice.year_month}.xlsx`)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
    await wb.xlsx.write(res)
    res.end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/export/freight/:id
router.post('/freight/:id', async (req, res) => {
  try {
    const doc = await FreightInvoice.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: '找不到請款單' })

    const invoice = fmtFreight(doc)
    const wb = await buildFreightExcel(invoice)
    const filename = encodeURIComponent(`運費請款單_${invoice.client_name}_${invoice.year_month}.xlsx`)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
    await wb.xlsx.write(res)
    res.end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/export/quotation
router.post('/quotation', async (req, res) => {
  try {
    const { client_name, year_month } = req.body
    if (!client_name) return res.status(400).json({ error: '請提供廠商名稱' })

    const query = { client_name }
    if (year_month) query.year_month = year_month

    const docs = await FreightInvoice.find(query).sort({ year_month: 1 })
    if (docs.length === 0) return res.status(404).json({ error: '找不到運費資料' })

    const freights = docs.map(fmtFreight)
    const wb = await buildQuotationExcel({ client_name, year_month, freights })
    const label = year_month ? `${client_name}_${year_month}` : client_name
    const filename = encodeURIComponent(`報價單_${label}.xlsx`)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
    await wb.xlsx.write(res)
    res.end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/export/summary
router.post('/summary', async (req, res) => {
  try {
    const { client_name, year_month } = req.body
    if (!client_name) return res.status(400).json({ error: '請提供廠商名稱' })

    const rentalQuery = { client_name }
    if (year_month) rentalQuery.year_month = year_month

    const freightQuery = { client_name }
    if (year_month) freightQuery.year_month = year_month

    const [rentalDocs, freightDocs] = await Promise.all([
      RentalInvoice.find(rentalQuery)
        .sort({ year_month: 1, equipment_type_id: 1 })
        .populate('equipment_type_id', 'name unit'),
      FreightInvoice.find(freightQuery).sort({ year_month: 1 }),
    ])

    if (rentalDocs.length === 0 && freightDocs.length === 0)
      return res.status(404).json({ error: '找不到該廠商的請款單' })

    const rentals  = rentalDocs.map(fmtRental)
    const freights = freightDocs.map(fmtFreight)

    const wb = await buildSummaryExcel({ client_name, year_month, rentals, freights })
    const label = year_month ? `${client_name}_${year_month}` : client_name
    const filename = encodeURIComponent(`總請款單_${label}.xlsx`)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
    await wb.xlsx.write(res)
    res.end()
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
