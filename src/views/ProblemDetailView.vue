<script setup lang="ts">
import axios from 'axios'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblemDetail, type ProblemVO } from '../api/problem'
import { createRunTerminalSocket, type RunCodeResponse, type RunWsIncomingMessage } from '../api/run'
import { createSubmission } from '../api/submission'
import CodeEditor from '../components/CodeEditor.vue'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTerminal from '../components/ui/OjTerminal.vue'
import { ojMessage } from '../utils/message'

type Language = 'cpp' | 'c' | 'python' | 'java'
type BadgeTone = 'success' | 'ac' | 'warning' | 'danger' | 'tle' | 'neutral'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const loadError = ref('')
const problem = ref<ProblemVO | null>(null)

const language = ref<Language>('cpp')
const sourceCode = ref('')
let draftTimer: number | null = null
let detailRequestSerial = 0
const DEFAULT_RUN_TIME_LIMIT_MS = 15000
const runLoading = ref(false)
const submitLoading = ref(false)
const runTimeLimitMs = ref(DEFAULT_RUN_TIME_LIMIT_MS)
const runResult = ref<RunCodeResponse | null>(null)
const runExecutedAt = ref('')
const runErrorText = ref('')
const runStreamStatus = ref('')
const runStdoutChunks = ref('')
const runStderrChunks = ref('')
const editorShellRef = ref<HTMLElement | null>(null)
const editorTitlebarRef = ref<HTMLElement | null>(null)
const editorToolbarRef = ref<HTMLElement | null>(null)
const runPanelRef = ref<HTMLElement | null>(null)
const terminalDockRef = ref<HTMLElement | null>(null)
const editorFooterRef = ref<HTMLElement | null>(null)
const terminalRef = ref<InstanceType<typeof OjTerminal> | null>(null)
const terminalVisible = ref(false)
const terminalHeightPx = ref(160)
const terminalUserResized = ref(false)
let shellResizeObserver: ResizeObserver | null = null
let resizeStartY = 0
let resizeStartHeight = 0
let resizeShellHeight = 0
let runSocket: WebSocket | null = null

const MIN_EDITOR_BODY_HEIGHT_BASE = 84

const CODE_TEMPLATES: Record<Language, string> = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    return 0;\n}\n',
  python: '# 读取输入并输出结果\n\n',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n    }\n}\n',
}

const CODE_FILE_NAMES: Record<Language, string> = {
  cpp: 'main.cpp',
  c: 'main.c',
  python: 'main.py',
  java: 'Main.java',
}

const languageOptions: Array<{ label: string; value: Language }> = [
  { label: 'C++ 17 (G++)', value: 'cpp' },
  { label: 'C17 (GCC)', value: 'c' },
  { label: 'Python 3.14.2', value: 'python' },
  { label: 'Java 17', value: 'java' },
]
const RUN_LANGUAGE_MAP = {
  cpp: 'CPP17',
  c: 'C17',
  python: 'PYTHON3142',
  java: 'JAVA17',
} as const

const problemId = computed(() => {
  const raw = route.params.id
  if (Array.isArray(raw)) {
    return String(raw[0] ?? '').trim()
  }
  return typeof raw === 'string' ? raw.trim() : ''
})

const contestId = computed(() => {
  const raw = route.query.contestId
  if (Array.isArray(raw)) {
    return String(raw[0] ?? '').trim()
  }
  return typeof raw === 'string' ? raw.trim() : ''
})

const inContestMode = computed(() => Boolean(contestId.value))
const backButtonText = computed(() => (inContestMode.value ? '返回比赛' : '返回题库'))

const codeFileName = computed(() => CODE_FILE_NAMES[language.value])

const difficultyMeta = computed(() => {
  const value = Number(problem.value?.difficulty ?? 0)
  switch (value) {
    case 1:
      return { label: '入门', tone: 'success' as BadgeTone }
    case 2:
      return { label: '简单', tone: 'ac' as BadgeTone }
    case 3:
      return { label: '中等', tone: 'warning' as BadgeTone }
    case 4:
      return { label: '困难', tone: 'danger' as BadgeTone }
    case 5:
      return { label: '挑战', tone: 'tle' as BadgeTone }
    default:
      return { label: '未知', tone: 'neutral' as BadgeTone }
  }
})

const statusMeta = computed(() => {
  const value = Number(problem.value?.status ?? 0)
  switch (value) {
    case 0:
      return { label: '草稿', tone: 'neutral' as BadgeTone }
    case 1:
      return { label: '发布', tone: 'success' as BadgeTone }
    case 2:
      return { label: '下线', tone: 'danger' as BadgeTone }
    default:
      return { label: '未知', tone: 'neutral' as BadgeTone }
  }
})

