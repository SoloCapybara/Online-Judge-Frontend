<script setup lang="ts">
import axios from 'axios'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createProblem,
  getProblemCategoryList,
  getProblemDetail,
  listProblemCases,
  updateProblem,
  type ProblemCaseVO,
  type ProblemCategoryVO,
  type ProblemCreateRequest,
  type ProblemVO,
} from '../api/problem'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import { useWorkspaceTabs } from '../composables/useWorkspaceTabs'
import { ojMessage } from '../utils/message'

type ProblemEditForm = {
  title: string
  categoryId: string
  tagText: string
  content: string
  inputDesc: string
  outputDesc: string
  sampleInput: string
  sampleOutput: string
  hint: string
  difficulty: string
  timeLimit: string
  memoryLimit: string
  judgeMode: 'ACM' | 'OI'
  status: string
}

type EditableCase = {
  localKey: number
  caseNo: string
  inputData: string
  outputData: string
  score: string
  isSample: boolean
}

const route = useRoute()
const router = useRouter()
const { closeTab } = useWorkspaceTabs()

const pageLoading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const loaded = ref(false)
const caseList = ref<EditableCase[]>([])
const problemIdLabel = ref('')
const categoryOptions = ref<Array<{ label: string; value: string }>>([
  { label: '不选择分类', value: '' },
])

const form = reactive<ProblemEditForm>({
  title: '',
  categoryId: '',
  tagText: '',
  content: '',
  inputDesc: '',
  outputDesc: '',
  sampleInput: '',
  sampleOutput: '',
  hint: '',
  difficulty: '1',
  timeLimit: '1000',
  memoryLimit: '128',
  judgeMode: 'ACM',
  status: '0',
})

const difficultyOptions = [
  { label: '简单', value: '1' },
  { label: '中等', value: '2' },
  { label: '困难', value: '3' },
] as const

const judgeModeOptions = [
  { label: 'ACM', value: 'ACM' },
  { label: 'OI', value: 'OI' },
] as const

const statusOptions = [
  { label: '0 · 草稿', value: '0' },
  { label: '1 · 发布', value: '1' },
  { label: '2 · 下线', value: '2' },
] as const

let caseKeySeed = 0

const isCreateMode = computed(() => route.name === 'problem-create')
const pageTitle = computed(() => (isCreateMode.value ? '创建题目' : '编辑题目'))
const submitButtonText = computed(() => (isCreateMode.value ? '创建题目' : '保存修改'))

const problemId = computed(() => {
  const raw = route.params.id
  if (Array.isArray(raw)) {
    return String(raw[0] ?? '').trim()
  }
  return typeof raw === 'string' ? raw.trim() : ''
})

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '请求失败，请稍后重试'
  }
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

function nextCaseKey() {
  caseKeySeed += 1
  return caseKeySeed
}

function toOptionalString(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function parseTagText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,，;；\s]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

function createEditableCase(source: Partial<ProblemCaseVO> | null | undefined, index: number): EditableCase {
  const caseNo = source?.caseNo !== undefined && source.caseNo !== null ? String(source.caseNo) : String(index + 1)
  const score = source?.score !== undefined && source.score !== null ? String(source.score) : '0'
  return {
    localKey: nextCaseKey(),
    caseNo,
    inputData: source?.inputData ?? '',
    outputData: source?.outputData ?? '',
    score,
    isSample: source?.isSample === 1,
  }
}

function createEmptyCase(index: number): EditableCase {
  return createEditableCase({ caseNo: index + 1, score: 0, isSample: index === 0 ? 1 : 0 }, index)
}

function normalizeCaseList(problem: ProblemVO, cases: ProblemCaseVO[]) {
  if (cases.length > 0) {
    return cases.map((item, index) => createEditableCase(item, index))
  }
  return [
    createEditableCase(
      {
        caseNo: 1,
        inputData: problem.sampleInput ?? '',
        outputData: problem.sampleOutput ?? '',
        score: 0,
        isSample: 1,
      },
      0,
    ),
  ]
}

