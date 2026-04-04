<script setup>
defineProps({
  title: String,
  subtitle: String,
  noPadding: Boolean
})
</script>

<template>
  <div class="bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-card transition-all duration-300 backdrop-blur-md relative group">
    <!-- 玻璃擬態高光邊緣 (Glass highlight) -->
    <div class="absolute inset-0 rounded-2xl pointer-events-none border border-white/40 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <!-- Header -->
    <div v-if="title || $slots.header" class="px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/60 flex items-center justify-between relative z-10">
      <div class="flex items-center gap-2.5">
        <slot name="title-icon">
          <span class="w-1 h-4 bg-blue-600 rounded-full"></span>
        </slot>
        <div>
          <h3 v-if="title" class="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ title }}</h3>
          <p v-if="subtitle" class="text-xs font-medium text-slate-500 dark:text-slate-500 tracking-wide mt-0.5">{{ subtitle }}</p>
        </div>
      </div>
      <div>
        <slot name="header-right"></slot>
      </div>
    </div>

    <!-- Body -->
    <div :class="noPadding ? '' : 'p-6'">
      <slot></slot>
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-100/80 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/30">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