const categoryText = computed(() => {
  const detail = problem.value
  if (!detail) {
    return '未分类'
  }
  return detail.categoryName?.trim() || detail.categoryId || '未分类'
})

const judgeModeText = computed(() => {
  const value = (problem.value?.judgeMode ?? '').toUpperCase()
  return value || 'ACM'
})

const contentBlocks = computed(() => splitToBlocks(problem.value?.content))
const inputBlocks = computed(() => splitToBlocks(problem.value?.inputDesc))
const outputBlocks = computed(() => splitToBlocks(problem.value?.outputDesc))
const hintBlocks = computed(() => splitToBlocks(problem.value?.hint))
const terminalLanguageLabel = computed(() => RUN_LANGUAGE_MAP[language.value])
const terminalContentMinHeight = computed(() => Math.max(50, terminalHeightPx.value - 46))
const terminalPanelStyle = computed(() => ({ height: terminalVisible.value ? `${terminalHeightPx.value}px` : '0px' }))
const terminalToggleButtonText = computed(() => (terminalVisible.value ? '收起终端' : '展开终端'))
const runButtonTone = computed(() => (runLoading.value ? ('secondary' as const) : ('info' as const)))
const runStatusText = computed(() => {
  if (runLoading.value) {
    return runStreamStatus.value || '运行中...'
  }
  if (runErrorText.value) {
    return `请求失败: ${runErrorText.value}`
  }
  if (runResult.value) {
    return `${runStatusMeta.value.label} · ${resolveExecuteTimeMs(runResult.value)}ms`
  }
  return '等待运行'
})
const runStatusMeta = computed(() => {
  const status = runResult.value?.status ?? ''
  switch (status) {
    case 'SUCCESS':
      return { label: '运行成功', tone: 'ac' as BadgeTone }
    case 'COMPILE_ERROR':
      return { label: '编译错误', tone: 'ce' as const }
    case 'RUNTIME_ERROR':
      return { label: '运行时错误', tone: 're' as const }
    case 'TIME_LIMIT_EXCEEDED':
      return { label: '超时', tone: 'tle' as const }
    case 'UNSUPPORTED_LANGUAGE':
      return { label: '语言不支持', tone: 'warning' as const }
    case 'SYSTEM_ERROR':
      return { label: '系统错误', tone: 'danger' as const }
    default:
      return { label: status || '未知状态', tone: 'neutral' as const }
  }
})
const terminalStatusTone = computed(() => {
  if (runErrorText.value) {
    return 'danger' as const
  }
  if (runLoading.value) {
    return 'judging' as const
  }
  if (runResult.value) {
    return runStatusMeta.value.tone
  }
  return 'neutral' as const
})

function splitToBlocks(raw: string | null | undefined) {
  const text = String(raw ?? '').trim()
  if (!text) {
    return [] as string[][]
  }
  return text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => block.split('\n'))
}

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '题目加载失败'
  }
  return error instanceof Error ? error.message : '题目加载失败'
}

function terminalWrite(value: string) {
  terminalRef.value?.write(value)
}

function terminalWriteln(value = '') {
  terminalRef.value?.writeln(value)
}

function clearTerminalScreen() {
  terminalRef.value?.clear()
}

function formatResultStatus(status?: string) {
  switch (String(status || '')) {
    case 'SUCCESS':
      return '运行成功'
    case 'COMPILE_ERROR':
      return '编译错误'
    case 'RUNTIME_ERROR':
      return '运行时错误'
    case 'TIME_LIMIT_EXCEEDED':
      return '运行超时'
    case 'UNSUPPORTED_LANGUAGE':
      return '语言不支持'
    case 'SYSTEM_ERROR':
      return '系统错误'
    default:
      return status || '未知状态'
  }
}

function resolveExecuteTimeMs(result?: RunCodeResponse | null) {
  if (!result) {
    return 0
  }
  const candidate = Number(result.executeTimeMs ?? result.timeUsedMs ?? 0)
  return Number.isFinite(candidate) && candidate >= 0 ? Math.floor(candidate) : 0
}

function draftOwnerScope() {
  const userId = localStorage.getItem('oj-user-id')?.trim()
  if (userId) {
    return `uid:${userId}`
  }
  const token = localStorage.getItem('oj-token')?.trim()
  if (token) {
    return `token:${token}`
  }
  return 'guest'
}

function draftSceneScope() {
  if (contestId.value) {
    return `contest:${contestId.value}`
  }
  return 'practice'
}

function draftKey(field: 'lang' | 'code') {
  return `oj-problem-draft:${draftOwnerScope()}:${draftSceneScope()}:${problemId.value}:${field}`
}

