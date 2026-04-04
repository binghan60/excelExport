<script setup>
defineProps({
  show: Boolean,
  x: Number,
  y: Number,
  content: {
    type: Object,
    default: () => ({})
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="show"
        class="fixed z-[9999] pointer-events-none select-none"
        :style="{ left: `${x + 20}px`, top: `${y + 20}px` }"
      >
        <!-- 主體容器：恢復平衡大小 -->
        <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-5 min-w-[260px] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-300">
          
          <!-- 裝飾背景光暈 -->
          <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 dark:opacity-20 transition-opacity" :style="{ backgroundColor: content.color || '#6366f1' }"></div>
          
          <div class="relative z-10 space-y-4">
            <!-- 頂部資訊：標籤與分隔線 -->
            <div class="space-y-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60">租賃明細</span>
                <div class="h-px flex-1 bg-slate-100 dark:bg-white/10"></div>
              </div>
              <h4 class="text-base font-black tracking-tight leading-tight">{{ content.clientName }}</h4>
              <p class="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ content.siteName || '未指定工地' }}
              </p>
            </div>

            <!-- 中間資訊：設備與數量 -->
            <div class="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-2 h-2 rounded-full shadow-sm" :style="{ background: content.color }"></div>
                  <span class="text-sm font-bold">{{ content.equipmentName }}</span>
                </div>
                <div class="text-right">
                  <span class="text-lg font-black font-mono-num text-indigo-600 dark:text-indigo-400">{{ content.quantity }}</span>
                  <span class="text-[10px] ml-1 text-slate-400 dark:text-white/40 font-bold">{{ content.unit }}</span>
                </div>
              </div>
            </div>

            <!-- 底部資訊：日期範圍 -->
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">起始日期</p>
                  <p class="text-xs font-bold font-mono-num tracking-tight">{{ content.fullStartDate }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">結束日期</p>
                  <p class="text-xs font-bold font-mono-num tracking-tight">{{ content.fullEndDate }}</p>
                </div>
              </div>
              
              <div class="pt-1">
                <div class="bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 rounded-lg py-1.5 px-3 flex items-center justify-between">
                  <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 uppercase">總計時程</span>
                  <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono-num">{{ content.actualDuration }} <span class="text-[9px] font-bold opacity-70">天</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.font-mono-num {
  font-family: 'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace;
}
</style>
