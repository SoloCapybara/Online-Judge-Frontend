<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  eyebrow?: string
  tone?: 'primary' | 'accent' | 'success' | 'neutral'
}>(), {
  description: '',
  eyebrow: '',
  tone: 'primary',
})
</script>

<template>
  <section :class="['oj-section-header', `oj-section-header--${tone}`]">
    <div class="oj-section-header__body">
      <div v-if="eyebrow" class="oj-section-header__eyebrow">{{ eyebrow }}</div>
      <h1 class="oj-section-header__title">{{ title }}</h1>
      <p v-if="description" class="oj-section-header__description">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="oj-section-header__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.oj-section-header {
  --header-accent: var(--oj-primary);
  --header-border: #dce7fb;
  --header-surface: #edf3ff;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--header-border);
  background: linear-gradient(135deg, var(--header-surface) 0%, #ffffff 64%);
  box-shadow: var(--oj-shadow);
}

.oj-section-header::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: linear-gradient(180deg, var(--header-accent), rgba(255, 255, 255, 0));
}

.oj-section-header::after {
  content: '';
  position: absolute;
  top: -48px;
  right: -22px;
  width: 150px;
  height: 150px;
  border-radius: 32px;
  background: color-mix(in srgb, var(--header-accent) 10%, white);
  transform: rotate(18deg);
}

.oj-section-header__body,
.oj-section-header__actions {
  position: relative;
  z-index: 1;
}

.oj-section-header__eyebrow {
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: color-mix(in srgb, var(--header-accent) 74%, #233044);
  font-size: 12px;
  font-weight: 700;
}

.oj-section-header__title {
  margin: 16px 0 0;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.15;
  color: var(--oj-ink-soft);
}

.oj-section-header__description {
  max-width: 760px;
  margin: 10px 0 0;
  color: var(--oj-muted);
  font-size: 15px;
}

.oj-section-header__actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.oj-section-header--accent {
  --header-accent: var(--oj-accent);
  --header-border: #f1dec4;
  --header-surface: #fff6ea;
}

.oj-section-header--success {
  --header-accent: var(--oj-success);
  --header-border: #d7ecdf;
  --header-surface: #f3fbf6;
}

.oj-section-header--neutral {
  --header-accent: #5b6b80;
  --header-border: #dce3ed;
  --header-surface: #f5f7fb;
}

@media (max-width: 960px) {
  .oj-section-header {
    flex-direction: column;
  }
}
</style>