function saveDraft() {
  if (!problemId.value) {
    return
  }
  localStorage.setItem(draftKey('lang'), language.value)
  localStorage.setItem(draftKey('code'), sourceCode.value)
}

function scheduleSaveDraft() {
  if (draftTimer !== null) {
    window.clearTimeout(draftTimer)
  }
  draftTimer = window.setTimeout(() => {
    saveDraft()
    draftTimer = null
  }, 360)
}

function restoreDraft() {
  if (!problemId.value) {
    language.value = 'cpp'
    sourceCode.value = CODE_TEMPLATES.cpp
    return
  }

  const cachedLang = localStorage.getItem(draftKey('lang'))
  if (cachedLang && cachedLang in CODE_TEMPLATES) {
    language.value = cachedLang as Language
  } else {
    language.value = 'cpp'
  }

  const cachedCode = localStorage.getItem(draftKey('code'))
  if (cachedCode && cachedCode.length > 0) {
    sourceCode.value = cachedCode
    return
  }
  sourceCode.value = CODE_TEMPLATES[language.value]
}

function resetTemplate() {
  sourceCode.value = CODE_TEMPLATES[language.value]
  saveDraft()
}

async function handleRun() {
  if (runLoading.value) {
    return
  }

  if (!sourceCode.value.trim()) {
    ojMessage.warning('代码不能为空')
    return
  }

  const parsedLimit = Number(runTimeLimitMs.value)
  const timeLimitMs = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : undefined
  if (runTimeLimitMs.value && timeLimitMs === undefined) {
    ojMessage.warning('超时时间必须为正整数')
    return
  }

  saveDraft()
  runLoading.value = true
  runResult.value = null
  runErrorText.value = ''
  runStreamStatus.value = '连接交互终端...'
  runStdoutChunks.value = ''
  runStderrChunks.value = ''
  runExecutedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  terminalVisible.value = true
  closeRunSocket()
  clearTerminalScreen()
  terminalWriteln(`$ 语言: ${terminalLanguageLabel.value} · 超时: ${timeLimitMs ?? runTimeLimitMs.value} ms`)
  terminalWriteln('$ 终端连接中...')
  terminalWriteln('$ 提示：程序若等待输入，请直接在终端输入后回车。')

  const payload = {
    language: RUN_LANGUAGE_MAP[language.value],
    sourceCode: sourceCode.value,
    ...(timeLimitMs !== undefined ? { timeLimitMs } : {}),
  }

  try {
    const socket = createRunTerminalSocket()
    runSocket = socket

    socket.onopen = () => {
      if (socket !== runSocket) {
        return
      }
      runStreamStatus.value = '终端已连接，开始运行'
      socket.send(JSON.stringify({
        type: 'start',
        payload,
      }))
    }

    socket.onmessage = (event) => {
      if (socket !== runSocket) {
        return
      }
      let data: RunWsIncomingMessage
      try {
        data = JSON.parse(String(event.data)) as RunWsIncomingMessage
      } catch {
        return
      }
      handleRunSocketMessage(data)
    }

    socket.onerror = () => {
      if (socket !== runSocket) {
        return
      }
      if (!runLoading.value) {
        return
      }
      runErrorText.value = '终端连接异常'
      runStreamStatus.value = '终端连接异常'
      terminalWriteln('\r\n[系统] 终端连接异常。')
    }

    socket.onclose = () => {
      if (socket !== runSocket) {
        return
      }
      runSocket = null
      if (runLoading.value && !runResult.value && !runErrorText.value) {
        runLoading.value = false
        runStreamStatus.value = '终端已断开'
        terminalWriteln('\r\n[系统] 终端已断开。')
      }
    }
  } catch (error) {
    const message = resolveErrorMessage(error)
    runErrorText.value = message
    runStreamStatus.value = '启动失败'
    runLoading.value = false
    ojMessage.error(message)
  }
}

function formatSubmissionStatus(status: string | undefined) {
  switch (String(status || '').toUpperCase()) {
    case 'WAITING':
      return '排队中'
    case 'JUDGING':
      return '判题中'
    case 'ACCEPTED':
      return '通过'
    case 'PARTIAL_ACCEPTED':
      return '部分通过'
    case 'WRONG_ANSWER':
      return '答案错误'
    case 'COMPILE_ERROR':
      return '编译错误'
    case 'RUNTIME_ERROR':
      return '运行时错误'
    case 'TIME_LIMIT_EXCEEDED':
      return '超时'
    case 'SYSTEM_ERROR':
      return '系统错误'
    default:
      return status || '未知状态'
  }
}

