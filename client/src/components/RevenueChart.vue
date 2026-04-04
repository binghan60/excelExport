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
  filters:  { type: Object, default: () => ({ client: '', site: '', equipment: '' }) },
  compact:  { type: Boolean, default: false },
})

const { isDark } = useTheme()

// ── 1. 資料計算 ─────────────────────────────────────────────────────────────
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
    if (props.filters.client && inv.client_name !== props.filters.client) return
    if (props.filters.site && inv.site_name !== props.filters.site) return

    const t = (inv.rows || []).reduce((s, r) => {
      if (props.filters.equipment && r.equipment_name !== props.filters.equipment) return s
      return s + (r.quantity ?? 0) * (r.daily_rate ?? 0) * (r.days ?? 0)
    }, 0)
    if (t > 0) rt[inv.year_month] = (rt[inv.year_month] || 0) + t
  })
  
  props.freights.forEach(inv => {
    if (props.filters.client && inv.client_name !== props.filters.client) return
    if (props.filters.site && inv.site_name !== props.filters.site) return
    if (props.filters.equipment) return 

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

const currentTotal = computed(() => chartData.value.at(-1)?.total ?? 0)
const prevTotal    = computed(() => chartData.value.at(-2)?.total ?? 0)
const growthRate   = computed(() => {
  if (!prevTotal.value) return 0
  return (((currentTotal.value - prevTotal.value) / prevTotal.value) * 100).toFixed(1)
})

// ── 2. 主題色彩 ─────────────────────────────────────────────────────────────
const VIOLET = '#8b5cf6'
const AMBER  = '#f59e0b'
const INDIGO = '#6366f1'

function tickColor() { return isDark.value ? '#64748b' : '#94a3b8' }
const monoFont = "'JetBrains Mono', 'Roboto Mono', monospace"

// ── 3. Custom Tooltip ───────────────────────────────────────────────────────
const canvasRef = ref(null)
let chartInst   = null
let tooltipEl   = null

function externalTooltip({ chart, tooltip }) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = 'position:absolute;pointer-events:none;transition:all .2s ease;z-index:50;'
    chart.canvas.parentNode.appendChild(tooltipEl)
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0'
    return
  }

  if (tooltip.dataPoints?.length) {
    const i = tooltip.dataPoints[0].dataIndex
    const d = chartData.value[i]
    tooltipEl.innerHTML = `
      <div class="bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 min-w-[180px] text-white">
        <div class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">${tooltip.title[0]} 營收明細</div>
        <div class="space-y-2.5">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
              <span class="text-xs text-white/60 font-medium">租賃請款</span>
            </div>
            <span class="text-sm font-bold font-mono-num">${d.rental.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span class="text-xs text-white/60 font-medium">運費請款</span>
            </div>
            <span class="text-sm font-bold font-mono-num">${d.freight.toLocaleString()}</span>
          </div>
          <div class="h-px bg-white/10 my-1"></div>
          <div class="flex justify-between items-center pt-1">
            <span class="text-[10px] font-black text-violet-400 uppercase">合計</span>
            <span class="text-lg font-black text-white font-mono-num">${d.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `
  }

  tooltipEl.style.opacity = '1'
  const left = tooltip.caretX + 20
  const top = tooltip.caretY - 20
  tooltipEl.style.left = left + (left + 200 > chart.width ? -220 : 0) + 'px'
  tooltipEl.style.top = top + 'px'
}

// ── 4. Chart 配置 ────────────────────────────────────────────────────────────
function buildConfig() {
  return {
    type: 'line',
    data: {
      labels: chartData.value.map(d => d.label),
      datasets: [
        {
          label: '租賃',
          data: chartData.value.map(d => d.rental),
          borderColor: VIOLET,
          backgroundColor: 'rgba(139, 92, 246, 0.06)',
          borderDash: [5, 4],
          tension: 0.45,
          borderWidth: 2,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: VIOLET,
          pointHoverBorderWidth: 2,
        },
        {
          label: '運費',
          data: chartData.value.map(d => d.freight),
          borderColor: AMBER,
          backgroundColor: 'rgba(245, 158, 11, 0.06)',
          borderDash: [5, 4],
          tension: 0.45,
          borderWidth: 2,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: AMBER,
          pointHoverBorderWidth: 2,
        },
        {
          label: '總額',
          data: chartData.value.map(d => d.total),
          borderColor: INDIGO,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
            g.addColorStop(0, 'rgba(99, 102, 241, 0.18)')
            g.addColorStop(1, 'rgba(99, 102, 241, 0)')
            return g
          },
          tension: 0.45,
          borderWidth: 2.5,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: INDIGO,
          pointHoverBorderWidth: 2.5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: externalTooltip }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: tickColor(), font: { size: 12, weight: '600' } }
        },
        y: {
          grid: { color: isDark.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false },
          border: { display: false, dash: [4, 4] },
          ticks: { 
            color: tickColor(), 
            font: { family: monoFont, size: 10 },
            callback: v => v >= 1000 ? `${v/1000}k` : v,
            maxTicksLimit: 6
          }
        }
      }
    }
  }
}

onMounted(() => {
  chartInst = new Chart(canvasRef.value, buildConfig())
})

onUnmounted(() => {
  chartInst?.destroy()
  tooltipEl?.remove()
})

watch(chartData, () => {
  if (!chartInst) return
  chartInst.data.datasets[0].data = chartData.value.map(d => d.rental)
  chartInst.data.datasets[1].data = chartData.value.map(d => d.freight)
  chartInst.data.datasets[2].data = chartData.value.map(d => d.total)
  chartInst.update()
}, { deep: true })

watch(isDark, () => {
  if (!chartInst) return
  chartInst.options.scales.x.ticks.color = tickColor()
  chartInst.options.scales.y.ticks.color = tickColor()
  chartInst.options.scales.y.grid.color = isDark.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  chartInst.update()
})
</script>

<template>
  <div class="relative group" :class="compact ? 'h-full flex flex-col' : ''">
    <!-- Header 分析面板（非 compact 模式才顯示） -->
    <div v-if="!compact" class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">月營收概況分析</p>
          <span v-if="growthRate != 0"
            class="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
            :class="growthRate > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'"
          >
            {{ growthRate > 0 ? '▲' : '▼' }} {{ Math.abs(growthRate) }}%
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter font-mono-num">
            {{ currentTotal.toLocaleString() }}
          </h3>
          <span class="text-sm font-bold text-slate-400">元</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div class="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">租賃</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">運費</span>
        </div>
      </div>
    </div>

    <!-- 圖表主體 -->
    <div :class="compact ? 'flex-1 min-h-0 w-full' : 'h-64 w-full'">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.font-mono-num {
  font-family: 'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace;
}
</style>
