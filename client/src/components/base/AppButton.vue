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
    class="items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none select-none shadow-sm"
    :class="[
      block ? 'w-full flex' : 'inline-flex',

      // Rounded mapping（shadcn 以 rounded-md 為主）
      rounded === 'lg' ? 'rounded-md' : '',
      rounded === 'xl' ? 'rounded-md' : '',
      rounded === '2xl' ? 'rounded-lg' : '',
      rounded === 'full' ? 'rounded-full' : '',

      // Size mapping
      size === 'sm'    ? 'h-8  px-3 text-xs' : '',
      size === 'dense' ? 'h-9  px-4 text-sm' : '',
      size === 'md'    ? 'h-10 px-4 text-sm' : '',
      size === 'lg'    ? 'h-11 px-6 text-sm' : '',
      size === 'xl'    ? 'h-12 px-8 text-base' : '',

      // 主要：shadcn default（黑底白字，深色反相）
      variant === 'primary'
        ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90' : '',
      // 次要：shadcn outline
      variant === 'secondary'
        ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800' : '',
      // 模組色：保留色彩辨識，但扁平化
      variant === 'amber'
        ? 'bg-amber-500 text-white hover:bg-amber-500/90' : '',
      variant === 'emerald'
        ? 'bg-emerald-600 text-white hover:bg-emerald-600/90' : '',
      variant === 'violet'
        ? 'bg-violet-600 text-white hover:bg-violet-600/90' : '',
      variant === 'red'
        ? 'bg-red-500 text-white hover:bg-red-500/90 dark:bg-red-600 dark:hover:bg-red-600/90' : '',
      // 幽靈
      variant === 'ghost'
        ? 'bg-transparent shadow-none text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800' : '',

      // soft：shadcn secondary / badge 風格（淡色底 + 細邊）
      variant === 'soft-blue'
        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-blue-900/50 shadow-none' : '',
      variant === 'soft-amber'
        ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 dark:hover:bg-amber-900/50 shadow-none' : '',
      variant === 'soft-emerald'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 dark:hover:bg-emerald-900/50 shadow-none' : '',
      variant === 'soft-indigo'
        ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700 shadow-none' : '',
      variant === 'soft-violet'
        ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60 dark:hover:bg-violet-900/50 shadow-none' : '',
      variant === 'soft-red'
        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 dark:hover:bg-red-900/50 shadow-none' : '',
    ]"
  >
    <slot name="icon"></slot>
    <slot v-if="!loading"></slot>
    <span v-else class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
  </button>
</template>
