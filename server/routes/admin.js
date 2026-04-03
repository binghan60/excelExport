import express from 'express'
import { Customer, Site, RentalInvoice, FreightInvoice } from '../db/database.js'

const router = express.Router()

// ── 客戶 ─────────────────────────────────────────────────

router.get('/customers', async (_req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 })
    res.json(customers.map(c => ({ id: c._id.toString(), name: c.name })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/customers', async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: '請填寫客戶名稱' })
    const existing = await Customer.findOne({ name: name.trim() })
    if (existing) return res.status(400).json({ error: '此客戶已存在' })
    const c = await Customer.create({ name: name.trim() })
    res.status(201).json({ id: c._id.toString(), name: c.name })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 工地 ─────────────────────────────────────────────────

router.get('/sites', async (_req, res) => {
  try {
    const sites = await Site.find().sort({ name: 1 })
    res.json(sites.map(s => ({ id: s._id.toString(), name: s.name })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/sites', async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: '請填寫工地名稱' })
    const existing = await Site.findOne({ name: name.trim() })
    if (existing) return res.status(400).json({ error: '此工地已存在' })
    const s = await Site.create({ name: name.trim() })
    res.status(201).json({ id: s._id.toString(), name: s.name })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/sites/:id', async (req, res) => {
  try {
    await Site.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 從歷史請款單批次匯入 ────────────────────────────────────
router.post('/import-from-invoices', async (_req, res) => {
  try {
    const [rentals, freights] = await Promise.all([
      RentalInvoice.find({}, 'client_name site_name').lean(),
      FreightInvoice.find({}, 'client_name site_name').lean(),
    ])

    const customerNames = [...new Set([
      ...rentals.map(r => r.client_name),
      ...freights.map(f => f.client_name),
    ].filter(Boolean))]

    const siteNames = [...new Set([
      ...rentals.map(r => r.site_name),
      ...freights.map(f => f.site_name),
    ].filter(Boolean))]

    // 只新增不存在的（unique index 會擋重複，ordered:false 跳過衝突繼續）
    const [cResult, sResult] = await Promise.all([
      customerNames.length
        ? Customer.insertMany(customerNames.map(name => ({ name })), { ordered: false }).catch(e => e)
        : Promise.resolve({ insertedCount: 0 }),
      siteNames.length
        ? Site.insertMany(siteNames.map(name => ({ name })), { ordered: false }).catch(e => e)
        : Promise.resolve({ insertedCount: 0 }),
    ])

    res.json({
      customers: cResult.insertedCount ?? 0,
      sites:     sResult.insertedCount ?? 0,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