async function handleSubmit() {
  if (submitLoading.value || runLoading.value) {
    return
  }

  const id = problemId.value
  if (!id) {
    ojMessage.warning('题目ID无效，无法提交')
    return
  }
  if (!sourceCode.value.trim()) {
    ojMessage.warning('代码不能为空')
    return
  }

  saveDraft()
  submitLoading.value = true
  try {
    const response = await createSubmission({
      problemId: id,
      contestId: contestId.value || undefined,
      language: RUN_LANGUAGE_MAP[language.value],
      sourceCode: sourceCode.value,
    })
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '提交失败')
    }

    const submissionId = String(response.data.submissionId ?? '').trim()
    const statusText = formatSubmissionStatus(response.data.status)
    if (submissionId) {
      ojMessage.success(`提交成功 #${submissionId} · ${statusText}`)
    } else {
      ojMessage.success(`提交成功 · ${statusText}`)
    }
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    submitLoading.value = false
  }
}

function closeRunSocket() {
  const closingSocket = runSocket
  if (!closingSocket) {
    return
  }
  runSocket = null
  try {
    if (closingSocket.readyState === WebSocket.OPEN) {
      closingSocket.send(JSON.stringify({ type: 'stop' }))
    }
  } catch {
    // ignore
  }
  try {
    closingSocket.close()
  } catch {
    // ignore
  }
}

function handleRunSocketMessage(message: RunWsIncomingMessage) {
  switch (message.type) {
    case 'status': {
      const statusText = String(message.statusText || '')
      if (statusText) {
        runStreamStatus.value = statusText
      }
      break
    }
    case 'stdout': {
      const chunk = String(message.chunk || '')
      if (!chunk) {
        break
      }
      runStdoutChunks.value += chunk
      terminalWrite(chunk)
      break
    }
    case 'stderr': {
      const chunk = String(message.chunk || '')
      if (!chunk) {
        break
      }
      runStderrChunks.value += chunk
      terminalWrite(`\x1b[31m${chunk}\x1b[0m`)
      break
    }
    case 'result': {
      const result = message.data
      if (result && typeof result === 'object') {
        runResult.value = result as RunCodeResponse
      }
      runLoading.value = false
      const final = runResult.value
      const finalStatus = final?.status || 'UNKNOWN'
      runStreamStatus.value = formatResultStatus(finalStatus)
      terminalWriteln('')
      terminalWriteln(`[结果] 状态: ${formatResultStatus(finalStatus)} (${finalStatus})`)
      terminalWriteln(`[结果] 退出码: ${final?.exitCode ?? '-'}`)
      terminalWriteln(
        `[耗时] 编译: ${final?.compileTimeMs ?? 0} ms · 执行: ${resolveExecuteTimeMs(final)} ms · 总耗时: ${final?.totalTimeMs ?? resolveExecuteTimeMs(final)} ms`,
      )
      if (!(final?.stdout || '').trim() && !(final?.stderr || '').trim()) {
        terminalWriteln('[结果] 程序无输出。若代码依赖输入，请先在终端输入数据后回车。')
      }
      terminalWriteln('[系统] 运行结束。')
      break
    }
    case 'error': {
      const errorMessage = String(message.message || '运行失败')
      runErrorText.value = errorMessage
      runLoading.value = false
      runStreamStatus.value = '运行失败'
      terminalWriteln(`\r\n[系统] ${errorMessage}`)
      ojMessage.error(errorMessage)
      break
    }
    default:
      break
  }
}

function handleTerminalInput(value: string) {
  if (!runLoading.value || !runSocket || runSocket.readyState !== WebSocket.OPEN) {
    return
  }
  runSocket.send(JSON.stringify({
    type: 'stdin',
    data: value,
  }))
}

function toggleTerminalVisible() {
  terminalVisible.value = !terminalVisible.value
  if (terminalVisible.value) {
    nextTick(() => {
      applyDefaultTerminalHeight(false)
    })
  }
  terminalRef.value?.focus()
}

function handleStopRun() {
  if (!runLoading.value) {
    return
  }
  closeRunSocket()
  runLoading.value = false
  runStreamStatus.value = '已手动中断'
  terminalWriteln('\r\n[系统] 已中断运行。')
}

function applyDefaultTerminalHeight(force: boolean) {
  if (!editorShellRef.value) {
    return
  }
  if (!force && terminalUserResized.value && terminalHeightPx.value > 0) {
    return
  }
  const bounds = getTerminalHeightBounds(editorShellRef.value.clientHeight)
  if (!bounds) {
    return
  }
  const { minHeight, maxHeight, shellHeight } = bounds
  const preferred = Math.round(shellHeight * 0.2)
  terminalHeightPx.value = Math.max(minHeight, Math.min(maxHeight, preferred))
}

