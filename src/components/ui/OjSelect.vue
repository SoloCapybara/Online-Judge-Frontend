<script setup lang="ts">
import { computed } from 'vue'
import { ElOption, ElSelect } from 'element-plus'

type SelectValue = string | number
type SelectOption = {
  label: string
  value: SelectValue
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: SelectValue | undefined | null
  options: ReadonlyArray<SelectOption>
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  popperClass?: string
}>(), {
  placeholder: '请选择',
  disabled: false,
  clearable: false,
  popperClass: 'oj-select-dropdown',
})

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue | undefined]
}>()

const innerValue = computed<SelectValue | undefined>({
  get: () => (props.modelValue ?? undefined),
  set: (value) => {
    emit('update:modelValue', value)
  },
})
</script>

<template>
  <div class="oj-select">
    <ElSelect
      v-bind="$attrs"
      v-model="innerValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :popper-class="popperClass"
      class="w-full"
    >
      <ElOption
        v-for="option in options"
        :key="String(option.value)"
        :label="option.label"
        :value="option.value"
        :disabled="option.disabled"
      />
    </ElSelect>
  </div>
</template>

<style scoped>
.oj-select :deep(.el-select__wrapper) {
  min-height: 44px;
  border-radius: 14px !important;
  background: color-mix(in srgb, var(--oj-panel) 92%, #f8fbff 8%) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--oj-border) 88%, #dbe5f0 12%) !important;
  transform: none !important;
  transition: box-shadow 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.oj-select :deep(.el-select__wrapper:hover:not(.is-focused)) {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--oj-primary) 28%, var(--oj-border)) !important;
}

.oj-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--oj-primary) 52%, white 48%) !important,
    0 0 0 4px color-mix(in srgb, var(--oj-primary) 14%, transparent) !important;
}

.oj-select :deep(.el-select__selected-item),
.oj-select :deep(.el-select__selected-item *) {
  color: var(--oj-ink) !important;
  font-weight: 600;
  opacity: 1;
}

.oj-select :deep(.el-select__placeholder) {
  color: var(--oj-muted);
}

.oj-select :deep(.el-select__placeholder.is-transparent) {
  z-index: 2;
  color: var(--oj-ink) !important;
  font-weight: 600;
}

.oj-select :deep(.el-select__selection .el-select__selected-item) {
  position: relative;
  z-index: 2;
}
</style>

<style>
.oj-select-dropdown.el-select__popper.el-popper {
  border: 1px solid color-mix(in srgb, var(--oj-border) 78%, transparent);
  background: color-mix(in srgb, var(--oj-panel) 94%, #ffffff 6%);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  overflow: hidden;
}

:root[data-theme='dark'] .oj-select-dropdown.el-select__popper.el-popper {
  border-color: color-mix(in srgb, var(--oj-border) 88%, transparent);
  background: color-mix(in srgb, var(--oj-panel) 90%, #0b1020 10%);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.45);
}

.oj-select-dropdown .el-select-dropdown__list {
  padding: 6px;
}

.oj-select-dropdown .el-select-dropdown__item {
  border: 1px solid transparent;
  border-radius: 9px;
  color: var(--oj-ink-soft);
  transition:
    background-color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.oj-select-dropdown .el-select-dropdown__item.is-hovering {
  border-color: color-mix(in srgb, var(--oj-primary) 22%, transparent);
  background: color-mix(in srgb, var(--oj-primary) 8%, var(--oj-panel) 92%);
}

.oj-select-dropdown .el-select-dropdown__item.is-selected {
  border-color: color-mix(in srgb, var(--oj-primary) 34%, transparent);
  background: color-mix(in srgb, var(--oj-primary) 16%, var(--oj-panel) 84%);
  color: color-mix(in srgb, var(--oj-primary-strong) 78%, var(--oj-ink-soft) 22%);
  font-weight: 700;
}

.oj-select-dropdown .el-select-dropdown__item.is-selected.is-hovering {
  border-color: color-mix(in srgb, var(--oj-primary) 42%, transparent);
  background: color-mix(in srgb, var(--oj-primary) 22%, var(--oj-panel) 78%);
}

.oj-select-dropdown .el-select-dropdown__item.is-disabled {
  color: var(--oj-muted);
}

.oj-select-dropdown.el-zoom-in-top-enter-active,
.oj-select-dropdown.el-zoom-in-top-leave-active,
.oj-select-dropdown.el-zoom-in-bottom-enter-active,
.oj-select-dropdown.el-zoom-in-bottom-leave-active {
  transition:
    opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 260ms cubic-bezier(0.22, 1, 0.36, 1) !important;
}

.oj-select-dropdown.el-zoom-in-top-enter-from,
.oj-select-dropdown.el-zoom-in-top-leave-to,
.oj-select-dropdown.el-zoom-in-bottom-enter-from,
.oj-select-dropdown.el-zoom-in-bottom-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
  filter: blur(6px);
}

.oj-select-dropdown.el-zoom-in-top-enter-to,
.oj-select-dropdown.el-zoom-in-top-leave-from,
.oj-select-dropdown.el-zoom-in-bottom-enter-to,
.oj-select-dropdown.el-zoom-in-bottom-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .oj-select-dropdown.el-zoom-in-top-enter-active,
  .oj-select-dropdown.el-zoom-in-top-leave-active,
  .oj-select-dropdown.el-zoom-in-bottom-enter-active,
  .oj-select-dropdown.el-zoom-in-bottom-leave-active {
    transition-duration: 1ms !important;
  }
}
</style>
