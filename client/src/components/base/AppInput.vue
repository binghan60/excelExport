<script setup>
defineProps({
  modelValue:  { default: '' },
  placeholder: { type: String, default: '' },
  variant:     { type: String, default: 'blue' },  // 保留相容，外觀統一為 shadcn 中性風格
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
      { 'ai--dense': dense }
    ]"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.ai-base {
  width: 100%; outline: none;
  font-size: 14px; font-weight: 400;
  transition: border-color 0.15s, box-shadow 0.15s;
}

/* ── shadcn Input ── */
.ai-full {
  height: 40px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: 6px;
  background: transparent; color: var(--foreground);
  box-sizing: border-box;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
}
.ai--dense { height: 36px; padding: 0 10px; }
.ai-full::placeholder { color: var(--muted-foreground); }
.ai-full:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 35%, transparent);
}

/* ── 行內 ghost 樣式（表格備註欄用） ── */
.ai-ghost {
  height: 36px; padding: 0 8px;
  background: transparent;
  border: none; border-bottom: 1px solid transparent;
  border-radius: 0; color: var(--foreground);
}
.ai-ghost::placeholder { color: var(--muted-foreground); opacity: 0.6; }
.ai-ghost:hover  { border-bottom-color: var(--border); }
.ai-ghost:focus  { border-bottom-color: var(--ring); }
</style>