function handleTerminalResizeStart(event: PointerEvent) {
  if (!terminalVisible.value || !editorShellRef.value) {
    return
  }
  event.preventDefault()
  resizeStartY = event.clientY
  resizeStartHeight = terminalHeightPx.value
  resizeShellHeight = editorShellRef.value.clientHeight
  window.addEventListener('pointermove', handleTerminalResizing)
  window.addEventListener('pointerup', stopTerminalResize)
  document.body.style.userSelect = 'none'
}

function handleTerminalResizing(event: PointerEvent) {
  if (!editorShellRef.value) {
    return
  }
  const delta = resizeStartY - event.clientY
  const bounds = getTerminalHeightBounds(resizeShellHeight || editorShellRef.value.clientHeight)
  if (!bounds) {
    return
  }
  const { minHeight, maxHeight } = bounds
  terminalHeightPx.value = Math.max(minHeight, Math.min(maxHeight, resizeStartHeight + delta))
  terminalUserResized.value = true
}

function stopTerminalResize() {
  window.removeEventListener('pointermove', handleTerminalResizing)
  window.removeEventListener('pointerup', stopTerminalResize)
  document.body.style.userSelect = ''
  resizeShellHeight = 0
}

function getTerminalHeightBounds(shellHeightOverride?: number) {
  const shell = editorShellRef.value
  if (!shell) {
    return null
  }
  const shellHeight = shellHeightOverride || shell.clientHeight
  if (!shellHeight) {
    return null
  }

  const titlebarHeight = editorTitlebarRef.value?.offsetHeight ?? 0
  const toolbarHeight = editorToolbarRef.value?.offsetHeight ?? 0
  const footerHeight = editorFooterRef.value?.offsetHeight ?? 0

  const runPanelHeight = runPanelRef.value?.offsetHeight ?? 0
  const terminalDockHeight = terminalDockRef.value?.offsetHeight ?? 0
  const runPanelFixedHeight = Math.max(0, runPanelHeight - terminalDockHeight)
  const minEditorBodyHeight = Math.max(
    72,
    Math.min(
      140,
      Math.floor(shellHeight * 0.12),
    ),
    MIN_EDITOR_BODY_HEIGHT_BASE,
  )

  const minHeight = 96
  const maxByLayout = shellHeight - titlebarHeight - toolbarHeight - footerHeight - runPanelFixedHeight - minEditorBodyHeight
  const maxByRatio = Math.floor(shellHeight * 0.94)
  const maxHeight = Math.max(minHeight, Math.min(maxByLayout, maxByRatio))

  return {
    shellHeight,
    minHeight,
    maxHeight,
  }
}

function goBackToList() {
  if (contestId.value) {
    void router.push({ name: 'contest-detail', params: { id: contestId.value } })
    return
  }
  void router.push('/problems')
}

async function loadProblemDetail() {
  const requestSerial = ++detailRequestSerial
  const id = problemId.value
  if (!id) {
    loadError.value = '缺少题目 ID，无法加载详情'
    problem.value = null
    return
  }

  loading.value = true
  loadError.value = ''
  problem.value = null

  try {
    const response = await getProblemDetail(id)
    if (requestSerial !== detailRequestSerial) {
      return
    }
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '题目加载失败')
    }
    problem.value = response.data
    const problemTimeLimit = Number(response.data.timeLimit)
    runTimeLimitMs.value =
      Number.isFinite(problemTimeLimit) && problemTimeLimit > 0
        ? Math.max(Math.floor(problemTimeLimit), DEFAULT_RUN_TIME_LIMIT_MS)
        : DEFAULT_RUN_TIME_LIMIT_MS
    restoreDraft()
  } catch (error) {
    if (requestSerial !== detailRequestSerial) {
      return
    }
    loadError.value = resolveErrorMessage(error)
    problem.value = null
  } finally {
    if (requestSerial === detailRequestSerial) {
      loading.value = false
    }
  }
}

watch(problemId, () => {
  void loadProblemDetail()
}, { immediate: true })

watch(language, () => {
  if (!sourceCode.value.trim()) {
    sourceCode.value = CODE_TEMPLATES[language.value]
  }
  scheduleSaveDraft()
})

watch(sourceCode, () => {
  scheduleSaveDraft()
})

onBeforeUnmount(() => {
  closeRunSocket()
  stopTerminalResize()
  shellResizeObserver?.disconnect()
  shellResizeObserver = null
  if (draftTimer !== null) {
    window.clearTimeout(draftTimer)
    draftTimer = null
  }
})

onMounted(() => {
  if (!editorShellRef.value) {
    return
  }
  applyDefaultTerminalHeight(true)
  shellResizeObserver = new ResizeObserver(() => {
    applyDefaultTerminalHeight(false)
  })
  shellResizeObserver.observe(editorShellRef.value)
})
</script>

