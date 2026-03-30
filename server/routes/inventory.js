import express from 'express'
import { EquipmentType, InventoryLog, RentalInvoice } from '../db/database.js'

const router = express.Router()

// GET /api/inventory
router.get('/', async (_req, res) => {
  try {
    const types = await EquipmentType.find().sort({ _id: 1 })

    const today = new Date().toISOString().slice(0, 10)
    const rentedAgg = await RentalInvoice.aggregate([
      { $unwind: '$rows' },
      { $match: {
          $or: [
            { 'rows.return_date': { $in: [null, ''] } },
            { 'rows.return_date': { $gte: today } },
          ],
          'rows.quantity': { $ne: null },
      }},
      { $group: { _id: '$rows.equipment_type_id', rented_out: { $sum: '$rows.quantity' } } },
    ])
    const rentedMap = {}
    for (const r of rentedAgg) rentedMap[r._id.toString()] = r.rented_out

    res.json(types.map(et => {
      const rented_out = rentedMap[et._id.toString()] ?? 0
      return {
        id:             et._id.toString(),
        name:           et.name,
        unit:           et.unit,
        total_quantity: et.total_quantity,
        rented_out,
        available:      et.total_quantity - rented_out,
      }
    }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/inventory/equipment-types
router.get('/equipment-types', async (_req, res) => {
  try {
    const types = await EquipmentType.find().sort({ _id: 1 })
    res.json(types.map(et => ({ id: et._id.toString(), name: et.name, unit: et.unit, total_quantity: et.total_quantity })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/inventory/logs
router.get('/logs', async (_req, res) => {
  try {
    const logs = await InventoryLog.find()
      .sort({ _id: -1 })
      .limit(100)
      .populate('equipment_type_id', 'name unit')
    res.json(logs.map(l => ({
      id:                l._id.toString(),
      equipment_type_id: l.equipment_type_id?._id?.toString(),
      equipment_name:    l.equipment_type_id?.name,
      unit:              l.equipment_type_id?.unit,
      change_amount:     l.change_amount,
      reason:            l.reason || '',
      created_at:        l.created_at,
    })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/inventory/type — 新增設備種類
router.post('/type', async (req, res) => {
  try {
    const { name, unit } = req.body
    if (!name || !unit) return res.status(400).json({ error: '請填寫設備名稱與單位' })

    const existing = await EquipmentType.findOne({ name })
    if (existing) return res.status(400).json({ error: '此設備種類已存在' })

    const et = await EquipmentType.create({ name, unit, total_quantity: 0 })
    res.status(201).json({ id: et._id.toString(), name: et.name, unit: et.unit })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/inventory/adjust
router.post('/adjust', async (req, res) => {
  try {
    const { equipment_type_id, change_amount, reason } = req.body
    if (!equipment_type_id || change_amount === undefined)
      return res.status(400).json({ error: '缺少必填欄位：設備種類、調整數量' })

    const et = await EquipmentType.findById(equipment_type_id)
    if (!et) return res.status(404).json({ error: '找不到設備種類' })

    await InventoryLog.create({ equipment_type_id, change_amount, reason: reason || undefined })
    et.total_quantity += change_amount
    await et.save()

    res.json({ success: true, total_quantity: et.total_quantity })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
