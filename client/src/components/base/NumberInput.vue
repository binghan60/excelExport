<script setup>
const props = defineProps({
  modelValue: { default: '' },
  step:        { type: Number, default: 1 },
  min:         { type: Number, default: null },
  placeholder: { type: String, default: '0' },
  variant:     { type: String, default: 'blue' },   // blue | amber
  align:       { type: String, default: 'center' },  // center | right
})
const emit = defineEmits(['update:modelValue'])

function add(delta) {
  const v = parseFloat(props.modelValue) || 0
  const next = Math.round((v + delta) * 1e8) / 1e8   // 避免浮點誤差
  if (props.min !== null && next < props.min) return
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="ni-wrap" :class="`ni--${variant}`">
    <button type="button" class="ni-btn ni-btn--minus" @click="add(-step)">−</button>
    <input
      class="ni-input"
      :class="`ni-input--${align}`"
      :value="modelValue"
      :placeholder="placeholder"
      inputmode="decimal"
      @input="emit('update:modelValue', $event.target.value === '' ? '' : Number($event.target.value))"
    />
    <button type="button" class="ni-btn ni-btn--plus" @click="add(step)">+</button>
  </div>
</template>

<style scoped>
.ni-wrap {
  display: flex; align-items: stretch;
  height: 36px; border-radius: 8px; overflow: hidden;
  border: 1px solid #e2e8f0; background: #f8fafc;
  transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
}
.ni--blue:focus-within  { border-color: #3b82f6; background: #eff6ff; }
.ni--amber:focus-within { border-color: #f59e0b; background: #fffbeb; }

.ni-btn {
  width: 28px; flex-shrink: 0;
  border: none; background: transparent;
  font-size: 14px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, color 0.1s;
  user-select: none;
  color: #94a3b8;
}
.ni--blue:focus-within  .ni-btn { color: #3b82f6; }
.ni--amber:focus-within .ni-btn { color: #d97706; }

.ni--blue  .ni-btn--minus:hover { background: #fee2e2; color: #ef4444; }
.ni--blue  .ni-btn--plus:hover  { background: #dcfce7; color: #22c55e; }
.ni--amber .ni-btn--minus:hover { background: #fee2e2; color: #ef4444; }
.ni--amber .ni-btn--plus:hover  { background: #dcfce7; color: #22c55e; }

.ni-btn--minus { border-right: 1px solid #e2e8f0; }
.ni-btn--plus  { border-left:  1px solid #e2e8f0; }

.ni--blue:focus-within .ni-btn--minus,
.ni--blue:focus-within .ni-btn--plus  { border-color: #bfdbfe; }
.ni--amber:focus-within .ni-btn--minus,
.ni--amber:focus-within .ni-btn--plus  { border-color: #fde68a; }

.ni-input {
  flex: 1; min-width: 0; border: none; background: transparent;
  outline: none; font-size: 14px; font-weight: 600; padding: 0 1px;
  color: #334155;
  /* 隱藏原生 spinner */
  -moz-appearance: textfield;
}
.ni-input::-webkit-outer-spin-button,
.ni-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ni-input--center { text-align: center; }
.ni-input--right  { text-align: right; }

.ni--blue:focus-within  .ni-input { color: #2563eb; }
.ni--amber:focus-within .ni-input { color: #b45309; }

/* ── 深色 ── */
:global(.dark .ni-wrap) {
  background: #1e293b; border-color: #334155;
}
:global(.dark .ni--blue:focus-within)  { background: #172554; border-color: #3b82f6; }
:global(.dark .ni--amber:focus-within) { background: #1c1208; border-color: #f59e0b; }

:global(.dark .ni-btn) { color: #475569; }
:global(.dark .ni--blue:focus-within  .ni-btn) { color: #60a5fa; }
:global(.dark .ni--amber:focus-within .ni-btn) { color: #fbbf24; }

:global(.dark .ni-btn--minus),
:global(.dark .ni-btn--plus) { border-color: #334155; }
:global(.dark .ni--blue:focus-within .ni-btn--minus),
:global(.dark .ni--blue:focus-within .ni-btn--plus)  { border-color: #1d4ed8; }
:global(.dark .ni--amber:focus-within .ni-btn--minus),
:global(.dark .ni--amber:focus-within .ni-btn--plus)  { border-color: #78350f; }

:global(.dark .ni--blue  .ni-btn--minus:hover) { background: #450a0a; color: #f87171; }
:global(.dark .ni--blue  .ni-btn--plus:hover)  { background: #052e16; color: #4ade80; }
:global(.dark .ni--amber .ni-btn--minus:hover) { background: #450a0a; color: #f87171; }
:global(.dark .ni--amber .ni-btn--plus:hover)  { background: #052e16; color: #4ade80; }

:global(.dark .ni-input) { color: #cbd5e1; }
:global(.dark .ni--blue:focus-within  .ni-input) { color: #93c5fd; }
:global(.dark .ni--amber:focus-within .ni-input) { color: #fbbf24; }
</style>
