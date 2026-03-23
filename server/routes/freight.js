import express from 'express'
import { FreightInvoice } from '../db/database.js'

const router = express.Router()

function fmt(doc) {
  return {
    id:          doc._id.toString(),
    client_name: doc.client_name,
    year_month:  doc.year_month,
    created_at:  doc.created_at,
    rows:        doc.rows ?? [],
  }
}

// GET /api/freight
router.get('/', async (_req, res) => {
  try {
    const docs = await FreightInvoice.find().sort({ year_month: -1, _id: -1 })
    res.json(docs.map(fmt))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/freight/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await FreightInvoice.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: '找不到請款單' })
    res.json(fmt(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/freight
router.post('/', async (req, res) => {
  try {
    const { client_name, year_month, rows = [] } = req.body
    if (!client_name || !year_month)
      return res.status(400).json({ error: '缺少必填欄位：客戶名稱、年月' })

    const doc = await FreightInvoice.create({
      client_name, year_month,
      rows: rows.map((r, i) => ({ ...r, row_order: i })),
    })
    res.status(201).json(fmt(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH /api/freight/:id
router.patch('/:id', async (req, res) => {
  try {
    const doc = await FreightInvoice.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: '找不到請款單' })

    const { client_name, year_month, rows } = req.body
    if (client_name !== undefined) doc.client_name = client_name
    if (year_month  !== undefined) doc.year_month  = year_month
    if (rows        !== undefined) doc.rows = rows.map((r, i) => ({ ...r, row_order: i }))

    await doc.save()
    res.json(fmt(doc))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/freight/:id
router.delete('/:id', async (req, res) => {
  try {
    await FreightInvoice.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
