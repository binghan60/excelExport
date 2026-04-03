<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options:    { type: Array,  default: () => [] },
  placeholder:{ type: String, default: '' },
  variant:    { type: String, default: 'blue' },
  dense:      { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const highlighted = ref(-1)
const inputRef = ref(null)
const dropdownStyle = ref({})

const filtered = computed(() => {
  if (!props.modelValue) return props.options
  const q = props.modelValue.toLowerCase()
  return props.options.filter(o => o.toLowerCase().includes(q))
})

function updatePosition() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top:   `${rect.bottom + 4}px`,
    left:  `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  isOpen.value = true
  highlighted.value = -1
  nextTick(updatePosition)
}

function onFocus() {
  isOpen.value = true
  highlighted.value = -1
  nextTick(updatePosition)
}

function select(name) {
  emit('update:modelValue', name)
  isOpen.value = false
}

function onBlur() {
  setTimeout(() => { isOpen.value = false }, 150)
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) { isOpen.value = true; updatePosition(); return }
    highlighted.value = Math.min(highlighted.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlighted.value = Math.max(highlighted.value - 1, -1)
  } else if (e.key === 'Enter' && highlighted.value >= 0) {
    e.preventDefault()
    select(filtered.value[highlighted.value])
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

const focusBorder = computed(() => ({
  blue:  'focus:border-blue-500',
  amber: 'focus:border-amber-500',
  indigo:'focus:border-indigo-500',
}[props.variant] ?? 'focus:border-blue-500'))

const hoverCls = computed(() => ({
  blue:  'hover:bg-blue-50  dark:hover:bg-blue-950/40  hover:text-blue-700  dark:hover:text-blue-300',
  amber: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300',
  indigo:'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300',
}[props.variant] ?? 'hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300'))

const activeCls = computed(() => ({
  blue:  'bg-blue-50  dark:bg-blue-950/40  text-blue-700  dark:text-blue-300',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  indigo:'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
}[props.variant] ?? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'))
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      :value="modelValue"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
      :placeholder="placeholder"
      autocomplete="off"
      class="w-full px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-200 transition-all"
      :class="[focusBorder, dense ? 'h-9' : 'h-10']"
    />

    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="isOpen && filtered.length > 0"
          :style="dropdownStyle"
          class="z-9999 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] overflow-hidden"
        >
          <ul class="max-h-52 overflow-y-auto py-1">
            <li
              v-for="(opt, i) in filtered"
              :key="opt"
              @mousedown.prevent="select(opt)"
              class="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer transition-colors duration-100"
              :class="[hoverCls, i === highlighted ? activeCls : '']"
            >
              {{ opt }}
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
