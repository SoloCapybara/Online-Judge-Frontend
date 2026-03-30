<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  current: number
  total: number
  pageSize: number
  pages?: number
  pageSizes?: number[]
  showPageSize?: boolean
  windowSize?: number
}>(), {
  pageSizes: () => [10, 20, 30, 50],
  showPageSize: true,
  windowSize: 5,
})

const emit = defineEmits<{
  'current-change': [value: number]
  'page-size-change': [value: number]
}>()

const totalPages = computed(() => {
  if (Number.isFinite(props.pages) && Number(props.pages) > 0) {
    return Math.floor(Number(props.pages))
  }
  if (props.total <= 0) {
    return 0
  }
  return Math.max(1, Math.ceil(props.total / props.pageSize))
})

const summaryText = computed(() => {
  if (props.total <= 0) {
    return '共 0 条，共 0 页'
  }
  const start = (props.current - 1) * props.pageSize + 1
  const end = Math.min(props.current * props.pageSize, props.total)
  return `第 ${start}-${end} 条，共 ${props.total.toLocaleString('zh-CN')} 条，共 ${totalPages.value.toLocaleString('zh-CN')} 页`
})

const pageWindow = computed(() => {
  const size = Math.max(3, props.windowSize)
  let from = Math.max(1, props.current - Math.floor(size / 2))
  let to = Math.min(totalPages.value, from + size - 1)
  from = Math.max(1, to - size + 1)

  const result: number[] = []
  for (let page = from; page <= to; page += 1) {
    result.push(page)
  }
  return result
})

function goTo(page: number) {
  if (page < 1 || page > totalPages.value || page === props.current) {
    return
  }
  emit('current-change', page)
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target) {
    return
  }
  const next = Number(target.value)
  if (!Number.isFinite(next) || next <= 0) {
    return
  }
  emit('page-size-change', next)
}
</script>

<template>
  <nav class="oj-pagination" aria-label="分页">
    <div class="oj-pagination__summary">{{ summaryText }}</div>

    <div class="oj-pagination__controls">
      <label v-if="showPageSize" class="oj-pagination__size">
        <span>每页</span>
        <select :value="String(pageSize)" @change="handlePageSizeChange">
          <option v-for="size in pageSizes" :key="size" :value="String(size)">{{ size }}</option>
        </select>
      </label>

      <button type="button" class="oj-pagination__btn" :disabled="current <= 1" @click="goTo(current - 1)">
        上一页
      </button>

      <button
        v-for="page in pageWindow"
        :key="page"
        type="button"
        class="oj-pagination__btn"
        :class="{ 'is-active': page === current }"
        @click="goTo(page)"
      >
        {{ page }}
      </button>

      <button type="button" class="oj-pagination__btn" :disabled="current >= totalPages || totalPages <= 0" @click="goTo(current + 1)">
        下一页
      </button>
    </div>
  </nav>
</template>

<style scoped>
.oj-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.oj-pagination__summary {
  color: var(--oj-muted);
  font-size: 13px;
}

.oj-pagination__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.oj-pagination__size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--oj-muted);
  font-size: 12px;
}

.oj-pagination__size select {
  height: 30px;
  border: 1px solid var(--oj-border);
  border-radius: 9px;
  padding: 0 8px;
  background: var(--oj-panel);
  color: var(--oj-ink);
  font-size: 12px;
  outline: none;
}

.oj-pagination__btn {
  min-width: 36px;
  height: 32px;
  border: 1px solid var(--oj-border);
  border-radius: 9px;
  padding: 0 10px;
  background: var(--oj-panel);
  color: var(--oj-ink-soft);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.16s ease;
}

.oj-pagination__btn:hover:not(:disabled) {
  background: var(--oj-panel-soft);
}

.oj-pagination__btn.is-active {
  border-color: color-mix(in srgb, var(--oj-primary) 48%, var(--oj-border));
  background: color-mix(in srgb, var(--oj-primary) 12%, var(--oj-panel));
  color: var(--oj-primary-strong);
  font-weight: 700;
}

.oj-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
