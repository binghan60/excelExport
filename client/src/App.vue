<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme.js'

const route = useRoute()
const { isDark, toggle } = useTheme()

const sidebarOpen = ref(false)
const isOnline = ref(navigator.onLine)

function updateOnlineStatus() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

// 切換路由時自動收合手機側邊欄
watch(() => route.path, () => { sidebarOpen.value = false })

const navItems = [
  {
    path: '/dashboard',
    label: '總儀錶板',
    color: 'indigo',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`
  },
  {
    path: '/rentals',
    label: '租賃請款',
    color: 'blue',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`
  },
  {
    path: '/freights',
    label: '運費請款',
    color: 'amber',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3m15 0h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`
  },
  {
    path: '/admin',
    label: '後台管理',
    color: 'emerald',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
  },
  {
    path: '/summary',
    label: '報表匯出',
    color: 'violet',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
  },
]

const activeItem = computed(() => navItems.find(item => route.path.startsWith(item.path)) || navItems[0])

</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans text-zinc-950 dark:text-zinc-50">

    <!-- ── 手機遮罩 ── -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/80 z-30 md:hidden"
        @click="sidebarOpen = false"
      ></div>
    </Transition>

    <!-- ── 側邊導覽列 ── -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col
             border-r border-zinc-200 dark:border-zinc-800
             transition-transform duration-200 ease-out
             md:static md:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo 區 -->
      <div class="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-md flex items-center justify-center bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-sm font-semibold shrink-0">
            友
          </div>
          <div class="leading-tight">
            <h1 class="font-semibold tracking-tight text-sm">友仁起重行</h1>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">帳務管理系統</p>
          </div>
        </div>
        <!-- 手機關閉按鈕 -->
        <button
          class="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- 導覽選單 -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 h-10 rounded-md font-medium transition-colors text-sm select-none"
          :class="route.path.startsWith(item.path)
            ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50'"
        >
          <span v-html="item.icon" class="shrink-0 [&>svg]:w-4 [&>svg]:h-4"></span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

    </aside>

    <!-- ── 右側內容區 ── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- 頂部導覽 -->
      <header class="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0">
        <div class="flex items-center gap-3">
          <!-- 漢堡選單（手機） -->
          <button
            class="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            @click="sidebarOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
          <h2 class="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {{ activeItem.label }}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <!-- 連線狀態 -->
          <div class="hidden sm:flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full" :class="isOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
            <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ isOnline ? '連線正常' : '連線中斷' }}</span>
          </div>
          <!-- 明暗切換 -->
          <button
            @click="toggle"
            class="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            :title="isDark ? '切換為亮色模式' : '切換為暗色模式'"
          >
            <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-white dark:bg-zinc-950">
        <div class="max-w-350 mx-auto h-full">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