function fillForm(problem: ProblemVO) {
  problemIdLabel.value = String(problem.id ?? problemId.value)
  form.title = problem.title ?? ''
  form.categoryId = problem.categoryId ?? ''
  form.tagText = Array.isArray(problem.tagNames) ? problem.tagNames.join('，') : ''
  form.content = problem.content ?? ''
  form.inputDesc = problem.inputDesc ?? ''
  form.outputDesc = problem.outputDesc ?? ''
  form.sampleInput = problem.sampleInput ?? ''
  form.sampleOutput = problem.sampleOutput ?? ''
  form.hint = problem.hint ?? ''
  form.difficulty = String(problem.difficulty ?? 1)
  form.timeLimit = String(problem.timeLimit ?? 1000)
  form.memoryLimit = String(problem.memoryLimit ?? 128)
  form.judgeMode = (problem.judgeMode ?? '').toUpperCase() === 'OI' ? 'OI' : 'ACM'
  form.status = String(problem.status ?? 0)
}

function buildCategoryOptions(categories: ProblemCategoryVO[]) {
  const nextOptions: Array<{ label: string; value: string }> = [{ label: '不选择分类', value: '' }]
  categories.forEach((item) => {
    const id = String(item.id ?? '').trim()
    const name = String(item.categoryName ?? '').trim()
    if (!id || !name) {
      return
    }
    nextOptions.push({ label: name, value: id })
  })
  categoryOptions.value = nextOptions
}

async function loadCategories() {
  try {
    const response = await getProblemCategoryList(false)
    if (response.code !== 0 || !Array.isArray(response.data)) {
      throw new Error(response.message || '分类加载失败')
    }
    buildCategoryOptions(response.data)
  } catch (error) {
    categoryOptions.value = [{ label: '不选择分类', value: '' }]
    ojMessage.error(resolveErrorMessage(error))
  }
}

function resetFormForCreate() {
  problemIdLabel.value = ''
  form.title = ''
  form.categoryId = ''
  form.tagText = ''
  form.content = ''
  form.inputDesc = ''
  form.outputDesc = ''
  form.sampleInput = ''
  form.sampleOutput = ''
  form.hint = ''
  form.difficulty = '1'
  form.timeLimit = '1000'
  form.memoryLimit = '128'
  form.judgeMode = 'ACM'
  form.status = '0'
}

async function loadProblem() {
  loaded.value = false
  loadError.value = ''

  if (isCreateMode.value) {
    pageLoading.value = true
    await loadCategories()
    resetFormForCreate()
    caseList.value = [createEmptyCase(0)]
    loaded.value = true
    pageLoading.value = false
    return
  }

  const id = problemId.value
  if (!id) {
    loadError.value = '缺少题目 ID，无法加载编辑页'
    return
  }

  pageLoading.value = true
  try {
    const [detailResult, casesResult] = await Promise.allSettled([
      getProblemDetail(id),
      listProblemCases(id),
      loadCategories(),
    ])

    if (detailResult.status !== 'fulfilled') {
      throw detailResult.reason
    }

    const detailRes = detailResult.value
    if (detailRes.code !== 0 || !detailRes.data) {
      throw new Error(detailRes.message || '加载题目详情失败')
    }

    fillForm(detailRes.data)

    let cases: ProblemCaseVO[] = []
    if (casesResult.status === 'fulfilled' && casesResult.value.code === 0 && Array.isArray(casesResult.value.data)) {
      cases = casesResult.value.data
    }
    caseList.value = normalizeCaseList(detailRes.data, cases)
    loaded.value = true
  } catch (error) {
    loadError.value = resolveErrorMessage(error)
  } finally {
    pageLoading.value = false
  }
}

function goProblemList() {
  void router.push('/problems')
}

function goProblemDetail() {
  if (isCreateMode.value || !problemId.value) {
    goProblemList()
    return
  }
  void router.push(`/problems/${problemId.value}`)
}

function addCase() {
  caseList.value.push(createEmptyCase(caseList.value.length))
}

function removeCase(localKey: number) {
  if (caseList.value.length <= 1) {
    ojMessage.warning('至少保留一条测试用例')
    return
  }
  caseList.value = caseList.value.filter((item) => item.localKey !== localKey)
}

