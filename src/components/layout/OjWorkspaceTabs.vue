<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { WorkspaceRegistryItem, WorkspaceTab } from '../../composables/useWorkspaceTabs'

const props = defineProps<{
  tabs: readonly WorkspaceTab[]
  activeKey: string
  openableItems: readonly WorkspaceRegistryItem[]
}>()

const emit = defineEmits<{
  navigate: [to: string]
  close: [key: string]
  open: [key: string]
  refresh: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const refreshIconTick = ref(0)

const availableItems = computed(() =>
  props.openableItems.filter((item) => !props.tabs.some((tab) => tab.key === item.key)),
)

function handleDocumentClick(event: MouseEvent) {
  if (!menuOpen.value) return
  const target = event.target as Node | null
  if (menuRef.value && target && !menuRef.value.contains(target)) {
    menuOpen.value = false
  }
}

function handleRefreshClick() {
  refreshIconTick.value += 1
  emit('refresh')
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <section class="flex items-end gap-1 border-t border-slate-200/50 px-4 pb-2 pt-1.5 dark:border-white/[0.06]">
    <div class="flex min-h-[36px] min-w-0 flex-1 items-end gap-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
      <div
        v-for="tab in props.tabs"
        :key="tab.key"
        class="group flex max-w-[220px] min-w-0 shrink-0 items-stretch overflow-hidden rounded-t-lg border border-b-0 transition"
        :class="
          props.activeKey === tab.key
            ? 'border-violet-500/50 bg-white text-violet-700 shadow-sm dark:border-violet-500/40 dark:bg-white/[0.08] dark:text-violet-300'
            : 'border-transparent bg-slate-100/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100'
        "
      >
        <button
          type="button"
          class="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm font-medium"
          @click="emit('navigate', tab.to)"
        >
          {{ tab.title }}
        </button>
        <button
          v-if="!tab.affix"
          type="button"
          class="flex w-7 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          @click.stop="emit('close', tab.key)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex shrink-0 items-end gap-1 self-end pb-0.5">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.08]"
        @click="handleRefreshClick"
      >
        <svg :key="`refresh-${refreshIconTick}`" class="oj-refresh-icon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <div ref="menuRef" class="relative">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg font-medium leading-none text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.08]"
          :aria-expanded="menuOpen"
          @click.stop="menuOpen = !menuOpen"
        >
          +
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white/95 py-1 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#0f1320]/88"
        >
          <button
            v-for="item in availableItems"
            :key="item.key"
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
            @click="menuOpen = false; emit('open', item.key)"
          >
            {{ item.title }}
          </button>
          <div v-if="availableItems.length === 0" class="px-3 py-2 text-xs text-slate-400">
            常用页面已全部打开
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.oj-refresh-icon {
  animation: oj-refresh-spin 520ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center;
}

@keyframes oj-refresh-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
