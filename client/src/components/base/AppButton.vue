<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // primary, secondary, amber, emerald, red, ghost, violet, soft-*
  },
  size: {
    type: String,
    default: 'md' // sm, dense, md, lg, xl
  },
  block: Boolean,
  disabled: Boolean,
  loading: Boolean,
  rounded: {
    type: String,
    default: 'xl' // lg, xl, 2xl, full
  }
})
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="items-center justify-center gap-2 font-semibold transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none"
    :class="[
      block ? 'w-full flex' : 'inline-flex',
      
      // Rounded mapping
      rounded === 'lg' ? 'rounded-lg' : '',
      rounded === 'xl' ? 'rounded-xl' : '',
      rounded === '2xl' ? 'rounded-2xl' : '',
      rounded === 'full' ? 'rounded-full' : '',

      // Size mapping
      size === 'sm'    ? 'h-8  px-3 text-xs' : '',
      size === 'dense' ? 'h-9  px-4 text-sm' : '',
      size === 'md'    ? 'h-10 px-5 text-sm' : '',
      size === 'lg'    ? 'h-11 px-6 text-sm' : '',
      size === 'xl'    ? 'h-12 px-8 text-base' : '',

      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-[0_1px_4px_0_rgba(37,99,235,0.25)] hover:shadow-[0_2px_10px_0_rgba(37,99,235,0.35)]' : '',
      variant === 'secondary'
        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/80 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.03)]' : '',
      variant === 'amber'
        ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-[0_1px_4px_0_rgba(217,119,6,0.25)] hover:shadow-[0_2px_10px_0_rgba(217,119,6,0.35)]' : '',
      variant === 'emerald'
        ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-[0_1px_4px_0_rgba(5,150,105,0.25)] hover:shadow-[0_2px_10px_0_rgba(5,150,105,0.35)]' : '',
      variant === 'violet'
        ? 'bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400 shadow-[0_1px_4px_0_rgba(124,58,237,0.25)] hover:shadow-[0_2px_10px_0_rgba(124,58,237,0.35)]' : '',
      variant === 'red'
        ? 'bg-red-500 text-white hover:bg-red-400 shadow-[0_1px_4px_0_rgba(239,68,68,0.25)] hover:shadow-[0_2px_10px_0_rgba(239,68,68,0.35)]' : '',
      variant === 'ghost'
        ? 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 bg-transparent' : '',
      
      variant === 'soft-blue'
        ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/60' : '',
      variant === 'soft-amber'
        ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-900/60' : '',
      variant === 'soft-emerald'
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/60' : '',
      variant === 'soft-indigo'
        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/60' : '',
      variant === 'soft-violet'
        ? 'bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/50 dark:hover:bg-violet-900/60' : '',
      variant === 'soft-red'
        ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/60' : '',
    ]"
  >
    <slot name="icon"></slot>
    <slot v-if="!loading"></slot>
    <span v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
  </button>
</template>
