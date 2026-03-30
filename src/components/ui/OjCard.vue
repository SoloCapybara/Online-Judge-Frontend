<script setup lang="ts">
import { useSlots } from 'vue'

withDefaults(defineProps<{
  title?: string
  description?: string
  eyebrow?: string
  tone?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral'
}>(), {
  title: '',
  description: '',
  eyebrow: '',
  tone: 'neutral',
})

const slots = useSlots()
</script>

<template>
  <article :class="['oj-card', `oj-card--${tone}`]">
    <header v-if="eyebrow || title || description" class="oj-card__head">
      <div v-if="eyebrow" class="oj-card__eyebrow">{{ eyebrow }}</div>
      <h3 v-if="title" class="oj-card__title">{{ title }}</h3>
      <p v-if="description" class="oj-card__description">{{ description }}</p>
    </header>

    <div class="oj-card__body">
      <slot />
    </div>

    <footer v-if="slots.footer" class="oj-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.oj-card {
  --card-accent: #64748b;
  --card-border: var(--oj-border);
  --card-surface-start: color-mix(in srgb, var(--oj-panel-soft) 34%, var(--oj-panel) 66%);
  --card-surface-end: var(--oj-panel);
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--card-border);
  background: linear-gradient(180deg, var(--card-surface-start) 0%, var(--card-surface-end) 62%);
  box-shadow: var(--oj-shadow);
  color: var(--oj-ink-soft);
}

.oj-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--card-accent) 14%, transparent) 0%, transparent 34%);
  pointer-events: none;
}

.oj-card::after {
  content: '';
  position: absolute;
  top: -28px;
  right: -18px;
  width: 120px;
  height: 120px;
  border-radius: 32px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 14%, transparent) 0%, transparent 72%);
  transform: rotate(14deg);
  opacity: 0.82;
  pointer-events: none;
}

.oj-card__head {
  position: relative;
  z-index: 1;
  padding: 24px 24px 0;
}

.oj-card__body {
  position: relative;
  z-index: 1;
  padding: 20px 24px 24px;
}

.oj-card__footer {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin: 0 18px 18px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--oj-border) 92%, transparent);
  background: color-mix(in srgb, var(--oj-panel) 88%, transparent);
  backdrop-filter: blur(10px);
}

.oj-card__eyebrow {
  width: fit-content;
  padding: 5px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--oj-panel-soft) 82%, transparent);
  color: color-mix(in srgb, var(--card-accent) 72%, var(--oj-ink-soft) 28%);
  font-size: 12px;
  font-weight: 700;
}

.oj-card__title {
  margin: 14px 0 0;
  color: var(--oj-ink-soft);
  font-size: 20px;
  font-weight: 700;
}

.oj-card__description {
  margin: 8px 0 0;
  color: var(--oj-muted);
  font-size: 14px;
  max-width: 560px;
}

.oj-card--primary {
  --card-accent: var(--oj-primary);
  --card-border: color-mix(in srgb, var(--oj-primary) 24%, var(--oj-border) 76%);
  --card-surface-start: color-mix(in srgb, var(--oj-primary-soft) 42%, var(--oj-panel) 58%);
}

.oj-card--accent {
  --card-accent: var(--oj-accent);
  --card-border: color-mix(in srgb, var(--oj-accent) 22%, var(--oj-border) 78%);
  --card-surface-start: color-mix(in srgb, var(--oj-accent) 10%, var(--oj-panel) 90%);
}

.oj-card--success {
  --card-accent: var(--oj-success);
  --card-border: color-mix(in srgb, var(--oj-success) 24%, var(--oj-border) 76%);
  --card-surface-start: color-mix(in srgb, var(--oj-success) 10%, var(--oj-panel) 90%);
}

.oj-card--danger {
  --card-accent: var(--oj-danger);
  --card-border: color-mix(in srgb, var(--oj-danger) 24%, var(--oj-border) 76%);
  --card-surface-start: color-mix(in srgb, var(--oj-danger) 10%, var(--oj-panel) 90%);
}
</style>
