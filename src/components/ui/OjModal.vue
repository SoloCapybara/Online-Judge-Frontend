<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useSlots, watch } from 'vue'

let openModalCount = 0
let previousBodyOverflow = ''

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  maxWidth?: string
  zIndex?: number
  closeOnEsc?: boolean
  closeOnOverlay?: boolean
  showClose?: boolean
}>(), {
  title: '',
  description: '',
  maxWidth: '32rem',
  zIndex: 200,
  closeOnEsc: true,
  closeOnOverlay: true,
  showClose: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const slots = useSlots()
const hasHeader = computed(() => Boolean(slots.header) || props.title || props.description)

function lockBodyScroll() {
  if (typeof document === 'undefined') {
    return
  }
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  openModalCount += 1
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || openModalCount === 0) {
    return
  }
  openModalCount -= 1
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ''
  }
}

function requestClose() {
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick() {
  if (!props.closeOnOverlay) {
    return
  }
  requestClose()
}

function handleEscape(event: KeyboardEvent) {
  if (!props.modelValue || !props.closeOnEsc || event.key !== 'Escape') {
    return
  }
  requestClose()
}

watch(
  () => props.modelValue,
  (isOpen, wasOpen) => {
    if (isOpen) {
      lockBodyScroll()
      return
    }
    if (wasOpen) {
      unlockBodyScroll()
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  if (props.modelValue) {
    unlockBodyScroll()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="oj-modal">
      <div
        v-if="modelValue"
        class="oj-modal fixed inset-0 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        :style="{ zIndex: String(zIndex) }"
      >
        <button
          type="button"
          class="oj-modal__overlay absolute inset-0"
          aria-label="关闭弹窗"
          @click="handleOverlayClick"
        ></button>

        <section
          class="oj-modal__panel relative z-10 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#12151f]"
          :style="{ maxWidth }"
        >
          <button
            v-if="showClose"
            type="button"
            class="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
            aria-label="关闭弹窗"
            @click="requestClose"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <header v-if="hasHeader" class="pr-10">
            <slot name="header">
              <h2 v-if="title" class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ description }}</p>
            </slot>
          </header>

          <div :class="hasHeader ? 'mt-5' : ''">
            <slot />
          </div>

          <footer v-if="slots.footer" class="mt-6 border-t border-slate-200 pt-4 dark:border-white/[0.06]">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.oj-modal-enter-active,
.oj-modal-leave-active {
  transition: none;
}

.oj-modal-enter-active .oj-modal__overlay,
.oj-modal-leave-active .oj-modal__overlay {
  transition: background-color 220ms ease;
}

.oj-modal-enter-active .oj-modal__panel,
.oj-modal-leave-active .oj-modal__panel {
  transition:
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    filter 260ms ease;
  transform-origin: top center;
}

.oj-modal-enter-from .oj-modal__panel,
.oj-modal-leave-to .oj-modal__panel {
  opacity: 0;
  transform: translateY(14px) scale(0.975);
  filter: blur(6px);
}

.oj-modal__overlay {
  background: rgba(2, 6, 23, 0.46);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

:global(:root[data-theme='dark']) .oj-modal__overlay {
  background: rgba(2, 6, 23, 0.58);
}

.oj-modal-enter-from .oj-modal__overlay,
.oj-modal-leave-to .oj-modal__overlay {
  background: rgba(2, 6, 23, 0.22);
}

:global(:root[data-theme='dark']) .oj-modal-enter-from .oj-modal__overlay,
:global(:root[data-theme='dark']) .oj-modal-leave-to .oj-modal__overlay {
  background: rgba(2, 6, 23, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .oj-modal-enter-active,
  .oj-modal-leave-active,
  .oj-modal-enter-active .oj-modal__overlay,
  .oj-modal-leave-active .oj-modal__overlay,
  .oj-modal-enter-active .oj-modal__panel,
  .oj-modal-leave-active .oj-modal__panel {
    transition-duration: 1ms !important;
  }

  .oj-modal-enter-from .oj-modal__panel,
  .oj-modal-leave-to .oj-modal__panel {
    transform: none;
    filter: none;
  }
}
</style>
