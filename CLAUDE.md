# 專案概述 (Project Overview)

為友仁起重行設計的帳務管理系統，主要處理「租賃請款」與「運費請款」。系統特色為：UI 精緻現代、操作直覺（大字體/大按鈕）、深色模式支援，並具備數據視覺化與 Excel 匯出功能。

## 技術棧 (Tech Stack)

### 前端 (Frontend)
- **核心**：Vue 3 (Composition API) + Vite
- **造型**：Tailwind CSS 4 (純 CSS 配置)
- **狀態管理**：Pinia
- **路由**：Vue Router
- **視覺化**：
  - `dhtmlx-gantt` (租賃時程甘特圖)
  - `Chart.js` (請款趨勢圖表)
- **設計風格**：
  - 玻璃擬態 (Glassmorphism)
  - 現代網格佈局 (Modern Grid Layouts)
  - 微交互動畫 (Micro-animations with Framer-like transitions)

### 後端 (Backend)
- **執行環境**：Node.js
- **框架**：Express
- **資料庫**：MongoDB (使用 Mongoose)
- **Excel 產生**：ExcelJS

---

## 核心功能模組 (Features)

### 1. 數據總覽 (Dashboard)
- **請款趨勢**：顯示近 6 個月的租賃與運費總額。
- **設備庫存**：即時庫存狀態卡片，顯示總儲量、外借中（自動計算）與可用在庫。
- **甘特圖**：視覺化設備出租排程，支援顏色區分（土桶、鋼軌、鐵板、鐵網）。

### 2. 租賃請款 (Rentals)
- 管理設備租賃明細。
- 自動計算租期、天數與金額。
- 支援一次請款多個設備品項。

### 3. 運費請款 (Freights)
- 管理運費單，包含日期、路線、車型／貨物與金額。

### 4. 庫存管理 (Inventory)
- 維護設備種類。
- 手動調整在庫數量（買入、損耗）。
- 紀錄庫存異動日誌。

### 5. 報表匯出 (Summary/Export)
- 產生總請款單與報價單（Excel 格式）。
- 格式需與樣板檔案 (`sample/`) 嚴格一致。

---

## 目錄結構 (Project Structure)

```text
excelExport/
├── client/                 # Vue 3 前端
│   ├── src/
│   │   ├── api/            # API 客戶端
│   │   ├── components/
│   │   │   ├── base/       # 標準化 UI 組件 (AppButton, AppInput, AppCard 等)
│   │   │   └── ...         # 業務組件 (RevenueChart, DateRangePicker 等)
│   │   ├── stores/         # Pinia 狀態
│   │   ├── views/          # 頁面組件
│   │   └── App.vue         # 佈局入口
│   └── public/             # 靜態資源
├── server/                 # Node.js 後端
│   ├── db/                 # Mongoose 模型與資料庫連線
│   ├── routes/             # API 路由
│   ├── sample/             # Excel 匯出樣板
│   └── index.js            # 入口文件
└── CLAUDE.md               # 本開發指南
```

---

## 開發指令 (Workflow)

### 前端
```bash
cd client
npm install
npm run dev       # 預覽地址：http://localhost:5173
```

### 後端
```bash
cd server
npm install
node index.js     # 預設地址：http://localhost:3000 (或依 .env 設定)
```

---

## 設計規範 (Design Guidelines)
- **配色**：Indigo (主色), Blue (租賃), Amber (運費), Emerald (庫存/可用), Rose (警示)。
- **字體**：偏向大字體設計 (14px-16px 基底)，操作按鈕高度統一。
- **響應式**：支援手機與平板操作，導覽列在小螢幕時收合為漢堡選單。
- **空狀態**：使用提示語引導使用者輸入。
覽器下載檔案
```

## 目錄結構

```
excelExport/
├── client/             # Vue 3 前端
│   ├── src/
│   │   ├── views/
│   │   │   ├── DashboardView.vue      # 儀表板（甘特圖 + 庫存卡片）
│   │   │   ├── RentalFormView.vue     # 子項目請款單輸入（同步建立租賃記錄）
│   │   │   ├── SummaryView.vue        # 總請款單
│   │   │   └── InventoryMgmtView.vue  # 庫存管理（手動輸入增減）
│   │   ├── components/
│   │   │   ├── GanttChart.vue         # 甘特圖元件
│   │   │   └── InventoryCard.vue      # 庫存狀態卡片
│   │   ├── stores/     # Pinia 狀態
│   │   └── router/     # 路由設定
│   └── package.json
├── server/             # Node.js 後端
│   ├── routes/         # API 路由（export、租賃 CRUD 等）
│   ├── services/       # Excel 產生邏輯（ExcelJS）
│   ├── db/             # SQLite 資料庫檔案與初始化
│   ├── app.js          # Express 入口
│   └── package.json
└── sample/             # Excel 樣板檔（匯出格式參考）
    ├── 請款單.xlsx
    ├── 報價單.xlsx
    ├── 土桶租賃.xlsx
    ├── 鋼軌租賃.xlsx
    ├── 鐵板租賃.xlsx
    └── 鐵網租賃.xlsx
