import express from 'express'
import { RentalInvoice } from '../db/database.js'

const router = express.Router()

function fmt(doc) {
  // Backwards compatibility: fallback to top-level if row level is missing
  const topEt = (doc.equipment_type_id && typeof doc.equipment_type_id === 'object' && doc.equipment_type_id._id) ? doc.equipment_type_id : null
  
  const rows = (doc.rows ?? []).map(r => {
    const rowEt = (r.equipment_type_id && typeof r.equipment_type_id === 'object' && r.equipment_type_id._id) ? r.equipment_type_id : null
    const finalEt = rowEt || topEt
    // Convert to plane object to avoid mongoose internal properties
    const rObj = typeof r.toObject === 'function' ? r.toObject() : r
    return {
      ...rObj,
      equipment_type_id: finalEt?._id?.toString() || r.equipment_type_id?.toString(),
      equipment_name:    finalEt?.name,
      unit:              finalEt?.unit,
    }
  })

  return {
    id:                doc._id.toString(),
    client_name:       doc.client_name,
    vendor:            doc.vendor || '',
    site_name:         doc.site_name || '',
    year_month:        doc.year_month,
    created_at:        doc.created_at,
    rows:              rows,
    equipment_names:   Array.from(new Set(rows.map(r => r.equipment_name).filter(Boolean)))
  }
}

// GET /api/rentals
router.get('/', async (req, res) => {
  try {
    const docs = await RentalInvoice.find()
      .sort({ year_month: -1, _id: -1 })
      .populate('equipment_type_id', 'name unit')
      .populate('rows.equipment_type_id', 'name unit')
    res.json(docs.map(fmt))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/rentals/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await RentalInvoice.findById(req.params.id)
      .populate('equipment_type_id', 'name unit')
      .populate('rows.equipment_type_id', 'name unit')
    if (!doc) return res.status(404).json({ error: '找不到請款單' })
    res.json(fmt(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/rentals
router.post('/', async (req, res) => {
  try {
    const { equipment_type_id, client_name, vendor, site_name, year_month, rows = [] } = req.body
    if (!client_name || !year_month)
      return res.status(400).json({ error: '缺少必填欄位：客戶名稱、年月' })

    const doc = await RentalInvoice.create({
      equipment_type_id, // Keep for legacy if provided, but UI will likely stop sending this as a global
      client_name, vendor, site_name, year_month,
      rows: rows.map((r, i) => ({ ...r, row_order: i })),
    })
    await doc.populate('equipment_type_id', 'name unit')
    await doc.populate('rows.equipment_type_id', 'name unit')
    res.status(201).json(fmt(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH /api/rentals/:id
router.patch('/:id', async (req, res) => {
  try {
    const doc = await RentalInvoice.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: '找不到請款單' })

    const { equipment_type_id, client_name, vendor, site_name, year_month, rows } = req.body
    if (equipment_type_id !== undefined) doc.equipment_type_id = equipment_type_id
    if (client_name  !== undefined) doc.client_name  = client_name
    if (vendor       !== undefined) doc.vendor       = vendor
    if (site_name    !== undefined) doc.site_name    = site_name
    if (year_month   !== undefined) doc.year_month   = year_month
    if (rows         !== undefined) doc.rows = rows.map((r, i) => ({ ...r, row_order: i }))

    await doc.save()
    await doc.populate('equipment_type_id', 'name unit')
    await doc.populate('rows.equipment_type_id', 'name unit')
    res.json(fmt(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/rentals/:id
router.delete('/:id', async (req, res) => {
  try {
    await RentalInvoice.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
