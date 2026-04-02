<script setup lang="ts">
const props = withDefaults(defineProps<{
  loading?: boolean
  loadingText?: string
}>(), {
  loading: false,
  loadingText: '加载中...',
})
</script>

<template>
  <section class="oj-table-layout">
    <section v-if="$slots.filters" class="oj-table-layout__filters">
      <slot name="filters" />
    </section>

    <slot name="error" />

    <div class="oj-table-layout__table-wrap">
      <div v-if="props.loading" class="oj-table-layout__loading-mask" aria-live="polite" aria-busy="true">
        <div class="oj-table-layout__loading-indicator">
          <span class="oj-table-layout__loading-spinner" aria-hidden="true"></span>
          <span class="oj-table-layout__loading-text">{{ props.loadingText }}</span>
        </div>
      </div>
      <slot />
    </div>

    <div v-if="$slots.pagination" class="oj-table-layout__pagination">
      <slot name="pagination" />
    </div>
  </section>
</template>

<style scoped>
.oj-table-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.oj-table-layout__filters {
  border-radius: 12px;
  border: 1px solid rgb(226 232 240 / 1);
  background: rgb(255 255 255 / 0.9);
  padding: 12px 16px;
}

.oj-table-layout__table-wrap {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgb(226 232 240 / 1);
  background: rgb(255 255 255 / 1);
}

.oj-table-layout__loading-mask {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  background: color-mix(in srgb, var(--oj-panel) 75%, transparent);
}

.oj-table-layout__loading-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--oj-border) 90%, transparent);
  background: color-mix(in srgb, var(--oj-panel) 94%, transparent);
  color: var(--oj-ink-soft);
  box-shadow: var(--oj-shadow);
}

.oj-table-layout__loading-spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--oj-primary) 22%, transparent);
  border-top-color: var(--oj-primary);
  animation: oj-table-layout-spin 0.72s linear infinite;
}

.oj-table-layout__loading-text {
  font-size: 13px;
  font-weight: 600;
}

.oj-table-layout__pagination {
  padding-bottom: 4px;
}

.oj-table-layout :deep(.oj-table-filter-grid .oj-input .el-input__wrapper) {
  min-height: 34px;
  border-radius: 10px;
}

.oj-table-layout :deep(.oj-table-filter-grid .oj-select .el-select__wrapper) {
  min-height: 34px !important;
  height: 34px !important;
  border-radius: 10px !important;
}

@keyframes oj-table-layout-spin {
  to {
    transform: rotate(360deg);
  }
}

:root[data-theme='dark'] .oj-table-layout__filters {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(18 21 31 / 0.9);
}

:root[data-theme='dark'] .oj-table-layout__table-wrap {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(18 21 31 / 1);
}
</style>
