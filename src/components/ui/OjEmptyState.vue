<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  tone?: 'primary' | 'accent' | 'success' | 'neutral'
}>(), {
  description: '',
  tone: 'primary',
})
</script>

<template>
  <section :class="['oj-empty', `oj-empty--${tone}`]">
    <div v-if="$slots.icon" class="oj-empty__icon">
      <slot name="icon" />
    </div>
    <h3 class="oj-empty__title">{{ title }}</h3>
    <p v-if="description" class="oj-empty__description">{{ description }}</p>
    <div v-if="$slots.actions" class="oj-empty__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.oj-empty {
  --empty-accent: var(--oj-primary);
  --empty-border: #dce7fb;
  --empty-surface: #f4f7ff;
  padding: 28px;
  border-radius: 20px;
  border: 1px dashed var(--empty-border);
  background: linear-gradient(180deg, var(--empty-surface) 0%, #ffffff 100%);
  text-align: center;
}

.oj-empty__icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto;
  border-radius: 18px;
  color: color-mix(in srgb, var(--empty-accent) 78%, #233044);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.88);
}

.oj-empty__title {
  margin: 18px 0 0;
  color: var(--oj-ink-soft);
  font-size: 20px;
}

.oj-empty__description {
  max-width: 520px;
  margin: 10px auto 0;
  color: var(--oj-muted);
  font-size: 14px;
}

.oj-empty__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.oj-empty--accent {
  --empty-accent: var(--oj-accent);
  --empty-border: #f1dec4;
  --empty-surface: #fff8f0;
}

.oj-empty--success {
  --empty-accent: var(--oj-success);
  --empty-border: #d7ecdf;
  --empty-surface: #f4fbf6;
}

.oj-empty--neutral {
  --empty-accent: #5b6b80;
  --empty-border: #dce3ed;
  --empty-surface: #f5f7fb;
}
</style>
