<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'custom' | 'ac' | 'judging' | 'wa' | 'tle' | 're' | 'ce'
  size?: 'default' | 'small'
  dot?: boolean
  label?: string
  textColor?: string
  backgroundColor?: string
  borderColor?: string
}>(), {
  tone: 'neutral',
  size: 'default',
  dot: false,
  label: '',
  textColor: '',
  backgroundColor: '',
  borderColor: '',
})

const badgeStyle = computed(() => {
  if (props.tone !== 'custom') {
    return undefined
  }

  return {
    color: props.textColor || '#334155',
    background: props.backgroundColor || '#f1f5fb',
    borderColor: props.borderColor || props.backgroundColor || '#dce3ed',
  }
})
</script>

<template>
  <span :class="['oj-badge', `oj-badge--${tone}`, `oj-badge--${size}`]" :style="badgeStyle">
    <span v-if="dot" class="oj-badge__dot"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.oj-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.oj-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.72;
}

.oj-badge--small {
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.oj-badge--primary {
  color: #5b3cc4;
  background: rgba(109, 78, 230, 0.14);
  border-color: rgba(109, 78, 230, 0.26);
}

.oj-badge--success {
  color: #047857;
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(16, 185, 129, 0.26);
}

.oj-badge--warning {
  color: #b45309;
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.3);
}

.oj-badge--danger {
  color: #be123c;
  background: rgba(244, 63, 94, 0.14);
  border-color: rgba(244, 63, 94, 0.3);
}

.oj-badge--neutral {
  color: #475569;
  background: rgba(100, 116, 139, 0.12);
  border-color: rgba(100, 116, 139, 0.24);
}

.oj-badge--ac {
  color: #047857;
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
}

.oj-badge--judging {
  color: #0369a1;
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.28);
}

.oj-badge--wa {
  color: #b45309;
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

.oj-badge--tle {
  color: #6d28d9;
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.oj-badge--re {
  color: #be123c;
  background: rgba(244, 63, 94, 0.15);
  border-color: rgba(244, 63, 94, 0.32);
}

.oj-badge--ce {
  color: #9a3412;
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.3);
}

.oj-badge--custom {
  color: #334155;
  background: #f1f5fb;
  border-color: #dce3ed;
}

:global(:root[data-theme='dark']) .oj-badge--primary {
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.34);
}

:global(:root[data-theme='dark']) .oj-badge--success,
:global(:root[data-theme='dark']) .oj-badge--ac {
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.32);
}

:global(:root[data-theme='dark']) .oj-badge--warning,
:global(:root[data-theme='dark']) .oj-badge--wa {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.32);
}

:global(:root[data-theme='dark']) .oj-badge--danger,
:global(:root[data-theme='dark']) .oj-badge--re {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.2);
  border-color: rgba(244, 63, 94, 0.34);
}

:global(:root[data-theme='dark']) .oj-badge--neutral {
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.18);
  border-color: rgba(148, 163, 184, 0.26);
}

:global(:root[data-theme='dark']) .oj-badge--judging {
  color: #7dd3fc;
  background: rgba(14, 165, 233, 0.2);
  border-color: rgba(14, 165, 233, 0.34);
}

:global(:root[data-theme='dark']) .oj-badge--tle {
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.22);
  border-color: rgba(139, 92, 246, 0.34);
}

:global(:root[data-theme='dark']) .oj-badge--ce {
  color: #fdba74;
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.32);
}
</style>
