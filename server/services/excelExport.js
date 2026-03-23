import ExcelJS from 'exceljs'

const COMPANY_LINE1 = '友仁起重行'
const COMPANY_LINE2 = '柏億起重工程有限公司'
const COMPANY_ADDRESS = '聯絡地址：台南市永康區中山南路758巷5弄16號'
const COMPANY_TEL = '電話：06-2531198'
const COMPANY_MOBILE = '行動電話：0912-160158'

// 通用樣式
const titleStyle = { font: { bold: true, size: 14 }, alignment: { horizontal: 'center', vertical: 'middle' } }
const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'middle' }, border: allBorder() }
const cellStyle = { alignment: { horizontal: 'center', vertical: 'middle' }, border: allBorder() }

function allBorder() {
  const side = { style: 'thin' }
  return { top: side, left: side, bottom: side, right: side }
}

function mergeAndStyle(ws, range, value, style = {}) {
  ws.mergeCells(range)
  const cell = ws.getCell(range.split(':')[0])
  cell.value = value
  Object.assign(cell, style)
}

// ── 租賃請款單（土桶/鋼軌/鐵板/鐵網）─────────────────────────────────
async function buildRentalExcel(invoice) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('工作表1')

  // 欄寬
  ws.columns = [
    { width: 8 },   // A 承續租用
    { width: 12 },  // B 出貨日期
    { width: 12 },  // C 歸還日期
    { width: 8 },   // D 數量
    { width: 8 },   // E 租用數量
    { width: 10 },  // F 租金
    { width: 12 },  // G 租賃起日
    { width: 12 },  // H 租賃迄日
    { width: 8 },   // I 天數
    { width: 12 },  // J 租賃總額
    { width: 16 },  // K 備註
  ]

  // R1~R3 公司名稱 + 標題
  mergeAndStyle(ws, 'A1:K1', COMPANY_LINE1, titleStyle)
  mergeAndStyle(ws, 'A2:K2', COMPANY_LINE2, titleStyle)
  mergeAndStyle(ws, 'A3:K3', `${invoice.equipment_name}租賃請款單`, titleStyle)
  ws.getRow(1).height = 22
  ws.getRow(2).height = 22
  ws.getRow(3).height = 22

  // R4 客戶資訊列
  ws.getRow(4).height = 20
  mergeAndStyle(ws, 'A4:A4', '廠商', headerStyle)
  mergeAndStyle(ws, 'B4:D4', invoice.vendor || '', cellStyle)
  mergeAndStyle(ws, 'E4:G4', invoice.site_name || '', cellStyle)
  ws.getCell('H4').value = '工地名稱/地址'
  Object.assign(ws.getCell('H4'), headerStyle)
  mergeAndStyle(ws, 'I4:I4', invoice.client_name, cellStyle)
  mergeAndStyle(ws, 'J4:K4', invoice.year_month, cellStyle)

  // R5~R6 表頭（雙列）
  for (const row of [5, 6]) ws.getRow(row).height = 18
  mergeAndStyle(ws, 'A5:A6', '承續租用', headerStyle)
  mergeAndStyle(ws, 'B5:B6', '出貨日期', headerStyle)
  mergeAndStyle(ws, 'C5:C6', '歸還日期', headerStyle)
  mergeAndStyle(ws, 'D5:E5', '租用數量', headerStyle)
  ws.getCell('D6').value = '出貨'
  ws.getCell('E6').value = '數量'
  Object.assign(ws.getCell('D6'), headerStyle)
  Object.assign(ws.getCell('E6'), headerStyle)
  mergeAndStyle(ws, 'F5:F6', `租金\n(元/日)`, headerStyle)
  ws.getCell('F5').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  mergeAndStyle(ws, 'G5:H5', '租賃起迄日期', headerStyle)
  ws.getCell('G6').value = '起日'
  ws.getCell('H6').value = '迄日'
  Object.assign(ws.getCell('G6'), headerStyle)
  Object.assign(ws.getCell('H6'), headerStyle)
  mergeAndStyle(ws, 'I5:I6', '租賃天數', headerStyle)
  mergeAndStyle(ws, 'J5:J6', '租賃總額', headerStyle)
  mergeAndStyle(ws, 'K5:K6', '備註', headerStyle)

  // R7~R13 資料列（7列）
  const rows = invoice.rows || []
  for (let i = 0; i < 7; i++) {
    const r = rows[i] || {}
    const rowNum = 7 + i
    ws.getRow(rowNum).height = 18
    const total = (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0)

    ws.getCell(`A${rowNum}`).value = r.is_continued ? '✓' : ''
    ws.getCell(`B${rowNum}`).value = r.delivery_date || ''
    ws.getCell(`C${rowNum}`).value = r.return_date || ''
    ws.getCell(`D${rowNum}`).value = r.quantity ?? ''
    ws.getCell(`E${rowNum}`).value = r.quantity ?? ''
    ws.getCell(`F${rowNum}`).value = r.daily_rate ?? ''
    ws.getCell(`G${rowNum}`).value = r.start_date || ''
    ws.getCell(`H${rowNum}`).value = r.end_date || ''
    ws.getCell(`I${rowNum}`).value = r.days ?? ''
    ws.getCell(`J${rowNum}`).value = rows[i] ? total : ''
    ws.getCell(`K${rowNum}`).value = r.notes || ''

    for (const col of ['A','B','C','D','E','F','G','H','I','J','K']) {
      Object.assign(ws.getCell(`${col}${rowNum}`), cellStyle)
    }
  }

  // R14 合計
  ws.getRow(14).height = 20
  mergeAndStyle(ws, 'A14:I14', '合計金額', { ...headerStyle, alignment: { horizontal: 'right', vertical: 'middle' } })
  const subtotal = rows.reduce((s, r) => s + (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0), 0)
  mergeAndStyle(ws, 'J14:K14', subtotal, cellStyle)

  // R15 稅
  ws.getRow(15).height = 20
  mergeAndStyle(ws, 'A15:I15', '營業稅 5%', { ...headerStyle, alignment: { horizontal: 'right', vertical: 'middle' } })
  mergeAndStyle(ws, 'J15:K15', Math.round(subtotal * 0.05), cellStyle)

  // R16 總計
  ws.getRow(16).height = 20
  mergeAndStyle(ws, 'A16:I16', '總計', { ...headerStyle, alignment: { horizontal: 'right', vertical: 'middle' } })
  mergeAndStyle(ws, 'J16:K16', subtotal + Math.round(subtotal * 0.05), { ...cellStyle, font: { bold: true } })

  // R17 聯絡資訊
  ws.getRow(17).height = 18
  mergeAndStyle(ws, 'A17:E17', COMPANY_ADDRESS, cellStyle)
  mergeAndStyle(ws, 'F17:G17', COMPANY_TEL, cellStyle)
  mergeAndStyle(ws, 'H17:K17', COMPANY_MOBILE, cellStyle)

  return wb
}

