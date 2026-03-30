<script setup lang="ts">
import { ref, type CSSProperties } from 'vue'
import { ElButton } from 'element-plus'

const props = withDefaults(defineProps<{
  tone?: 'primary' | 'info' | 'accent' | 'secondary' | 'ghost' | 'danger'
  size?: 'large' | 'default' | 'small'
  block?: boolean
  mono?: boolean
  disabled?: boolean
  loading?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
}>(), {
  tone: 'primary',
  size: 'default',
  block: false,
  mono: false,
  disabled: false,
  loading: false,
  nativeType: 'button',
})

const rippleKey = ref(0)
const rippleStyle = ref<CSSProperties>({})

function handlePointerDown(event: PointerEvent) {
  if (props.disabled || props.loading) {
    return
  }

  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    return
  }

  const rect = target.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 1.2

  rippleStyle.value = {
    width: `${size}px`,
    height: `${size}px`,
    left: `${event.clientX - rect.left - size / 2}px`,
    top: `${event.clientY - rect.top - size / 2}px`,
  }
  rippleKey.value += 1
}
</script>

<template>
  <ElButton
    v-bind="$attrs"
    :class="[
      'oj-button',
      `oj-button--${tone}`,
      `oj-button--${size}`,
      { 'is-block': block, 'is-mono': mono },
    ]"
    :disabled="disabled"
    :loading="loading"
    :native-type="nativeType"
    @pointerdown="handlePointerDown"
  >
    <span class="oj-button__content">
      <slot />
    </span>
    <span v-if="rippleKey > 0" :key="rippleKey" class="oj-button__ripple" :style="rippleStyle" aria-hidden="true"></span>
  </ElButton>
</template>

<style scoped>
.oj-button {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-width: 108px;
  height: 40px;
  margin: 0;
  padding: 0 18px;
  border-radius: 8px;
  font-weight: 600;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    filter 0.15s ease;
}

.oj-button:hover:not(.is-disabled),
.oj-button:focus-visible:not(.is-disabled) {
  transform: translateY(-1px);
}

.oj-button:active:not(.is-disabled) {
  transform: translateY(0) scale(0.98);
  filter: saturate(1.04);
}

.oj-button.is-block {
  width: 100%;
}

.oj-button.is-mono {
  font-family: var(--oj-mono);
}

.oj-button--large {
  height: 44px;
  padding: 0 22px;
  font-size: 14px;
}

.oj-button--default {
  font-size: 14px;
}

.oj-button--small {
  min-width: 92px;
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
}

.oj-button--primary {
  color: #fff;
  border-color: var(--oj-primary);
  background: var(--oj-primary);
  box-shadow: none;
}

.oj-button--primary:hover:not(.is-disabled),
.oj-button--primary:focus-visible:not(.is-disabled) {
  border-color: var(--oj-primary-strong);
  background: var(--oj-primary-strong);
}

.oj-button--accent {
  color: #fff;
  border-color: #d47b1f;
  background: #d47b1f;
  box-shadow: none;
}

.oj-button--accent:hover:not(.is-disabled),
.oj-button--accent:focus-visible:not(.is-disabled) {
  background: #bf6c18;
  border-color: #bf6c18;
}

.oj-button--info {
  color: #fff;
  border-color: var(--oj-accent);
  background: var(--oj-accent);
  box-shadow: none;
}

.oj-button--info:hover:not(.is-disabled),
.oj-button--info:focus-visible:not(.is-disabled) {
  border-color: color-mix(in srgb, var(--oj-accent) 86%, #000);
  background: color-mix(in srgb, var(--oj-accent) 86%, #000);
}

.oj-button--secondary {
  color: var(--oj-ink-soft);
  border-color: var(--oj-border);
  background: var(--oj-panel);
}

.oj-button--ghost {
  color: var(--oj-primary-strong);
  border-color: transparent;
  background: var(--oj-primary-soft);
}

.oj-button--danger {
  color: #fff;
  border-color: #dc5b65;
  background: #dc5b65;
}

.oj-button__content {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
}

.oj-button__ripple {
  position: absolute;
  z-index: 1;
  border-radius: 50%;
  pointer-events: none;
  background: color-mix(in srgb, currentColor 18%, transparent);
  transform: scale(0);
  opacity: 0.28;
  animation: oj-button-ripple 0.55s ease-out;
}

@keyframes oj-button-ripple {
  from {
    transform: scale(0);
    opacity: 0.3;
  }

  to {
    transform: scale(1);
    opacity: 0;
  }
}

.oj-button:deep(.el-icon) {
  margin-right: 6px;
}
</style>
