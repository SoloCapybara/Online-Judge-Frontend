<script setup lang="ts">
import { computed } from 'vue'
import { useRouteProgress } from '../../composables/useRouteProgress'

const { visible, progress } = useRouteProgress()
const scaleX = computed(() => Math.max(progress.value, 0.001))
</script>

<template>
  <div v-show="visible" class="oj-route-progress" aria-hidden="true">
    <div class="oj-route-progress__bar" :style="{ transform: `scaleX(${scaleX})` }"></div>
    <div
      class="oj-route-progress__glow"
      :style="{ transform: `translateX(calc(${Math.max(progress * 100, 0)}% - 96px))` }"
    ></div>
  </div>
</template>

<style scoped>
.oj-route-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 4000;
  width: 100%;
  height: 3px;
  pointer-events: none;
}

.oj-route-progress__bar {
  width: 100%;
  height: 100%;
  transform-origin: left center;
  will-change: transform;
  background: linear-gradient(90deg, #3182ff 0%, #5a78ff 45%, #6d4ee6 100%);
  box-shadow: 0 0 10px rgba(49, 130, 255, 0.45);
  transition: transform 110ms linear;
}

.oj-route-progress__glow {
  position: absolute;
  top: -2px;
  left: 0;
  width: 96px;
  height: 7px;
  will-change: transform;
  filter: blur(8px);
  opacity: 0.42;
  background: linear-gradient(90deg, rgba(49, 130, 255, 0), rgba(90, 120, 255, 0.8));
  transition: transform 120ms linear;
}
</style>
