<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // primary, secondary, amber, emerald, red, ghost
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg
  },
  disabled: Boolean,
  loading: Boolean
})
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none"
    :class="[
      size === 'sm' ? 'h-8  px-3 text-xs' : '',
      size === 'md' ? 'h-10 px-5 text-sm' : '',
      size === 'lg' ? 'h-11 px-7 text-sm' : '',

      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-[0_1px_4px_0_rgba(37,99,235,0.25)] hover:shadow-[0_2px_10px_0_rgba(37,99,235,0.35)]' : '',
      variant === 'secondary'
        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/80 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)]' : '',
      variant === 'amber'
        ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-[0_1px_4px_0_rgba(217,119,6,0.25)] hover:shadow-[0_2px_10px_0_rgba(217,119,6,0.35)]' : '',
      variant === 'emerald'
        ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-[0_1px_4px_0_rgba(5,150,105,0.25)] hover:shadow-[0_2px_10px_0_rgba(5,150,105,0.35)]' : '',
      variant === 'red'
        ? 'bg-red-500 text-white hover:bg-red-400 shadow-[0_1px_4px_0_rgba(239,68,68,0.25)] hover:shadow-[0_2px_10px_0_rgba(239,68,68,0.35)]' : '',
      variant === 'ghost'
        ? 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 bg-transparent' : '',
    ]"
  >
    <slot name="icon"></slot>
    <slot v-if="!loading"></slot>
    <span v-else class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
  </button>
</template>