<template>
  <section class="oj-page">
    <div v-if="loading" class="problem-detail-state" role="status">加载中...</div>

    <div v-else-if="loadError" class="problem-detail-error">
      <p>{{ loadError }}</p>
      <div class="problem-detail-error-actions">
        <OjButton tone="info" size="small" @click="loadProblemDetail">重试</OjButton>
        <OjButton tone="secondary" size="small" @click="goBackToList">{{ backButtonText }}</OjButton>
      </div>
    </div>

    <template v-else-if="problem">
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          @click="goBackToList"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ backButtonText }}
        </button>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,42%)_minmax(0,58%)] 2xl:grid-cols-[minmax(0,40%)_minmax(0,60%)] xl:items-stretch">
        <div class="min-h-0 min-w-0 space-y-4 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.65rem]">{{ problem.title || '未命名题目' }}</h1>
            <div class="mt-3 flex flex-wrap gap-2">
              <OjBadge size="small" :tone="difficultyMeta.tone">{{ difficultyMeta.label }}</OjBadge>
              <OjBadge size="small" tone="primary">{{ categoryText }}</OjBadge>
              <OjBadge size="small" tone="neutral">{{ judgeModeText }}</OjBadge>
              <OjBadge size="small" :tone="statusMeta.tone">{{ statusMeta.label }}</OjBadge>
              <OjBadge v-if="inContestMode" size="small" tone="warning">比赛模式 #{{ contestId }}</OjBadge>
            </div>
          </div>

          <section class="problem-detail-card">
            <h2 class="problem-detail-section-title">题目描述</h2>
            <div v-if="contentBlocks.length === 0" class="problem-detail-empty">—</div>
            <div v-else class="problem-detail-text">
              <p v-for="(block, blockIndex) in contentBlocks" :key="`content-${blockIndex}`" class="mb-3 last:mb-0">
                <template v-for="(line, lineIndex) in block" :key="`content-${blockIndex}-${lineIndex}`">
                  {{ line }}
                  <br v-if="lineIndex < block.length - 1" />
                </template>
              </p>
            </div>
          </section>

          <section class="problem-detail-card">
            <h2 class="problem-detail-section-title">输入格式</h2>
            <div v-if="inputBlocks.length === 0" class="problem-detail-empty">—</div>
            <div v-else class="problem-detail-text">
              <p v-for="(block, blockIndex) in inputBlocks" :key="`input-${blockIndex}`" class="mb-3 last:mb-0">
                <template v-for="(line, lineIndex) in block" :key="`input-${blockIndex}-${lineIndex}`">
                  {{ line }}
                  <br v-if="lineIndex < block.length - 1" />
                </template>
              </p>
            </div>
          </section>

          <section class="problem-detail-card">
            <h2 class="problem-detail-section-title">输出格式</h2>
            <div v-if="outputBlocks.length === 0" class="problem-detail-empty">—</div>
            <div v-else class="problem-detail-text">
              <p v-for="(block, blockIndex) in outputBlocks" :key="`output-${blockIndex}`" class="mb-3 last:mb-0">
                <template v-for="(line, lineIndex) in block" :key="`output-${blockIndex}-${lineIndex}`">
                  {{ line }}
                  <br v-if="lineIndex < block.length - 1" />
                </template>
              </p>
            </div>
          </section>

          <section class="problem-detail-card">
            <h2 class="problem-detail-section-title">样例</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">输入</div>
                <pre class="problem-detail-sample">{{ problem.sampleInput || '' }}</pre>
              </div>
              <div>
                <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">输出</div>
                <pre class="problem-detail-sample">{{ problem.sampleOutput || '' }}</pre>
              </div>
            </div>
          </section>

          <section v-if="hintBlocks.length > 0" class="problem-detail-card">
            <h2 class="problem-detail-section-title">提示</h2>
            <div class="problem-detail-text">
              <p v-for="(block, blockIndex) in hintBlocks" :key="`hint-${blockIndex}`" class="mb-3 last:mb-0">
                <template v-for="(line, lineIndex) in block" :key="`hint-${blockIndex}-${lineIndex}`">
                  {{ line }}
                  <br v-if="lineIndex < block.length - 1" />
                </template>
              </p>
            </div>
          </section>
        </div>

        <div class="flex min-h-0 min-w-0 flex-col xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)] xl:max-h-[calc(100vh-7rem)]">
          <section ref="editorShellRef" class="problem-editor-shell" aria-label="代码编辑">
            <div ref="editorTitlebarRef" class="problem-editor-titlebar">
              <div class="flex items-center gap-1.5 pr-2" aria-hidden="true">
                <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-[#febc2e]"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-[#28c840]"></span>
              </div>
              <span class="problem-editor-file">
                <svg class="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-[#858585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span class="truncate">{{ codeFileName }}</span>
              </span>
              <span class="text-xs text-slate-500 dark:text-[#858585]">编辑器</span>
            </div>

            <div ref="editorToolbarRef" class="problem-editor-toolbar">
              <div class="problem-detail-lang-select">
                <OjSelect
                  v-model="language"
                  :options="languageOptions"
                  popper-class="oj-select-dropdown problem-detail-lang-dropdown"
                />
              </div>
              <OjButton tone="secondary" size="small" @click="resetTemplate">重置模板</OjButton>
            </div>

            <div class="problem-editor-body">
              <CodeEditor
                v-model="sourceCode"
                :language="language"
                theme="auto"
                :min-height="320"
                borderless
              />
            </div>

            <div ref="runPanelRef" class="problem-run-panel">
              <div class="problem-run-panel-head">
                <span class="problem-run-panel-title">运行配置</span>
                <div class="problem-run-panel-actions">
                  <span class="problem-run-lang">语言: {{ terminalLanguageLabel }}</span>
                  <label class="problem-run-time-limit">
                    超时(ms)
                    <input v-model.number="runTimeLimitMs" type="number" min="1" step="1" />
                  </label>
                  <OjButton size="small" tone="secondary" @click="toggleTerminalVisible">
                    <span class="inline-flex items-center gap-1">
                      <svg
                        class="h-3.5 w-3.5 transition-transform duration-200"
                        :class="{ '-rotate-180': !terminalVisible }"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      {{ terminalToggleButtonText }}
                    </span>
                  </OjButton>
                  <OjButton size="small" tone="danger" :disabled="!runLoading" @click="handleStopRun">中断运行</OjButton>
                </div>
              </div>
              <div class="problem-run-panel-meta">
                <span v-if="runExecutedAt">上次运行: {{ runExecutedAt }}</span>
                <OjBadge size="small" :tone="terminalStatusTone">
                  {{ runStatusText }}
                </OjBadge>
              </div>
              <div class="problem-run-terminals">
                <div
                  ref="terminalDockRef"
                  class="problem-terminal-dock"
                  :class="{ 'is-hidden': !terminalVisible }"
                  :style="terminalPanelStyle"
                >
                  <button
                    type="button"
                    class="problem-terminal-resize-handle"
                    aria-label="调整终端高度"
                    @pointerdown="handleTerminalResizeStart"
                  >
                    <span class="problem-terminal-resize-bar"></span>
                  </button>
                  <OjTerminal
                    ref="terminalRef"
                    title="交互终端"
                    interactive
                    :readonly="false"
                    :min-height="terminalContentMinHeight"
                    placeholder="运行后可直接输入，回车发送到程序标准输入"
                    @input="handleTerminalInput"
                  />
                </div>
              </div>
            </div>

            <div ref="editorFooterRef" class="problem-editor-footer">
              <span v-if="inContestMode" class="problem-submit-context">当前提交将计入比赛 #{{ contestId }}</span>
              <OjButton :tone="runButtonTone" size="small" :loading="runLoading" @click="handleRun">自测运行</OjButton>
              <OjButton tone="primary" size="small" :loading="submitLoading" :disabled="runLoading" @click="handleSubmit">提交评测</OjButton>
            </div>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.problem-detail-state {
  display: flex;
  min-height: 12rem;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px dashed color-mix(in srgb, var(--oj-border) 95%, transparent);
  background: color-mix(in srgb, var(--oj-panel) 70%, transparent);
  color: var(--oj-muted);
  font-size: 14px;
}

.problem-detail-error {
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--oj-danger) 35%, transparent);
  background: color-mix(in srgb, var(--oj-danger) 8%, var(--oj-panel));
  padding: 14px;
  color: color-mix(in srgb, var(--oj-danger) 75%, var(--oj-ink-soft));
}

