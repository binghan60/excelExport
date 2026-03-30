<script setup>
defineProps({
  modelValue:  { default: '' },
  placeholder: { type: String, default: '' },
  variant:     { type: String, default: 'blue' },  // blue | amber
  ghost:       { type: Boolean, default: false },  // 表格行內輕量樣式
  dense:       { type: Boolean, default: false },  // 36px 緊湊樣式
  type:        { type: String, default: 'text' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    class="ai-base"
    :class="[
      ghost ? 'ai-ghost' : 'ai-full',
      `ai--${variant}`,
      { 'ai--dense': dense }
    ]"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.ai-base {
  width: 100%; outline: none;
  font-size: 14px; font-weight: 500;
  transition: border-color 0.15s;
}

/* ── 完整框框樣式（基本資料區用） ── */
.ai-full {
  height: 40px; padding: 0 12px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #f8fafc; color: #1e293b;
  box-sizing: border-box;
}
.ai--dense { height: 36px; padding: 0 10px; }
.ai--blue::placeholder  { color: #94a3b8; }
.ai--amber::placeholder { color: #94a3b8; }

.ai--blue:focus {
  background: #eff6ff; border-color: #3b82f6; color: #1e40af;
}
.ai--blue:focus::placeholder { color: #93c5fd; }

.ai--amber:focus {
  background: #fffbeb; border-color: #f59e0b; color: #92400e;
}
.ai--amber:focus::placeholder { color: #fcd34d; }

/* ── 行內 ghost 樣式（表格備註欄用） ── */
.ai-ghost {
  height: 36px; padding: 0 8px;
  background: transparent;
  border: none; border-bottom: 1px solid transparent;
  border-radius: 0; color: #94a3b8;
}
.ai-ghost::placeholder { color: #cbd5e1; }
.ai-ghost:hover  { border-bottom-color: #e2e8f0; }
.ai-ghost:focus  { border-bottom-color: #3b82f6; color: #374151; }

/* ── 深色 ── */
:global(.dark .ai-full) {
  background: #1e293b; border-color: #334155; color: #f1f5f9;
}
:global(.dark .ai--blue::placeholder),
:global(.dark .ai--amber::placeholder) { color: #475569; }

:global(.dark .ai--blue:focus)  { background: #172554; border-color: #3b82f6; color: #93c5fd; }
:global(.dark .ai--amber:focus) { background: #1c1208; border-color: #f59e0b; color: #fbbf24; }
:global(.dark .ai--blue:focus::placeholder)  { color: #1d4ed8; }
:global(.dark .ai--amber:focus::placeholder) { color: #78350f; }

:global(.dark .ai-ghost) { color: #64748b; }
:global(.dark .ai-ghost::placeholder) { color: #475569; }
:global(.dark .ai-ghost:hover)  { border-bottom-color: #334155; }
:global(.dark .ai-ghost:focus)  { border-bottom-color: #3b82f6; color: #cbd5e1; }
</style>
