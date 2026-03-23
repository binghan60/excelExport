<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import {
  Chart,
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale,
  Filler, Tooltip,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const props = defineProps({
  rentals:  { type: Array, default: () => [] },
  freights: { type: Array, default: () => [] },
})

const { isDark } = useTheme()

// ── 1. 資料計算：近 6 個月 ──────────────────────────────────────────────────
function getLast6Months() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}月`,
    }
  })
}

const chartData = computed(() => {
  const months = getLast6Months()
  const rt = {}, ft = {}

  props.rentals.forEach(inv => {
    const t = (inv.rows || []).reduce(
      (s, r) => s + (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0), 0)
    rt[inv.year_month] = (rt[inv.year_month] || 0) + t
  })
  props.freights.forEach(inv => {
    const t = (inv.rows || []).reduce((s, r) => s + (r.amount ?? 0), 0)
    ft[inv.year_month] = (ft[inv.year_month] || 0) + t
  })

  return months.map(m => ({
    label: m.label,
    rental:  Math.round(rt[m.ym] || 0),
    freight: Math.round(ft[m.ym] || 0),
    total:   Math.round((rt[m.ym] || 0) + (ft[m.ym] || 0)),
  }))
})

// 本月合計 & 環比
const currentTotal = computed(() => chartData.value.at(-1)?.total ?? 0)
const prevTotal    = computed(() => chartData.value.at(-2)?.total ?? 0)
const growthRate   = computed(() => {
  if (!prevTotal.value) return null
  return (((currentTotal.value - prevTotal.value) / prevTotal.value) * 100).toFixed(1)
})

// ── 2. 主題色彩輔助 ──────────────────────────────────────────────────────────
const INDIGO    = '#4f46e5'
const INDIGO_LT = '#818cf8'

function gridColor()  { return isDark.value ? 'rgba(148,163,184,0.07)' : 'rgba(148,163,184,0.10)' }
function tickColor()  { return isDark.value ? '#475569' : '#64748b' }
const monoFont = "'Inter', 'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif"

// ── 3. Plugin：漸層填色 ──────────────────────────────────────────────────────
const gradientPlugin = {
  id: 'indigoGradient',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const { top, bottom } = chartArea

    const g1 = ctx.createLinearGradient(0, top, 0, bottom)
    g1.addColorStop(0, 'rgba(79,70,229,0.18)')
    g1.addColorStop(0.6, 'rgba(79,70,229,0.06)')
    g1.addColorStop(1, 'rgba(79,70,229,0.00)')
    chart.data.datasets[0].backgroundColor = g1

    const g2 = ctx.createLinearGradient(0, top, 0, bottom)
    g2.addColorStop(0, 'rgba(129,140,248,0.12)')
    g2.addColorStop(0.6, 'rgba(129,140,248,0.04)')
    g2.addColorStop(1, 'rgba(129,140,248,0.00)')
    chart.data.datasets[1].backgroundColor = g2
  },
}

// ── 4. Plugin：虛線水平網格 ──────────────────────────────────────────────────
const dashedGridPlugin = {
  id: 'dashedYGrid',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart
    if (!chartArea || !scales.y) return
    const { left, right } = chartArea

    ctx.save()
    ctx.strokeStyle = gridColor()
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.lineDashOffset = 0

    scales.y.ticks.forEach((_, i) => {
      const y = scales.y.getPixelForTick(i)
      ctx.beginPath()
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
      ctx.stroke()
    })

    ctx.restore()
  },
}

// ── 5. Custom Tooltip ────────────────────────────────────────────────────────
const canvasRef = ref(null)
let chartInst   = null
let tooltipEl   = null

function getTooltipEl(chart) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'transition:opacity .15s ease, transform .15s ease',
      'z-index:50',
    ].join(';')
    chart.canvas.parentNode.style.position = 'relative'
    chart.canvas.parentNode.appendChild(tooltipEl)
  }
  return tooltipEl
}

function externalTooltip({ chart, tooltip }) {
  const el = getTooltipEl(chart)

  if (tooltip.opacity === 0) {
    el.style.opacity = '0'
    el.style.transform = 'translateY(4px) scale(0.98)'
    return
  }

  if (tooltip.dataPoints?.length) {
    const i   = tooltip.dataPoints[0].dataIndex
    const d   = chartData.value[i]
    const dark = isDark.value

    const bg     = dark ? 'rgba(15,23,42,0.93)'  : 'rgba(255,255,255,0.93)'
    const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
    const valC   = dark ? '#e2e8f0' : '#1e293b'
    const subC   = '#64748b'
    const divC   = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

    el.innerHTML = `
      <div style="
        background:${bg};
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        border-radius:12px;
        box-shadow:0 20px 48px rgba(0,0,0,.14),0 4px 16px rgba(0,0,0,.08),0 0 0 1px ${border};
        padding:12px 16px;
        min-width:158px;
        font-family:${monoFont};
      ">
        <div style="font-size:10.5px;font-weight:600;color:${subC};
          letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;">
          ${tooltip.title?.[0] ?? ''}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:6px;height:6px;border-radius:50%;
              background:${INDIGO};flex-shrink:0;display:inline-block;"></span>
            <span style="font-size:12px;color:${subC};">租賃</span>
          </div>
          <span style="font-size:13px;font-weight:600;color:${valC};
            font-variant-numeric:tabular-nums;">${d.rental.toLocaleString()}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:6px;height:6px;border-radius:50%;
              background:${INDIGO_LT};flex-shrink:0;display:inline-block;"></span>
            <span style="font-size:12px;color:${subC};">運費</span>
          </div>
          <span style="font-size:13px;font-weight:600;color:${valC};
            font-variant-numeric:tabular-nums;">${d.freight.toLocaleString()}</span>
        </div>

        <div style="border-top:1px solid ${divC};padding-top:8px;
          display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:10.5px;font-weight:700;color:${subC};
            text-transform:uppercase;letter-spacing:.06em;">合計</span>
          <span style="font-size:15px;font-weight:700;color:${INDIGO};
            font-variant-numeric:tabular-nums;">${d.total.toLocaleString()}</span>
        </div>
      </div>
    `
  }

  el.style.opacity = '1'
  el.style.transform = 'translateY(0) scale(1)'

  // 防止 tooltip 超出右側
  const caret = tooltip.caretX
  const elW   = tooltipEl?.offsetWidth || 170
  const cW    = chart.width
  const left  = caret + 16 + elW > cW ? caret - elW - 10 : caret + 16
  el.style.left = `${left}px`
  el.style.top  = `${Math.max(0, tooltip.caretY - 28)}px`
}

// ── 6. Chart 建構與生命週期 ───────────────────────────────────────────────────
const dsBase = {
  tension: 0.4,
  pointRadius: 0,
  pointHoverRadius: 5,
  pointHoverBackgroundColor: '#ffffff',
  pointHoverBorderWidth: 2.5,
  borderWidth: 2,
  fill: true,
}

function buildConfig() {
  return {
    type: 'line',
    data: {
      labels: chartData.value.map(d => d.label),
      datasets: [
        {
          label: '租賃請款',
          data: chartData.value.map(d => d.rental),
          borderColor: INDIGO,
          pointHoverBorderColor: INDIGO,
          ...dsBase,
        },
        {
          label: '運費請款',
          data: chartData.value.map(d => d.freight),
          borderColor: INDIGO_LT,
          pointHoverBorderColor: INDIGO_LT,
          ...dsBase,
          borderWidth: 1.5,
          borderDash: [4, 3],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: externalTooltip },
      },
      scales: {
        x: {
          grid:   { display: false },
          border: { display: false },
          ticks:  {
            color: tickColor(),
            font: { family: monoFont, size: 12, weight: '500' },
            maxRotation: 0,
          },
        },
        y: {
          grid:   { display: false },   // 由 dashedGridPlugin 接管
          border: { display: false },
          ticks:  {
            color: tickColor(),
            font: { family: monoFont, size: 11 },
            maxTicksLimit: 5,
            callback: v => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v,
          },
        },
      },
    },
    plugins: [gradientPlugin, dashedGridPlugin],
  }
}

function syncTheme() {
  if (!chartInst) return
  chartInst.options.scales.x.ticks.color = tickColor()
  chartInst.options.scales.y.ticks.color = tickColor()
  chartInst.update('none')
}

onMounted(() => {
  if (!canvasRef.value) return
  chartInst = new Chart(canvasRef.value, buildConfig())
})

onUnmounted(() => {
  tooltipEl?.remove()
  tooltipEl = null
  chartInst?.destroy()
  chartInst = null
})

watch(chartData, () => {
  if (!chartInst) return
  chartInst.data.labels            = chartData.value.map(d => d.label)
  chartInst.data.datasets[0].data  = chartData.value.map(d => d.rental)
  chartInst.data.datasets[1].data  = chartData.value.map(d => d.freight)
  chartInst.update()
}, { deep: true })

watch(isDark, syncTheme)
</script>

<template>
  <div>
    <!-- KPI 指標列 -->
    <div class="flex items-end justify-between mb-5">
      <div>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">本月請款總額</p>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            style="font-variant-numeric: tabular-nums;">
            {{ currentTotal.toLocaleString() }}
          </span>
          <span class="text-sm text-slate-400 dark:text-slate-500 font-medium">元</span>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2.5">
        <!-- 環比標籤 -->
        <div v-if="growthRate !== null"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          :class="Number(growthRate) >= 0
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900'
            : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900'"
        >
          <svg v-if="Number(growthRate) >= 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
          </svg>
          {{ Math.abs(Number(growthRate)) }}% 較上月
        </div>

        <!-- 圖例 -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <span class="w-5 h-0.5 rounded-full bg-indigo-500 inline-block"></span>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">租賃</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-5 h-px rounded-full bg-indigo-300 inline-block" style="border-top: 1px dashed #818cf8;"></span>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">運費</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖表畫布 -->
    <div class="relative h-52">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>