function buildPayload(): ProblemCreateRequest | null {
  const title = form.title.trim()
  const content = form.content.trim()

  if (!title) {
    ojMessage.warning('题目标题不能为空')
    return null
  }
  if (!content) {
    ojMessage.warning('题目描述不能为空')
    return null
  }

  const difficulty = Number(form.difficulty)
  const timeLimit = Number(form.timeLimit)
  const memoryLimit = Number(form.memoryLimit)
  const status = Number(form.status)

  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
    ojMessage.warning('难度仅支持 1-3')
    return null
  }
  if (!Number.isInteger(timeLimit) || timeLimit < 1) {
    ojMessage.warning('时间限制必须为正整数')
    return null
  }
  if (!Number.isInteger(memoryLimit) || memoryLimit < 1) {
    ojMessage.warning('内存限制必须为正整数')
    return null
  }
  if (!Number.isInteger(status) || status < 0 || status > 2) {
    ojMessage.warning('题目状态不合法')
    return null
  }

  if (caseList.value.length === 0) {
    ojMessage.warning('请至少保留一条测试用例')
    return null
  }

  const payloadCases: ProblemCaseVO[] = []
  for (let i = 0; i < caseList.value.length; i += 1) {
    const row = caseList.value[i]
    const inputData = row.inputData
    const outputData = row.outputData
    if (!inputData.trim() || !outputData.trim()) {
      ojMessage.warning(`第 ${i + 1} 条测试用例输入和输出不能为空`)
      return null
    }

    const caseNo = Number.parseInt(row.caseNo, 10)
    const score = Number.parseInt(row.score, 10)
    payloadCases.push({
      caseNo: Number.isInteger(caseNo) && caseNo > 0 ? caseNo : i + 1,
      inputData,
      outputData,
      score: Number.isInteger(score) && score >= 0 ? score : 0,
      isSample: row.isSample ? 1 : 0,
    })
  }

  const payload: ProblemCreateRequest = {
    title,
    tagNames: parseTagText(form.tagText),
    content,
    inputDesc: toOptionalString(form.inputDesc),
    outputDesc: toOptionalString(form.outputDesc),
    sampleInput: toOptionalString(form.sampleInput),
    sampleOutput: toOptionalString(form.sampleOutput),
    hint: toOptionalString(form.hint),
    difficulty,
    timeLimit,
    memoryLimit,
    judgeMode: form.judgeMode,
    status,
    caseList: payloadCases,
  }

  const categoryId = toOptionalString(form.categoryId)
  if (categoryId !== undefined) {
    payload.categoryId = categoryId
  }
  return payload
}

async function handleSubmit() {
  if (submitting.value || pageLoading.value) {
    return
  }

  const payload = buildPayload()
  if (!payload) {
    return
  }

  submitting.value = true
  try {
    if (isCreateMode.value) {
      const response = await createProblem(payload)
      if (response.code !== 0 || !response.data?.problemId) {
        throw new Error(response.message || '创建失败')
      }
      ojMessage.success('题目创建成功')
      closeTab(route.fullPath)
      await router.replace('/problems')
      return
    }

    const id = problemId.value
    if (!id) {
      throw new Error('缺少题目 ID，无法保存')
    }
    const response = await updateProblem(id, payload)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '保存失败')
    }
    ojMessage.success('题目更新成功')
    await loadProblem()
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    submitting.value = false
  }
}

watch(
  () => `${String(route.name ?? '')}:${problemId.value}`,
  () => {
    void loadProblem()
  },
  { immediate: true },
)
</script>

