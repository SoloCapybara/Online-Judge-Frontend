<script setup lang="ts">
defineProps<{
  isDark: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    class="oj-theme-toggle"
    :class="{ 'is-dark': isDark }"
    :aria-pressed="isDark"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :title="isDark ? '当前：深色 · 点击切换浅色' : '当前：浅色 · 点击切换深色'"
    @click="emit('toggle')"
  >
    <span class="oj-theme-toggle__icons" aria-hidden="true">
      <svg class="oj-theme-toggle__icon oj-theme-toggle__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg class="oj-theme-toggle__icon oj-theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
    <span class="oj-theme-toggle__thumb"></span>
  </button>
</template>

<style scoped>
.oj-theme-toggle {
  position: relative;
  width: 52px;
  height: 28px;
  border: 1px solid rgba(203, 213, 225, 0.92);
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.88);
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.oj-theme-toggle__icons {
  position: absolute;
  inset: 3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
}

.oj-theme-toggle__icon {
  width: 14px;
  height: 14px;
}

.oj-theme-toggle__icon--moon {
  color: #6d4ee6;
  opacity: 0.34;
}

.oj-theme-toggle__icon--sun {
  color: #f59e0b;
  opacity: 1;
}

.oj-theme-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  z-index: 1;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 6px 14px rgba(245, 158, 11, 0.3);
  transform: translateX(24px);
  transition:
    transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1),
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.oj-theme-toggle.is-dark {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(24, 28, 42, 0.9);
}

.oj-theme-toggle.is-dark .oj-theme-toggle__icon--moon {
  opacity: 1;
}

.oj-theme-toggle.is-dark .oj-theme-toggle__icon--sun {
  opacity: 0.36;
}

.oj-theme-toggle.is-dark .oj-theme-toggle__thumb {
  background: linear-gradient(135deg, #6d4ee6 0%, #38bdf8 100%);
  box-shadow: 0 6px 14px rgba(109, 78, 230, 0.34);
  transform: translateX(0);
}
</style>
