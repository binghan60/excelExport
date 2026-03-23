import { ref, watch } from 'vue'

const STORAGE_KEY = 'theme'
const isDark = ref(false)

// 初始化：讀取 localStorage，若無則跟隨系統
function init() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyClass()
}

function applyClass() {
  document.documentElement.classList.toggle('dark', isDark.value)
}

function toggle() {
  isDark.value = !isDark.value
}

watch(isDark, (val) => {
  applyClass()
  localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light')
})

// 只初始化一次（模組層級單例）
init()

export function useTheme() {
  return { isDark, toggle }
}
