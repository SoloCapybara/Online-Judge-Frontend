<script setup lang="ts">
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import '@xterm/xterm/css/xterm.css'

const props = withDefaults(defineProps<{
  modelValue?: string
  title?: string
  readonly?: boolean
  placeholder?: string
  minHeight?: number
  interactive?: boolean
}>(), {
  modelValue: '',
  title: '终端',
  readonly: false,
  placeholder: '',
  minHeight: 160,
  interactive: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  eof: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)
const internalValue = ref(props.modelValue ?? '')

let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let disposeDataHandler: { dispose: () => void } | null = null
let themeObserver: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null
let inputLineBuffer = ''

const terminalBodyStyle = computed(() => ({
  '--oj-terminal-min-height': `${Math.max(120, Number(props.minHeight) || 160)}px`,
}))

function resolveTerminalTheme() {
  const root = document.documentElement
  const isDark = root.getAttribute('data-theme') === 'dark' || root.classList.contains('dark')
  if (isDark) {
    return {
      background: '#0b1020',
      foreground: '#e2e8f0',
      cursor: '#7c5cff',
      cursorAccent: '#0b1020',
      selectionBackground: 'rgba(124, 92, 255, 0.35)',
      black: '#0f172a',
      red: '#f87171',
      green: '#34d399',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c4b5fd',
      cyan: '#67e8f9',
      white: '#e2e8f0',
      brightBlack: '#64748b',
      brightRed: '#fb7185',
      brightGreen: '#6ee7b7',
      brightYellow: '#fcd34d',
      brightBlue: '#93c5fd',
      brightMagenta: '#ddd6fe',
      brightCyan: '#a5f3fc',
      brightWhite: '#f8fafc',
    }
  }
  return {
    background: '#f8fafc',
    foreground: '#0f172a',
    cursor: '#6d4ee6',
    cursorAccent: '#f8fafc',
    selectionBackground: 'rgba(109, 78, 230, 0.2)',
    black: '#1f2937',
    red: '#dc2626',
    green: '#059669',
    yellow: '#d97706',
    blue: '#2563eb',
    magenta: '#7c3aed',
    cyan: '#0891b2',
    white: '#e2e8f0',
    brightBlack: '#475569',
    brightRed: '#ef4444',
    brightGreen: '#10b981',
    brightYellow: '#f59e0b',
    brightBlue: '#3b82f6',
    brightMagenta: '#8b5cf6',
    brightCyan: '#06b6d4',
    brightWhite: '#f8fafc',
  }
}

function formatForTerminal(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n')
}

function renderValue() {
  if (props.interactive) {
    return
  }
  if (!terminal) {
    return
  }
  terminal.reset()
  terminal.options.cursorBlink = !props.readonly
  if (!internalValue.value) {
    if (props.placeholder) {
      terminal.write(`\x1b[90m${props.placeholder}\x1b[0m`)
    }
    return
  }
  terminal.write(formatForTerminal(internalValue.value))
  terminal.scrollToBottom()
}

function emitValue(nextValue: string) {
  if (props.interactive) {
    return
  }
  if (nextValue === internalValue.value) {
    return
  }
  internalValue.value = nextValue
  emit('update:modelValue', nextValue)
  renderValue()
}

function handleInput(data: string) {
  if (props.readonly) {
    return
  }
  if (!data) {
    return
  }

  if (props.interactive) {
    if (data === '\u0004') {
      emit('eof')
      terminal?.write('^D')
      terminal?.write('\r\n')
      inputLineBuffer = ''
      return
    }
    if (data === '\u000c') {
      clear()
      return
    }
    if (data === '\u007f') {
      if (!inputLineBuffer) {
        return
      }
      inputLineBuffer = inputLineBuffer.slice(0, -1)
      terminal?.write('\b \b')
      return
    }
    if (data === '\r') {
      emit('input', `${inputLineBuffer}\n`)
      inputLineBuffer = ''
      terminal?.write('\r\n')
      return
    }
    if (data.includes('\x1b')) {
      return
    }
    const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    inputLineBuffer += normalized
    terminal?.write(normalized)
    return
  }

  if (data === '\u000c') {
    emitValue('')
    return
  }
  if (data === '\u007f') {
    if (!internalValue.value) {
      return
    }
    emitValue(internalValue.value.slice(0, -1))
    return
  }
  if (data === '\r') {
    emitValue(`${internalValue.value}\n`)
    return
  }

  if (data.includes('\x1b')) {
    return
  }

  const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  emitValue(`${internalValue.value}${normalized}`)
}

function applyTheme() {
  if (!terminal) {
    return
  }
  terminal.options.theme = resolveTerminalTheme()
}

function fitTerminal() {
  if (!fitAddon) {
    return
  }
  nextTick(() => {
    fitAddon?.fit()
  })
}

onMounted(() => {
  if (!viewportRef.value) {
    return
  }

  terminal = new Terminal({
    convertEol: true,
    cursorBlink: !props.readonly,
    fontFamily: 'var(--oj-mono)',
    fontSize: 12,
    lineHeight: 1.55,
    scrollback: 2000,
    disableStdin: props.readonly,
    allowProposedApi: false,
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(viewportRef.value)
  applyTheme()
  fitTerminal()
  if (props.interactive) {
    if (props.placeholder) {
      terminal.write(`\x1b[90m${props.placeholder}\x1b[0m`)
      terminal.write('\r\n')
    }
  } else {
    renderValue()
  }

  disposeDataHandler = terminal.onData(handleInput)

  themeObserver = new MutationObserver(() => {
    applyTheme()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  })

  resizeObserver = new ResizeObserver(() => {
    fitTerminal()
  })
  if (rootRef.value) {
    resizeObserver.observe(rootRef.value)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (props.interactive) {
      return
    }
    const nextValue = value ?? ''
    if (nextValue === internalValue.value) {
      return
    }
    internalValue.value = nextValue
    renderValue()
  },
)

watch(
  () => props.readonly,
  () => {
    if (!terminal) {
      return
    }
    terminal.options.disableStdin = props.readonly
    terminal.options.cursorBlink = !props.readonly
    renderValue()
  },
)

function clear() {
  if (props.interactive) {
    inputLineBuffer = ''
    terminal?.clear()
    return
  }
  emitValue('')
}

function focus() {
  terminal?.focus()
}

function write(value: string) {
  if (!terminal || !value) {
    return
  }
  terminal.write(value)
}

function writeln(value: string) {
  if (!terminal) {
    return
  }
  if (value) {
    terminal.write(value)
  }
  terminal.write('\r\n')
}

defineExpose({
  clear,
  focus,
  write,
  writeln,
})

onBeforeUnmount(() => {
  disposeDataHandler?.dispose()
  disposeDataHandler = null
  resizeObserver?.disconnect()
  resizeObserver = null
  themeObserver?.disconnect()
  themeObserver = null
  terminal?.dispose()
  terminal = null
  fitAddon = null
})
</script>

<template>
  <section ref="rootRef" class="oj-terminal">
    <header class="oj-terminal__head">
      <div class="oj-terminal__dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="oj-terminal__title">{{ title }}</span>
      <span class="oj-terminal__mode">{{ readonly ? '只读' : '交互' }}</span>
    </header>
    <div class="oj-terminal__body" :style="terminalBodyStyle">
      <div ref="viewportRef" class="oj-terminal__viewport"></div>
    </div>
  </section>
</template>

<style scoped>
.oj-terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--oj-border) 90%, rgba(15, 23, 42, 0.22));
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

:root[data-theme='dark'] .oj-terminal {
  border-color: rgba(148, 163, 184, 0.34);
  background: #0b1020;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.oj-terminal__head {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--oj-border) 86%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--oj-panel-soft) 90%, #fff 10%), color-mix(in srgb, var(--oj-panel) 92%, #fff 8%));
  padding: 8px 10px;
}

:root[data-theme='dark'] .oj-terminal__head {
  border-bottom-color: rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, #131a30, #0f172a);
}

.oj-terminal__dots {
  display: inline-flex;
  gap: 5px;
}

.oj-terminal__dots span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.oj-terminal__dots span:nth-child(1) {
  background: #ff5f57;
}

.oj-terminal__dots span:nth-child(2) {
  background: #febc2e;
}

.oj-terminal__dots span:nth-child(3) {
  background: #28c840;
}

.oj-terminal__title {
  margin-right: auto;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #475569;
}

:root[data-theme='dark'] .oj-terminal__title {
  color: #cbd5e1;
}

.oj-terminal__mode {
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--oj-border) 85%, transparent);
  background: color-mix(in srgb, var(--oj-panel-soft) 90%, #fff 10%);
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

:root[data-theme='dark'] .oj-terminal__mode {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.85);
  color: #94a3b8;
}

.oj-terminal__body {
  flex: 1 1 auto;
  min-height: 0;
  min-height: var(--oj-terminal-min-height);
}

.oj-terminal__viewport {
  width: 100%;
  height: 100%;
}

.oj-terminal :deep(.xterm) {
  box-sizing: border-box;
  padding: 8px 10px;
  height: 100%;
}

.oj-terminal :deep(.xterm-viewport) {
  scrollbar-width: thin;
  scrollbar-color: var(--oj-scrollbar-thumb) transparent;
}

.oj-terminal :deep(.xterm-viewport::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

.oj-terminal :deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: transparent;
}

.oj-terminal :deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
  background-color: var(--oj-scrollbar-thumb);
}
</style>
