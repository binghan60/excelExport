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
    label: '數據總覽',
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

const activeClasses = {
  indigo:  'bg-indigo-600 text-white shadow-[0_2px_8px_0_rgba(79,70,229,0.35)]',
  blue:    'bg-blue-600 text-white shadow-[0_2px_8px_0_rgba(37,99,235,0.35)]',
  amber:   'bg-amber-500 text-white shadow-[0_2px_8px_0_rgba(217,119,6,0.35)]',
  emerald: 'bg-emerald-600 text-white shadow-[0_2px_8px_0_rgba(5,150,105,0.35)]',
  violet:  'bg-violet-600 text-white shadow-[0_2px_8px_0_rgba(124,58,237,0.35)]'
}

const logoColorClasses = {
  indigo:  'bg-indigo-600 shadow-[0_2px_8px_0_rgba(79,70,229,0.35)]',
  blue:    'bg-blue-600 shadow-[0_2px_8px_0_rgba(37,99,235,0.35)]',
  amber:   'bg-amber-500 shadow-[0_2px_8px_0_rgba(217,119,6,0.35)]',
  emerald: 'bg-emerald-600 shadow-[0_2px_8px_0_rgba(5,150,105,0.35)]',
  violet:  'bg-violet-600 shadow-[0_2px_8px_0_rgba(124,58,237,0.35)]'
}

const logoTextClasses = {
  indigo:  'text-indigo-500 dark:text-indigo-400',
  blue:    'text-blue-500 dark:text-blue-400',
  amber:   'text-amber-500 dark:text-amber-400',
  emerald: 'text-emerald-500 dark:text-emerald-400',
  violet:  'text-violet-500 dark:text-violet-400'
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">

    <!-- ── 手機遮罩 ── -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
        @click="sidebarOpen = false"
      ></div>
    </Transition>

    <!-- ── 固定側邊導覽列 ── -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white dark:bg-slate-950 flex flex-col
             border-r border-slate-200/60 dark:border-slate-800/60 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]
             transition-transform duration-300 ease-out
             md:static md:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo 區 -->
      <div class="px-5 py-5 border-b border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 transition-all duration-500"
            :class="logoColorClasses[activeItem.color]">
            友
          </div>
          <div>
            <h1 class="text-slate-900 dark:text-white font-semibold tracking-tight text-sm leading-tight">友仁起重行</h1>
            <p class="text-xs font-medium tracking-wider mt-0.5 transition-colors duration-500"
              :class="logoTextClasses[activeItem.color]">帳務管理系統</p>
          </div>
        </div>
        <!-- 手機關閉按鈕 -->
        <button
          class="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 active:scale-[0.95]"
          @click="sidebarOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- 導覽選單 -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 ease-out group text-sm active:scale-[0.98] select-none"
          :class="route.path.startsWith(item.path)
            ? activeClasses[item.color]
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-100'"
        >
          <span v-html="item.icon" class="shrink-0 transition-transform duration-300 group-hover:scale-110"></span>
          <span class="tracking-tight">{{ item.label }}</span>
        </RouterLink>
      </nav>

    </aside>

    <!-- ── 右側內容區 ── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- 毛玻璃頂部導覽 -->
      <header class="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between px-4 md:px-8 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_1px_rgba(0,0,0,0.02)] sticky top-0">
        <div class="flex items-center gap-3">
          <!-- 漢堡選單（手機） -->
          <button
            class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
            @click="sidebarOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
          <div class="w-1 h-4 bg-blue-600 rounded-full hidden md:block"></div>
          <h2 class="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
            {{ navItems.find(i => route.path.startsWith(i.path))?.label ?? '系統首頁' }}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <!-- 連線狀態 -->
          <div class="hidden sm:flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="isOnline ? 'bg-emerald-500' : 'bg-rose-500'"></span>
            <span class="text-xs font-medium text-slate-400 dark:text-slate-500">{{ isOnline ? '連線正常' : '連線中斷' }}</span>
          </div>
          <div class="hidden sm:block h-4 w-px bg-slate-200/80 dark:bg-slate-700/80 mx-1"></div>
          <!-- 明暗切換 -->
          <button
            @click="toggle"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ease-out active:scale-[0.95]"
            :title="isDark ? '切換為亮色模式' : '切換為暗色模式'"
          >
            <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
        <div class="max-w-350 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
