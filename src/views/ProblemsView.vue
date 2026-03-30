<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProblemPage, type ProblemPageQueryRequest, type ProblemVO } from '../api/problem'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'

type FilterForm = {
  title: string
  categoryId: string
  difficulty: string
  status: string
}

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const records = ref<ProblemVO[]>([])

const pageState = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
})

const filterForm = reactive<FilterForm>({
  title: '',
  categoryId: '',
  difficulty: '',
  status: '',
})

const categoryOptions = [
  { label: '全部分类', value: '' },
  { label: '入门', value: '1' },
  { label: '动态规划', value: '2' },
  { label: '图论', value: '3' },
  { label: '数据结构', value: '4' },
  { label: '数学', value: '5' },
  { label: '字符串', value: '6' },
] as const

const difficultyOptions = [
  { label: '全部难度', value: '' },
  { label: '入门', value: '1' },
  { label: '简单', value: '2' },
  { label: '中等', value: '3' },
  { label: '困难', value: '4' },
  { label: '挑战', value: '5' },
] as const

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '草稿', value: '0' },
  { label: '发布', value: '1' },
  { label: '下线', value: '2' },
] as const

const categoryNameMap: Record<number, string> = {
  1: '入门',
  2: '动态规划',
  3: '图论',
  4: '数据结构',
  5: '数学',
  6: '字符串',
}

function toOptionalNumber(value: string) {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return undefined
  }
  return parsed
}

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '题库加载失败'
  }
  return error instanceof Error ? error.message : '题库加载失败'
}

function buildQuery(current = pageState.current): ProblemPageQueryRequest {
  const title = filterForm.title.trim()
  return {
    current,
    pageSize: pageState.pageSize,
    ...(title ? { title } : {}),
    ...(toOptionalNumber(filterForm.categoryId) !== undefined
      ? { categoryId: toOptionalNumber(filterForm.categoryId) }
      : {}),
    ...(toOptionalNumber(filterForm.difficulty) !== undefined
      ? { difficulty: toOptionalNumber(filterForm.difficulty) }
      : {}),
    ...(toOptionalNumber(filterForm.status) !== undefined
      ? { status: toOptionalNumber(filterForm.status) }
      : {}),
  }
}

async function loadProblems(current = pageState.current) {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getProblemPage(buildQuery(current))
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '题库加载失败')
    }

    records.value = Array.isArray(response.data.records) ? response.data.records : []
    pageState.current = Number(response.data.current || current)
    pageState.total = Number(response.data.total || 0)
    pageState.pageSize = Number(response.data.size || pageState.pageSize)
    pageState.pages = Number(response.data.pages || 0)
  } catch (error) {
    records.value = []
    pageState.total = 0
    pageState.pages = 0
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageState.current = 1
  void loadProblems(1)
}

function handleReset() {
  filterForm.title = ''
  filterForm.categoryId = ''
  filterForm.difficulty = ''
  filterForm.status = ''
  pageState.current = 1
  void loadProblems(1)
}

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  void loadProblems(nextPage)
}

function handlePageSizeChange(nextSize: number) {
  pageState.pageSize = nextSize
  pageState.current = 1
  void loadProblems(1)
}

function openProblem(id: number) {
  void router.push(`/problems/${id}`)
}

function categoryLabel(row: ProblemVO) {
  const fromApi = row.categoryName?.trim()
  if (fromApi) {
    return fromApi
  }
  return categoryNameMap[row.categoryId] || '未分类'
}

function creatorLabel(row: ProblemVO) {
  const realName = row.creatorRealName?.trim()
  if (realName) {
    return realName
  }
  const username = row.creatorUsername?.trim()
  if (username) {
    return username
  }
  return '未知用户'
}

function difficultyMeta(difficulty: number) {
  switch (difficulty) {
    case 1:
      return { label: '入门', tone: 'success' as const }
    case 2:
      return { label: '简单', tone: 'ac' as const }
    case 3:
      return { label: '中等', tone: 'warning' as const }
    case 4:
      return { label: '困难', tone: 'danger' as const }
    case 5:
      return { label: '挑战', tone: 'tle' as const }
    default:
      return { label: '未知', tone: 'neutral' as const }
  }
}

function statusMeta(status: number) {
  switch (status) {
    case 0:
      return { label: '草稿', tone: 'neutral' as const }
    case 1:
      return { label: '发布', tone: 'success' as const }
    case 2:
      return { label: '下线', tone: 'danger' as const }
    default:
      return { label: `状态 ${status}`, tone: 'neutral' as const }
  }
}

function normalizeRate(rate: number | null | undefined) {
  if (rate === null || rate === undefined || Number.isNaN(Number(rate))) {
    return 0
  }
  const raw = Number(rate)
  const percent = raw >= 0 && raw <= 1 ? raw * 100 : raw
  return Math.max(0, Math.min(100, percent))
}

function formatRate(rate: number | null | undefined) {
  return `${normalizeRate(rate).toFixed(1)}%`
}

