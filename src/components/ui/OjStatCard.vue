<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string
  trend?: string
  helper?: string
  tone?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral'
}>(), {
  trend: '',
  helper: '',
  tone: 'primary',
})
</script>

<template>
  <article :class="['oj-stat-card', `oj-stat-card--${tone}`]">
    <div class="oj-stat-card__head">
      <div class="oj-stat-card__label">{{ label }}</div>
      <div v-if="$slots.icon" class="oj-stat-card__icon">
        <slot name="icon" />
      </div>
    </div>

    <div class="oj-stat-card__value">{{ value }}</div>

    <div v-if="trend || helper" class="oj-stat-card__foot">
      <span v-if="trend">{{ trend }}</span>
      <span v-if="helper">{{ helper }}</span>
    </div>
  </article>
</template>

<style scoped>
.oj-stat-card {
  --stat-accent: var(--oj-primary);
  --stat-border: #dce7fb;
  --stat-surface: #f4f7ff;
  position: relative;
  overflow: hidden;
  min-height: 186px;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid var(--stat-border);
  background: linear-gradient(135deg, var(--stat-surface) 0%, #ffffff 72%);
  box-shadow: var(--oj-shadow);
}

.oj-stat-card::after {
  content: '';
  position: absolute;
  top: -32px;
  right: -24px;
  width: 112px;
  height: 112px;
  border-radius: 28px;
  background: color-mix(in srgb, var(--stat-accent) 10%, white);
  transform: rotate(16deg);
}

.oj-stat-card__head,
.oj-stat-card__value,
.oj-stat-card__foot {
  position: relative;
  z-index: 1;
}

.oj-stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.oj-stat-card__label {
  color: var(--oj-muted);
  font-size: 14px;
  font-weight: 600;
}

.oj-stat-card__icon {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: color-mix(in srgb, var(--stat-accent) 78%, #233044);
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.82);
}

.oj-stat-card__value {
  margin-top: 28px;
  color: var(--oj-ink-soft);
  font-size: 36px;
  line-height: 1;
  font-weight: 700;
}

.oj-stat-card__foot {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-top: 26px;
  color: var(--oj-muted);
  font-size: 13px;
}

.oj-stat-card--accent {
  --stat-accent: var(--oj-accent);
  --stat-border: #f1dec4;
  --stat-surface: #fff8f0;
}

.oj-stat-card--success {
  --stat-accent: var(--oj-success);
  --stat-border: #d7ecdf;
  --stat-surface: #f4fbf6;
}

.oj-stat-card--danger {
  --stat-accent: var(--oj-danger);
  --stat-border: #f3d9dc;
  --stat-surface: #fff7f7;
}

.oj-stat-card--neutral {
  --stat-accent: #5b6b80;
  --stat-border: #dce3ed;
  --stat-surface: #f5f7fb;
}
</style>