// ── 運費請款單 ────────────────────────────────────────────────────────
async function buildFreightExcel(invoice) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('對帳單')

  ws.columns = [
    { width: 6 },   // A 項次
    { width: 12 },  // B 日期
    { width: 16 },  // C 車程起
    { width: 16 },  // D 車程迄
    { width: 12 },  // E 載運物品
    { width: 12 },  // F
    { width: 12 },  // G
    { width: 12 },  // H 金額
    { width: 12 },  // I
    { width: 12 },  // J 備註
    { width: 12 },  // K
  ]

  mergeAndStyle(ws, 'A1:K1', COMPANY_LINE1, titleStyle)
  mergeAndStyle(ws, 'A2:K2', COMPANY_LINE2, titleStyle)
  mergeAndStyle(ws, 'A3:K3', '請款單', titleStyle)
  ws.getRow(1).height = 22
  ws.getRow(2).height = 22
  ws.getRow(3).height = 22

  // R4
  ws.getRow(4).height = 20
  mergeAndStyle(ws, 'A4:B4', '廠商名稱', headerStyle)
  mergeAndStyle(ws, 'C4:C4', invoice.client_name, cellStyle)
  mergeAndStyle(ws, 'H4:K4', invoice.year_month, cellStyle)

  // R5 表頭
  ws.getRow(5).height = 18
  ws.getCell('A5').value = '項次'
  ws.getCell('B5').value = '日期'
  ws.getCell('C5').value = '車程起'
  ws.getCell('D5').value = '車程迄'
  Object.assign(ws.getCell('C5'), headerStyle)
  Object.assign(ws.getCell('D5'), headerStyle)
  mergeAndStyle(ws, 'E5:G5', '載運物品', headerStyle)
  mergeAndStyle(ws, 'H5:I5', '金額', headerStyle)
  mergeAndStyle(ws, 'J5:K5', '備註', headerStyle)
  Object.assign(ws.getCell('A5'), headerStyle)
  Object.assign(ws.getCell('B5'), headerStyle)

  // R6~R15 資料列（10列）
  const rows = invoice.rows || []
  for (let i = 0; i < 10; i++) {
    const r = rows[i] || {}
    const rowNum = 6 + i
    ws.getRow(rowNum).height = 18

    ws.getCell(`A${rowNum}`).value = rows[i] ? i + 1 : ''
    ws.getCell(`B${rowNum}`).value = r.date || ''
    ws.getCell(`C${rowNum}`).value = r.route_from || ''
    ws.getCell(`D${rowNum}`).value = r.route_to || ''
    Object.assign(ws.getCell(`C${rowNum}`), cellStyle)
    Object.assign(ws.getCell(`D${rowNum}`), cellStyle)
    mergeAndStyle(ws, `E${rowNum}:G${rowNum}`, r.cargo || '', cellStyle)
    mergeAndStyle(ws, `H${rowNum}:I${rowNum}`, r.amount ?? '', cellStyle)
    mergeAndStyle(ws, `J${rowNum}:K${rowNum}`, r.notes || '', cellStyle)
    Object.assign(ws.getCell(`A${rowNum}`), cellStyle)
    Object.assign(ws.getCell(`B${rowNum}`), cellStyle)
  }

  const subtotal = rows.reduce((s, r) => s + (r.amount ?? 0), 0)

  // R16~R18 小計
  for (const [rowNum, label, val] of [
    [16, '合計金額', subtotal],
    [17, '營業稅 5%', Math.round(subtotal * 0.05)],
    [18, '總計', subtotal + Math.round(subtotal * 0.05)],
  ]) {
    ws.getRow(rowNum).height = 20
    mergeAndStyle(ws, `A${rowNum}:G${rowNum}`, label, { ...headerStyle, alignment: { horizontal: 'right', vertical: 'middle' } })
    mergeAndStyle(ws, `H${rowNum}:K${rowNum}`, val, rowNum === 18 ? { ...cellStyle, font: { bold: true } } : cellStyle)
  }

  // R19 聯絡資訊
  ws.getRow(19).height = 18
  mergeAndStyle(ws, 'A19:K19', `${COMPANY_ADDRESS}　${COMPANY_TEL}　${COMPANY_MOBILE}`, cellStyle)

  return wb
}