function formatDateTime(raw: string | null | undefined) {
  if (!raw) {
    return '-'
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }
  const y = parsed.getFullYear()
  const m = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const d = `${parsed.getDate()}`.padStart(2, '0')
  const h = `${parsed.getHours()}`.padStart(2, '0')
  const min = `${parsed.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

onMounted(() => {
  void loadProblems(1)
})
</script>

<template>
  <section class="oj-page">
    <section class="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-card dark:border-white/[0.08] dark:bg-[#12151f]/90 dark:shadow-card-dark">
      <form class="problem-filters mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_156px_140px_140px_auto]" @submit.prevent="handleSearch">
        <OjInput
          v-model="filterForm.title"
          placeholder="搜索标题或题号关键词"
          clearable
        />

        <OjSelect
          v-model="filterForm.categoryId"
          :options="categoryOptions"
          placeholder="分类"
        />

        <OjSelect
          v-model="filterForm.difficulty"
          :options="difficultyOptions"
          placeholder="难度"
        />

        <OjSelect
          v-model="filterForm.status"
          :options="statusOptions"
          placeholder="状态"
        />

        <div class="flex items-center gap-2">
          <OjButton
            tone="info"
            size="small"
            native-type="submit"
            :loading="loading"
            :disabled="loading"
          >
            查询
          </OjButton>
          <OjButton
            tone="secondary"
            size="small"
            :disabled="loading"
            @click="handleReset"
          >
            重置
          </OjButton>
        </div>
      </form>
    </section>

    <section class="space-y-3">
      <div
        v-if="errorMessage"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      >
        {{ errorMessage }}
      </div>

      <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#12151f]">
        <div v-if="loading" class="problem-table-loading-mask" aria-live="polite" aria-busy="true">
          <div class="problem-table-loading-indicator">
            <span class="problem-table-loading-spinner" aria-hidden="true"></span>
            <span class="problem-table-loading-text">加载题目中...</span>
          </div>
        </div>

        <el-table
          class="problem-table"
          :data="records"
          row-key="id"
          height="440"
          table-layout="fixed"
        >
          <el-table-column label="#" width="64">
            <template #default="{ $index }">
              <span class="font-mono text-xs text-slate-600 dark:text-slate-300">
                {{ (pageState.current - 1) * pageState.pageSize + $index + 1 }}
              </span>
            </template>
          </el-table-column>

        <el-table-column label="题目" show-overflow-tooltip>
          <template #default="{ row }">
            <button
              type="button"
              class="font-medium text-violet-700 underline-offset-4 transition hover:text-violet-600 hover:underline dark:text-violet-300 dark:hover:text-violet-200"
              @click="openProblem(row.id)"
            >
              {{ row.title }}
            </button>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="96" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="problem-cell-ellipsis" :title="categoryLabel(row)">
              {{ categoryLabel(row) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="难度" width="80">
          <template #default="{ row }">
            <OjBadge size="small" :tone="difficultyMeta(row.difficulty).tone">
              {{ difficultyMeta(row.difficulty).label }}
            </OjBadge>
          </template>
        </el-table-column>

        <el-table-column label="时间 / 内存" width="118">
          <template #default="{ row }">
            <span class="font-mono text-xs text-slate-500 dark:text-slate-400">
              {{ row.timeLimit }}ms / {{ row.memoryLimit }}MB
            </span>
          </template>
        </el-table-column>

        <el-table-column label="提交 / AC" width="106">
          <template #default="{ row }">
            <span class="font-mono text-xs text-slate-600 dark:text-slate-300">
              {{ row.submitCount }} / {{ row.acceptCount }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="通过率" width="118">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500"
                  :style="{ width: `${normalizeRate(row.acceptRate)}%` }"
                ></div>
              </div>
              <span class="w-12 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                {{ formatRate(row.acceptRate) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="评测" width="80">
          <template #default="{ row }">
            <span class="font-mono text-xs text-slate-500 dark:text-slate-400">
              {{ row.judgeMode || '-' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="86">
          <template #default="{ row }">
            <OjBadge size="small" :tone="statusMeta(row.status).tone">
              {{ statusMeta(row.status).label }}
            </OjBadge>
          </template>
        </el-table-column>

        <el-table-column label="创建人" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span
              class="problem-cell-ellipsis text-xs text-slate-600 dark:text-slate-300"
              :title="creatorLabel(row)"
            >
              {{ creatorLabel(row) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-slate-500 dark:text-slate-400">
              {{ formatDateTime(row.createTime) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono text-xs text-slate-500 dark:text-slate-400">
              {{ formatDateTime(row.updateTime) }}
            </span>
          </template>
        </el-table-column>

          <template #empty>
            <div v-if="!loading" class="py-10 text-sm text-slate-500 dark:text-slate-400">没有符合条件的题目</div>
          </template>
        </el-table>
      </div>

      <OjPagination
        :current="pageState.current"
        :total="pageState.total"
        :page-size="pageState.pageSize"
        :pages="pageState.pages"
        :page-sizes="[10, 20, 30, 50]"
        :show-page-size="true"
        @current-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </section>
  </section>
</template>

<style scoped>
.problem-filters :deep(.oj-input .el-input__wrapper) {
  min-height: 34px;
  border-radius: 10px;
}

.problem-filters :deep(.oj-select .el-select__wrapper) {
  min-height: 34px !important;
  height: 34px !important;
  border-radius: 10px !important;
}

.problem-table :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
}

.problem-table-loading-mask {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  background: color-mix(in srgb, var(--oj-panel) 75%, transparent);
}

.problem-table-loading-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--oj-border) 90%, transparent);
  background: color-mix(in srgb, var(--oj-panel) 94%, transparent);
  color: var(--oj-ink-soft);
  box-shadow: var(--oj-shadow);
}

.problem-table-loading-spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--oj-primary) 22%, transparent);
  border-top-color: var(--oj-primary);
  animation: problem-table-spin 0.72s linear infinite;
}

.problem-table-loading-text {
  font-size: 13px;
  font-weight: 600;
}

@keyframes problem-table-spin {
  to {
    transform: rotate(360deg);
  }
}

.problem-cell-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