<template>
  <section class="oj-page problem-edit-page">
    <div class="mx-auto w-full max-w-3xl space-y-4 pb-12">
      <div
        v-if="pageLoading"
        class="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 text-sm text-slate-500 dark:border-white/10 dark:bg-[#12151f]/50 dark:text-slate-400"
      >
        加载题目中...
      </div>

      <div
        v-else-if="loadError"
        class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      >
        {{ loadError }}
      </div>

      <template v-else-if="loaded">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 font-medium text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            @click="goProblemList"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回题库
          </button>
          <template v-if="!isCreateMode">
            <span class="text-slate-300 dark:text-slate-600">·</span>
            <button
              type="button"
              class="font-medium text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
              @click="goProblemDetail"
            >
              查看题目
            </button>
          </template>
        </div>

        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
          <p v-if="!isCreateMode" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            题目 ID：
            <span class="font-mono text-slate-700 dark:text-slate-300">{{ problemIdLabel }}</span>
          </p>
        </div>

        <form class="problem-edit-form space-y-5" @submit.prevent="handleSubmit">
          <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark sm:p-5">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">基本信息</h2>

            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">标题 <span class="text-rose-500">*</span></label>
                <OjInput v-model="form.title" placeholder="请输入题目标题" clearable />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">分类</label>
                  <OjSelect v-model="form.categoryId" :options="categoryOptions" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">难度 <span class="text-rose-500">*</span></label>
                  <OjSelect v-model="form.difficulty" :options="difficultyOptions" />
                </div>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">标签</label>
                <OjInput v-model="form.tagText" placeholder="例如：数组，双指针，动态规划" clearable />
              </div>

              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">时间限制 (ms) <span class="text-rose-500">*</span></label>
                  <OjInput v-model="form.timeLimit" placeholder="例如 1000" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">内存限制 (MB) <span class="text-rose-500">*</span></label>
                  <OjInput v-model="form.memoryLimit" placeholder="例如 256" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">判题模式 <span class="text-rose-500">*</span></label>
                  <OjSelect v-model="form.judgeMode" :options="judgeModeOptions" />
                </div>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">题目状态 <span class="text-rose-500">*</span></label>
                <OjSelect v-model="form.status" :options="statusOptions" />
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark sm:p-5">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">题面</h2>

            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">题目描述（Markdown） <span class="text-rose-500">*</span></label>
                <OjInput v-model="form.content" type="textarea" :rows="10" class="pe-code-area" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">输入说明</label>
                <OjInput v-model="form.inputDesc" type="textarea" :rows="4" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">输出说明</label>
                <OjInput v-model="form.outputDesc" type="textarea" :rows="4" />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">样例输入</label>
                  <OjInput v-model="form.sampleInput" type="textarea" :rows="5" class="pe-code-area" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">样例输出</label>
                  <OjInput v-model="form.sampleOutput" type="textarea" :rows="5" class="pe-code-area" />
                </div>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">提示</label>
                <OjInput v-model="form.hint" type="textarea" :rows="3" />
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark sm:p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">测试用例</h2>
              <OjButton tone="secondary" size="small" @click="addCase">添加用例</OjButton>
            </div>

            <div class="space-y-4">
              <div
                v-for="(item, index) in caseList"
                :key="item.localKey"
                class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#0c0e14]/80"
              >
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">用例 {{ index + 1 }}</span>
                  <OjButton tone="danger" size="small" @click="removeCase(item.localKey)">移除</OjButton>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block text-xs text-slate-500">输入数据 <span class="text-rose-500">*</span></label>
                    <OjInput v-model="item.inputData" type="textarea" :rows="4" class="pe-code-area" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs text-slate-500">期望输出 <span class="text-rose-500">*</span></label>
                    <OjInput v-model="item.outputData" type="textarea" :rows="4" class="pe-code-area" />
                  </div>
                </div>

                <div class="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label class="mb-1 block text-xs text-slate-500">序号 caseNo</label>
                    <OjInput v-model="item.caseNo" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs text-slate-500">分值 score</label>
                    <OjInput v-model="item.score" />
                  </div>
                  <div class="flex items-end pb-1">
                    <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        v-model="item.isSample"
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/40 dark:border-white/20 dark:bg-[#12151f]"
                      />
                      <span>样例 isSample</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="flex flex-wrap items-center gap-3">
            <OjButton tone="info" native-type="submit" :loading="submitting" :disabled="pageLoading">{{ submitButtonText }}</OjButton>
            <OjButton tone="secondary" :disabled="submitting" @click="isCreateMode ? goProblemList() : goProblemDetail()">取消</OjButton>
          </div>
        </form>
      </template>
    </div>
  </section>
</template>

<style scoped>
.problem-edit-form :deep(.oj-input .el-input__wrapper),
.problem-edit-form :deep(.oj-select .el-select__wrapper) {
  min-height: 40px;
  border-radius: 10px;
}

.problem-edit-form :deep(.oj-input .el-textarea__inner) {
  border-radius: 10px;
}

.pe-code-area :deep(.el-textarea__inner) {
  font-family: var(--oj-mono);
  font-size: 12.5px;
  line-height: 1.6;
}
</style>