// ── 報價單（僅運費、彙整同廠商所有運費列）────────────────────────────
async function buildQuotationExcel({ client_name, year_month, freights }) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('報價單')

  ws.columns = [
    { width: 6 },   // A 項次
    { width: 12 },  // B 日期
    { width: 16 },  // C 車程起
    { width: 16 },  // D 車程迄
    { width: 12 },  // E 載運物品
    { width: 12 },  // F
    { width: 12 },  // G
    { width: 12 },  // H 金額
    { width: 12 },  // I
    { width: 12 },  // J 備註
    { width: 12 },  // K
  ]

  mergeAndStyle(ws, 'A1:K1', COMPANY_LINE1, titleStyle)
  mergeAndStyle(ws, 'A2:K2', COMPANY_LINE2, titleStyle)
  mergeAndStyle(ws, 'A3:K3', '報價單', titleStyle)
  ws.getRow(1).height = 22; ws.getRow(2).height = 22; ws.getRow(3).height = 22

  ws.getRow(4).height = 20
  mergeAndStyle(ws, 'A4:B4', '廠商名稱', headerStyle)
  mergeAndStyle(ws, 'C4:C4', client_name, cellStyle)
  mergeAndStyle(ws, 'H4:K4', year_month || '', cellStyle)

  ws.getRow(5).height = 18
  ws.getCell('A5').value = '項次'
  ws.getCell('B5').value = '日期'
  ws.getCell('C5').value = '車程起'
  ws.getCell('D5').value = '車程迄'
  Object.assign(ws.getCell('C5'), headerStyle)
  Object.assign(ws.getCell('D5'), headerStyle)
  mergeAndStyle(ws, 'E5:G5', '載運物品', headerStyle)
  mergeAndStyle(ws, 'H5:I5', '金額', headerStyle)
  mergeAndStyle(ws, 'J5:K5', '備註', headerStyle)
  Object.assign(ws.getCell('A5'), headerStyle)
  Object.assign(ws.getCell('B5'), headerStyle)

  // 合併所有運費明細列
  const allRows = freights.flatMap(inv => inv.rows || [])
  let rowNum = 6
  for (let i = 0; i < allRows.length; i++) {
    const r = allRows[i]
    ws.getRow(rowNum).height = 18
    ws.getCell(`A${rowNum}`).value = i + 1
    ws.getCell(`B${rowNum}`).value = r.date || ''
    ws.getCell(`C${rowNum}`).value = r.route_from || ''
    ws.getCell(`D${rowNum}`).value = r.route_to || ''
    Object.assign(ws.getCell(`C${rowNum}`), cellStyle)
    Object.assign(ws.getCell(`D${rowNum}`), cellStyle)
    mergeAndStyle(ws, `E${rowNum}:G${rowNum}`, r.cargo || '', cellStyle)
    mergeAndStyle(ws, `H${rowNum}:I${rowNum}`, r.amount ?? '', cellStyle)
    mergeAndStyle(ws, `J${rowNum}:K${rowNum}`, r.notes || '', cellStyle)
    Object.assign(ws.getCell(`A${rowNum}`), cellStyle)
    Object.assign(ws.getCell(`B${rowNum}`), cellStyle)
    rowNum++
  }

  const subtotal = allRows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const tax = Math.round(subtotal * 0.05)

  for (const [label, val, bold] of [
    ['合計金額', subtotal, false],
    ['營業稅 5%', tax, false],
    ['總計', subtotal + tax, true],
  ]) {
    ws.getRow(rowNum).height = 20
    mergeAndStyle(ws, `A${rowNum}:G${rowNum}`, label, { ...headerStyle, alignment: { horizontal: 'right', vertical: 'middle' } })
    mergeAndStyle(ws, `H${rowNum}:K${rowNum}`, val, bold ? { ...cellStyle, font: { bold: true } } : cellStyle)
    rowNum++
  }

  ws.getRow(rowNum).height = 18
  mergeAndStyle(ws, `A${rowNum}:K${rowNum}`, `${COMPANY_ADDRESS}　${COMPANY_TEL}　${COMPANY_MOBILE}`, cellStyle)

  return wb
}

