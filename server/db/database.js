import mongoose from 'mongoose'
const { Schema } = mongoose

// ── 通用設定：讓所有文件都有 id 虛擬欄位 ────────────────
function withId(schema) {
  schema.set('toJSON',   { virtuals: true })
  schema.set('toObject', { virtuals: true })
}

// ── EquipmentType（合併庫存總量）────────────────────────
const equipmentTypeSchema = new Schema({
  name:           { type: String, required: true, unique: true },
  unit:           { type: String, required: true, default: '個' },
  total_quantity: { type: Number, default: 0 },
})
withId(equipmentTypeSchema)

// ── InventoryLog ─────────────────────────────────────────
const inventoryLogSchema = new Schema({
  equipment_type_id: { type: Schema.Types.ObjectId, ref: 'EquipmentType', required: true },
  change_amount:     { type: Number, required: true },
  reason:            String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } })
withId(inventoryLogSchema)

// ── RentalInvoice（含 rows 嵌入）────────────────────────
const rentalRowSchema = new Schema({
  row_order:     { type: Number, default: 0 },
  is_continued:  { type: Boolean, default: false },
  delivery_date: String,
  return_date:   String,
  quantity:      Number,
  daily_rate:    Number,
  start_date:    String,
  end_date:      String,
  days:          Number,
  notes:         String,
}, { _id: false })

const rentalInvoiceSchema = new Schema({
  equipment_type_id: { type: Schema.Types.ObjectId, ref: 'EquipmentType', required: true },
  client_name:       { type: String, required: true },
  vendor:            String,
  site_name:         String,
  year_month:        { type: String, required: true },
  rows:              [rentalRowSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: false } })
withId(rentalInvoiceSchema)

// ── FreightInvoice（含 rows 嵌入）────────────────────────
const freightRowSchema = new Schema({
  row_order:  { type: Number, default: 0 },
  date:       String,
  route_from: String,
  route_to:   String,
  cargo:      String,
  amount:     Number,
  notes:      String,
}, { _id: false })

const freightInvoiceSchema = new Schema({
  client_name: { type: String, required: true },
  year_month:  { type: String, required: true },
  rows:        [freightRowSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: false } })
withId(freightInvoiceSchema)

// ── Models ───────────────────────────────────────────────
const EquipmentType  = mongoose.model('EquipmentType',  equipmentTypeSchema)
const InventoryLog   = mongoose.model('InventoryLog',   inventoryLogSchema)
const RentalInvoice  = mongoose.model('RentalInvoice',  rentalInvoiceSchema)
const FreightInvoice = mongoose.model('FreightInvoice', freightInvoiceSchema)

// ── 預設設備種類（首次啟動時建立）───────────────────────
async function seedDefaults() {
  const defaults = [
    { name: '土桶', unit: '個' },
    { name: '鋼軌', unit: '支' },
    { name: '鐵板', unit: '片' },
    { name: '鐵網', unit: '片' },
  ]
  for (const d of defaults) {
    await EquipmentType.findOneAndUpdate(
      { name: d.name },
      { $setOnInsert: d },
      { upsert: true, new: false }
    )
  }
}

export { EquipmentType, InventoryLog, RentalInvoice, FreightInvoice, seedDefaults }