.problem-detail-error-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.problem-detail-card {
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--oj-border) 94%, transparent);
  background: var(--oj-panel);
  padding: 16px;
  box-shadow: var(--oj-shadow);
}

.problem-detail-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--oj-muted);
}

.problem-detail-text {
  color: var(--oj-ink-soft);
  font-size: 15px;
  line-height: 1.75;
  word-break: break-word;
}

.problem-detail-empty {
  color: var(--oj-muted);
}

.problem-detail-sample {
  max-height: 10rem;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--oj-border) 92%, transparent);
  background: color-mix(in srgb, var(--oj-panel-soft) 85%, var(--oj-panel));
  padding: 10px;
  font-family: var(--oj-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--oj-ink-soft);
}

.problem-editor-shell {
  position: relative;
  display: flex;
  min-height: 0;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  isolation: isolate;
  border-radius: 12px;
  border: 1px solid #d4d4d8;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

:root[data-theme='dark'] .problem-editor-shell {
  border-color: rgba(255, 255, 255, 0.12);
  background: #1e1e1e;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45);
}

.problem-editor-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 8px 12px;
}

:root[data-theme='dark'] .problem-editor-titlebar {
  border-bottom-color: rgba(0, 0, 0, 0.25);
  background: #252526;
}

.problem-editor-file {
  display: inline-flex;
  min-width: 0;
  max-width: 55%;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 4px 10px;
  font-family: var(--oj-mono);
  font-size: 12px;
  font-weight: 500;
  color: #334155;
}

