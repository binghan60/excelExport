<script setup>
defineProps({
  title: String,
  subtitle: String,
  noPadding: Boolean
})
</script>

<template>
  <div class="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm" :class="noPadding ? 'overflow-hidden' : ''">
    <!-- Header -->
    <div v-if="title || $slots.header" class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <slot name="title-icon"></slot>
        <div>
          <h3 v-if="title" class="text-base font-semibold tracking-tight leading-none">{{ title }}</h3>
          <p v-if="subtitle" class="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">{{ subtitle }}</p>
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
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
