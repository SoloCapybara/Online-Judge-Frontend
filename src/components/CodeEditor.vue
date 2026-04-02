<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  language?: string
  theme?: 'auto' | 'light' | 'dark'
  minHeight?: number
  borderless?: boolean
}>(), {
  language: 'java',
  theme: 'auto',
  minHeight: 480,
  borderless: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let themeObserver: MutationObserver | null = null

const containerStyle = computed(() => ({
  '--editor-min-height': `${Math.max(120, Number(props.minHeight) || 480)}px`,
}))

function resolveMonacoTheme(theme: 'auto' | 'light' | 'dark') {
  if (theme === 'light') {
    return 'vs'
  }
  if (theme === 'dark') {
    return 'vs-dark'
  }
  const root = document.documentElement
  const datasetTheme = root.getAttribute('data-theme')
  const hasDarkClass = root.classList.contains('dark')
  return datasetTheme === 'dark' || hasDarkClass ? 'vs-dark' : 'vs'
}

function applyTheme() {
  monaco.editor.setTheme(resolveMonacoTheme(props.theme))
}

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  applyTheme()

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: resolveMonacoTheme(props.theme),
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 22,
    padding: { top: 16, bottom: 16 },
    roundedSelection: false,
    scrollBeyondLastLine: false,
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor?.getValue() ?? '')
  })

  themeObserver = new MutationObserver(() => {
    applyTheme()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value)
    }
  },
)

watch(
  () => props.language,
  (language) => {
    const model = editor?.getModel()
    if (model && language) {
      monaco.editor.setModelLanguage(model, language)
    }
  },
)

watch(
  () => props.theme,
  () => {
    applyTheme()
  },
)

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  editor?.dispose()
})
</script>

<template>
  <div
    ref="containerRef"
    class="editor-container"
    :class="{ 'editor-container--borderless': borderless }"
    :style="containerStyle"
  ></div>
</template>

<style scoped>
.editor-container {
  min-height: var(--editor-min-height);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dbe5f0;
}

.editor-container--borderless {
  border: 0;
  border-radius: 0;
}
</style>
