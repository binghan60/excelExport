<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: '確認刪除' },
  message: { type: String, default: '此操作無法復原，確定要刪除嗎？' },
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white dark:bg-zinc-950 rounded-lg shadow-lg w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6">
        <div class="space-y-2 mb-6">
          <h3 class="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{{ title }}</h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ message }}</p>
        </div>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            class="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            @click="$emit('cancel')"
          >
            取消
          </button>
          <button
            class="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium bg-red-500 hover:bg-red-500/90 dark:bg-red-600 dark:hover:bg-red-600/90 text-white transition-colors"
            @click="$emit('confirm')"
          >
            確認刪除
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