// ── 總請款單（彙整同一廠商所有子項目）────────────────────────────────
async function buildSummaryExcel({ client_name, year_month, rentals, freights }) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('總請款單')

  ws.columns = [
    { width: 6 },   // A 項次
    { width: 14 },  // B 項目
    { width: 14 },  // C 設備/日期
    { width: 10 },  // D 數量
    { width: 10 },  // E 單位
    { width: 12 },  // F 租金/金額
    { width: 12 },  // G 起日
    { width: 12 },  // H 迄日
    { width: 8 },   // I 天數
    { width: 14 },  // J 小計
    { width: 16 },  // K 備註
  ]

  // R1~R3 標題
  mergeAndStyle(ws, 'A1:K1', COMPANY_LINE1, titleStyle)
  mergeAndStyle(ws, 'A2:K2', COMPANY_LINE2, titleStyle)
  mergeAndStyle(ws, 'A3:K3', '請款單', titleStyle)
  ws.getRow(1).height = 22; ws.getRow(2).height = 22; ws.getRow(3).height = 22

  // R4 廠商資訊
  ws.getRow(4).height = 20
  mergeAndStyle(ws, 'A4:B4', '廠商名稱', headerStyle)
  mergeAndStyle(ws, 'C4:G4', client_name, cellStyle)
  mergeAndStyle(ws, 'H4:I4', '年月', headerStyle)
  mergeAndStyle(ws, 'J4:K4', year_month || '', cellStyle)

  // R5 表頭
  ws.getRow(5).height = 18
  for (const [col, label] of [
    ['A','項次'],['B','項目'],['C','說明'],['D','數量'],['E','單位'],
    ['F','單價/租金'],['G','起日'],['H','迄日'],['I','天數'],['J','小計'],['K','備註'],
  ]) {
    ws.getCell(`${col}5`).value = label
    Object.assign(ws.getCell(`${col}5`), headerStyle)
  }

  let rowNum = 6
  let grandTotal = 0
  let seq = 1

  // 租賃明細
  for (const inv of rentals) {
    // 小標題列
    ws.getRow(rowNum).height = 18
    mergeAndStyle(ws, `A${rowNum}:K${rowNum}`,
      `【${inv.equipment_name}租賃】${inv.site_name ? '　' + inv.site_name : ''}`,
      { ...headerStyle, font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } } })
    rowNum++

    let sectionTotal = 0
    for (const r of (inv.rows || [])) {
      const total = (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0)
      sectionTotal += total
      ws.getRow(rowNum).height = 18
      ws.getCell(`A${rowNum}`).value = seq++
      ws.getCell(`B${rowNum}`).value = inv.equipment_name + '租賃'
      ws.getCell(`C${rowNum}`).value = r.delivery_date || ''
      ws.getCell(`D${rowNum}`).value = r.quantity ?? ''
      ws.getCell(`E${rowNum}`).value = inv.unit
      ws.getCell(`F${rowNum}`).value = r.daily_rate ?? ''
      ws.getCell(`G${rowNum}`).value = r.start_date || ''
      ws.getCell(`H${rowNum}`).value = r.end_date || ''
      ws.getCell(`I${rowNum}`).value = r.days ?? ''
      ws.getCell(`J${rowNum}`).value = total || ''
      ws.getCell(`K${rowNum}`).value = r.notes || ''
      for (const col of ['A','B','C','D','E','F','G','H','I','J','K']) {
        Object.assign(ws.getCell(`${col}${rowNum}`), cellStyle)
      }
      rowNum++
    }
    grandTotal += sectionTotal
  }

  // 運費明細
  if (freights.length > 0) {
    ws.getRow(rowNum).height = 18
    mergeAndStyle(ws, `A${rowNum}:K${rowNum}`, '【運費】',
      { ...headerStyle, font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } } })
    rowNum++

    for (const inv of freights) {
      for (const r of (inv.rows || [])) {
        ws.getRow(rowNum).height = 18
        ws.getCell(`A${rowNum}`).value = seq++
        ws.getCell(`B${rowNum}`).value = '運費'
        ws.getCell(`C${rowNum}`).value = r.date || ''
        mergeAndStyle(ws, `D${rowNum}:E${rowNum}`, [r.route_from, r.route_to].filter(Boolean).join(' → ') || '', cellStyle)
        mergeAndStyle(ws, `F${rowNum}:I${rowNum}`, r.cargo || '', cellStyle)
        ws.getCell(`J${rowNum}`).value = r.amount ?? ''
        ws.getCell(`K${rowNum}`).value = r.notes || ''
        Object.assign(ws.getCell(`A${rowNum}`), cellStyle)
        Object.assign(ws.getCell(`B${rowNum}`), cellStyle)
        Object.assign(ws.getCell(`C${rowNum}`), cellStyle)
        Object.assign(ws.getCell(`J${rowNum}`), cellStyle)
        Object.assign(ws.getCell(`K${rowNum}`), cellStyle)
        grandTotal += r.amount ?? 0
        rowNum++
      }
    }
  }

  // 合計 / 稅 / 總計
  const tax = Math.round(grandTotal * 0.05)
  for (const [label, val, bold] of [
    ['合計金額', grandTotal, false],
    ['營業稅 5%', tax, false],
    ['總計', grandTotal + tax, true],
  ]) {
    ws.getRow(rowNum).height = 20
    mergeAndStyle(ws, `A${rowNum}:I${rowNum}`, label,
      { ...headerStyle, alignment: { horizontal: 'right', vertical: 'middle' } })
    mergeAndStyle(ws, `J${rowNum}:K${rowNum}`, val,
      bold ? { ...cellStyle, font: { bold: true } } : cellStyle)
    rowNum++
  }

  // 聯絡資訊
  ws.getRow(rowNum).height = 18
  mergeAndStyle(ws, `A${rowNum}:K${rowNum}`,
    `${COMPANY_ADDRESS}　${COMPANY_TEL}　${COMPANY_MOBILE}`, cellStyle)

  return wb
}

export { buildRentalExcel, buildFreightExcel, buildQuotationExcel, buildSummaryExcel }