```

## UI/UX 設計原則

### 基本原則（長輩友善）
- 字體大（建議 18px 以上）
- 按鈕大、間距寬，避免誤觸
- 操作步驟少，流程線性清楚
- 重要操作（匯出、儲存）按鈕顯眼
- 錯誤提示文字清楚易懂
- 避免複雜的下拉選單或巢狀操作
- 中文介面，不用英文術語

### 配色系統（依模組）
| 模組 | 主色 | 用途 |
|------|------|------|
| 數據總覽 | Indigo | 主色 / Logo |
| 租賃請款 | Blue | 表單、按鈕、標籤 |
| 運費請款 | Amber | 表單、按鈕、標籤 |
| 庫存管理 | Emerald | 可用狀態、正常 |
| 報表匯出 | Violet | 匯出動作 |
| 警示 / 刪除 | Rose | 錯誤、危險操作 |

### 表單驗證（VeeValidate 4 + yup）
- 使用 `useForm()` + `useField()` 設定驗證規則
- **必填欄位**：label 前加紅色星號 `<span class="text-red-500 text-sm leading-none">*</span>`
- **錯誤訊息**：使用固定高度 `<p class="h-4 text-xs text-red-500 mt-0.5">` 預留空間，內容用 `<template v-if="error">` 條件渲染，避免錯誤訊息出現時造成版面跳動
- **送出前驗證**：使用 `const { valid } = await validate()` 統一驗證，驗證失敗直接 return，不送 API
- 動態列驗證（如設備品項）：用 `rowErrors = ref([])` 陣列逐行記錄錯誤

### 表單送出按鈕
- 位置：表單最下方，**sticky 固定底部**（`sticky bottom-0 bg-white dark:bg-slate-900 border-t`）
- 按鈕放左側，右側保留操作說明或空白
- 按鈕需含 SVG 圖示 + 中文文字（如「儲存」、「匯出」）
- 儲存按鈕使用模組對應主色（租賃用 Blue、運費用 Amber）

### 刪除確認機制（Modal）
- **禁止使用** `confirm()` 原生彈窗
- 改用 `ConfirmModal` 元件（`components/base/ConfirmModal.vue`）
- 點擊刪除按鈕 → 設定 `deleteTarget = ref(null)` → Modal 顯示 → 使用者按「確認刪除」才執行，按「取消」或點背景關閉
- 實作模式：
  ```js
  const deleteTarget = ref(null)
  function remove(id) { deleteTarget.value = id }
  async function confirmDelete() {
    if (deleteTarget.value) await store.deleteXxx(deleteTarget.value)
    deleteTarget.value = null
  }
  ```
  ```html
  <ConfirmModal :show="!!deleteTarget" message="..." @confirm="confirmDelete" @cancel="deleteTarget = null" />
  ```

### 自動完成下拉（AutocompleteInput）
- 客戶名稱、工地名稱等欄位使用自製 AutocompleteInput 元件
- **選單必須用 `<Teleport to="body">`** 傳送至 body，避免被父層 `overflow: hidden` 裁切
- 選單用 `position: fixed` + `getBoundingClientRect()` 定位
- 鍵盤支援：↑↓ 導覽、Enter 選取、Esc 關閉
- 候選資料來源：後台管理（admin store）的客戶與工地清單，**不自動從歷史記錄累積**，必須透過後台手動維護或「從請款單匯入」功能匯入
- 允許手打不在清單中的值（非強制選取）

### 列表頁 Accordion 卡片
- 卡片展開時使用 `overflow-clip`（非 `overflow-hidden`），允許內部 sticky 元素正常運作
- 卡片收合時使用 `overflow-hidden` 隱藏內容
- 展開後的表格標頭列（含月份統計）使用 `position: sticky; top: 0; z-index: 10` 固定於滾動容器頂部

### 列表底部合計列
- 篩選後的列表下方顯示當前篩選結果的小計、稅額、總計
- 格式：`篩選結果：X 筆 ／ 小計 $X ／ 稅額 $X ／ 合計 $X`
- 使用 computed 自動計算：`filteredSubtotal`、`filteredTax`、`filteredTotal`

### 空狀態
- 列表無資料時顯示引導文字（如「尚無租賃記錄，點擊右上角「新增」開始建立」）
- 不顯示空白區域或報錯

### 成功通知（SweetAlert2）
- **禁止使用** `alert()` 或 `confirm` inline `successMsg` 區塊
- 使用 `useSwal()` composable（`composables/useSwal.js`），自動跟隨深色/亮色主題
- 成功通知：`timer: 500`、`showConfirmButton: false`、`timerProgressBar: true`
- 錯誤通知：`icon: 'error'`，顯示確認按鈕，讓使用者讀完再關閉
- `useSwal` 內部根據 `isDark` 自動設定 `background`、`color`、`iconColor`

### Optimistic UI（樂觀更新）
儲存操作採 Facebook 按讚模式：UI 先更新，API 在背景執行，失敗再回滾。

**Store 層（`stores/rentals.js`）**：
- `createXxx(body)`：先插入帶 `_pending: true` 的 temp 項目（tempId = `_pending_${Date.now()}`），再呼叫 API，成功則用真實資料替換，失敗則移除 temp 並 throw
- `updateXxx(id, body)`：先用 payload 覆蓋本地項目（保留 original 備份），再呼叫 API，失敗則還原 original 並 throw

**Form 頁層**：
1. 驗證通過後，**立刻 `router.push()`** 跳轉列表（不等 API）
2. `await store.createXxx(payload)` — store 已在跳轉前/後同步插入 temp，API 在背景跑
3. 成功 → `swalFire({ icon: 'success' })`；失敗 → `swalFire({ icon: 'error' })`（SweetAlert 可跨頁顯示）

**List 頁層**：
- `_pending: true` 的項目：`opacity-60 pointer-events-none`（灰化、禁止互動）
- 標題區顯示旋轉 spinner + 「上傳中」文字（`animate-spin` + `animate-pulse`）
- API 回應後 `_pending` 消失，卡片恢復正常

```js
// Store 範本
async function createXxx(body) {
  const tempId = `_pending_${Date.now()}`
  list.value.unshift({ ...body, id: tempId, _pending: true })
  try {
    const created = await api.createXxx(body)
    const idx = list.value.findIndex(r => r.id === tempId)
    if (idx !== -1) list.value.splice(idx, 1, created)
    return created
  } catch (e) {
    list.value = list.value.filter(r => r.id !== tempId)
    throw e
  }
}
```

## 匯出規格

- 匯出格式：`.xlsx`
- 匯出結果需與 `sample/` 中的檔案格式一致（欄位、樣式、版面）
- 每次匯出前可預覽金額彙總

## API 設計（後端）

| 方法 | 路徑 | 說明 |
|------|------|------|
**請款單（同步為租賃記錄）**
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/invoices` | 取得所有請款單（供甘特圖使用） |
| POST | `/api/invoices` | 新增請款單（同步建立租賃記錄） |
| PATCH | `/api/invoices/:id` | 更新請款單（如歸還日期、是否結束） |
| DELETE | `/api/invoices/:id` | 刪除請款單 |

**庫存管理**
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/inventory` | 取得各設備庫存總數 + 出租中數量 |
| POST | `/api/inventory/adjust` | 手動調整庫存（購入 / 損耗） |

**匯出**
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/export/子項目` | 產生單一子項目 .xlsx 並下載 |
| POST | `/api/export/請款單` | 產生總請款單 .xlsx 並下載 |

前端傳入 JSON 資料，後端用 ExcelJS 套用格式後回傳 binary stream。

## 開發指令

```bash
# 前端
cd client
npm install
npm run dev       # 預設 http://localhost:5173

# 後端
cd server
npm install
node app.js       # 預設 http://localhost:3000
```
