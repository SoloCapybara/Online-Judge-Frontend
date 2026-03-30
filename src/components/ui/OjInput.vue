<script setup lang="ts">
import { ElInput } from 'element-plus'

const props = withDefaults(defineProps<{
  modelValue: string | number
  placeholder?: string
  type?: 'text' | 'textarea' | 'password'
  clearable?: boolean
  disabled?: boolean
  rows?: number
}>(), {
  placeholder: '',
  type: 'text',
  clearable: false,
  disabled: false,
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function handleUpdate(value: string | number) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="oj-input">
    <ElInput
      v-bind="$attrs"
      :model-value="props.modelValue"
      :placeholder="placeholder"
      :type="type"
      :clearable="clearable"
      :disabled="disabled"
      :rows="rows"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<style scoped>
.oj-input :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--oj-panel) 92%, #f8fbff 8%) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--oj-border) 88%, #dbe5f0 12%) !important;
  transform: none !important;
  transition: box-shadow 0.18s ease;
}

.oj-input :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--oj-primary) 52%, white 48%) !important,
    0 0 0 4px color-mix(in srgb, var(--oj-primary) 14%, transparent) !important;
}

.oj-input :deep(.el-input__wrapper.is-disabled) {
  background: color-mix(in srgb, var(--oj-panel-soft) 86%, var(--oj-panel) 14%) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--oj-border) 94%, transparent) !important;
}

.oj-input :deep(.el-input__inner) {
  color: var(--oj-ink) !important;
  font-weight: 550;
  transform: none !important;
  -webkit-text-fill-color: var(--oj-ink);
}

.oj-input :deep(.el-input__inner::placeholder) {
  color: color-mix(in srgb, var(--oj-muted) 88%, transparent) !important;
  font-weight: 450;
}

.oj-input :deep(.el-input.is-disabled .el-input__inner) {
  color: color-mix(in srgb, var(--oj-muted) 82%, var(--oj-ink-soft) 18%) !important;
  -webkit-text-fill-color: color-mix(in srgb, var(--oj-muted) 82%, var(--oj-ink-soft) 18%);
  font-weight: 500;
}

.oj-input :deep(.el-input__prefix),
.oj-input :deep(.el-input__prefix-inner),
.oj-input :deep(.el-input__prefix-inner > *) {
  pointer-events: none !important;
}

.oj-input :deep(.el-textarea__inner) {
  min-height: 120px;
  padding: 12px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--oj-panel) 92%, #f8fbff 8%) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--oj-border) 88%, #dbe5f0 12%) !important;
  color: var(--oj-ink) !important;
  font-weight: 550;
}

.oj-input :deep(.el-textarea__inner:focus) {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--oj-primary) 52%, white 48%) !important,
    0 0 0 4px color-mix(in srgb, var(--oj-primary) 14%, transparent) !important;
}

.oj-input :deep(.el-textarea.is-disabled .el-textarea__inner) {
  color: color-mix(in srgb, var(--oj-muted) 82%, var(--oj-ink-soft) 18%) !important;
  -webkit-text-fill-color: color-mix(in srgb, var(--oj-muted) 82%, var(--oj-ink-soft) 18%);
  background: color-mix(in srgb, var(--oj-panel-soft) 86%, var(--oj-panel) 14%) !important;
}
</style>