:root[data-theme='dark'] .problem-editor-file {
  border-color: #3e3e42;
  background: #1e1e1e;
  color: #cccccc;
}

.problem-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #f1f5f9;
  padding: 8px 12px;
}

:root[data-theme='dark'] .problem-editor-toolbar {
  border-bottom-color: rgba(0, 0, 0, 0.25);
  background: #2d2d2d;
}

.problem-detail-lang-select {
  width: 170px;
}

.problem-detail-lang-select :deep(.oj-select .el-select__wrapper) {
  min-height: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
}

.problem-detail-lang-select :deep(.oj-select .el-select__selected-item) {
  font-size: 12px;
}

.problem-editor-body {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  border-bottom: 1px solid #e2e8f0;
  background: #fafafa;
}

.problem-editor-body::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 1;
  width: 8px;
  background: linear-gradient(to right, rgba(109, 78, 230, 0.2), transparent);
  pointer-events: none;
}

:root[data-theme='dark'] .problem-editor-body {
  border-bottom-color: rgba(0, 0, 0, 0.25);
  background: #1e1e1e;
}

:root[data-theme='dark'] .problem-editor-body::before {
  background: linear-gradient(to right, rgba(124, 92, 255, 0.25), transparent);
}

.problem-editor-body :deep(.editor-container) {
  width: 100%;
}

.problem-editor-footer {
  position: relative;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 10px 12px;
}

.problem-submit-context {
  margin-right: auto;
  align-self: center;
  font-size: 12px;
  color: #64748b;
}

:root[data-theme='dark'] .problem-editor-footer {
  border-top-color: rgba(0, 0, 0, 0.3);
  background: #252526;
}

:root[data-theme='dark'] .problem-submit-context {
  color: #94a3b8;
}

.problem-run-panel {
  position: relative;
  z-index: 4;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 10px 12px;
}

:root[data-theme='dark'] .problem-run-panel {
  border-top-color: rgba(0, 0, 0, 0.25);
  background: #252526;
}

.problem-run-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.problem-run-panel-actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.problem-run-lang {
  font-size: 12px;
  color: #64748b;
  font-family: var(--oj-mono);
}

:root[data-theme='dark'] .problem-run-lang {
  color: #94a3b8;
}

.problem-run-panel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  font-family: var(--oj-mono);
}

:root[data-theme='dark'] .problem-run-panel-meta {
  color: #94a3b8;
}

.problem-run-panel-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

:root[data-theme='dark'] .problem-run-panel-title {
  color: #94a3b8;
}

.problem-run-time-limit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

:root[data-theme='dark'] .problem-run-time-limit {
  color: #94a3b8;
}

.problem-run-time-limit input {
  width: 94px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  padding: 6px 8px;
  outline: none;
}

.problem-run-time-limit input:focus {
  border-color: color-mix(in srgb, var(--oj-primary) 52%, #ffffff);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--oj-primary) 16%, transparent);
}

:root[data-theme='dark'] .problem-run-time-limit input {
  border-color: #3e3e42;
  background: #1e1e1e;
  color: #e5e7eb;
}

.problem-run-terminals {
  margin-top: 0;
  overflow: hidden;
}

.problem-terminal-dock {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: height, transform, opacity;
  transition:
    height 180ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 1;
  transform: translateY(0);
}

.problem-terminal-dock.is-hidden {
  opacity: 0;
  transform: translateY(calc(100% + 12px));
  pointer-events: none;
}

.problem-terminal-resize-handle {
  width: 100%;
  height: 8px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  cursor: ns-resize;
  padding: 0;
}

.problem-terminal-resize-bar {
  width: 42px;
  height: 3px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--oj-muted) 50%, transparent);
  transition: background-color 140ms ease;
}

.problem-terminal-resize-handle:hover .problem-terminal-resize-bar {
  background: color-mix(in srgb, var(--oj-primary) 44%, var(--oj-muted) 56%);
}
</style>
