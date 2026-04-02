<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  deleteProblem,
  getProblemCategoryList,
  getProblemPage,
  type ProblemCategoryVO,
  type ProblemPageQueryRequest,
  type ProblemVO,
} from '../api/problem'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjModal from '../components/ui/OjModal.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'
import { useUserStore } from '../stores/user'
import { ojMessage } from '../utils/message'

type FilterForm = {
  title: string
  categoryId: string
  difficulty: string
  status: string
}

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const errorMessage = ref('')
const records = ref<ProblemVO[]>([])
const deletingProblemIds = ref<string[]>([])
const deleteConfirmOpen = ref(false)
const deleteTargetProblem = ref<ProblemVO | null>(null)
const categoryOptions = ref<Array<{ label: string; value: string }>>([
  { label: '全部分类', value: '' },
])
const categoryNameMap = ref<Record<string, string>>({})

const canManageProblems = computed(() => userStore.role === 'teacher' || userStore.role === 'admin')

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

function toOptionalString(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
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
  const categoryId = toOptionalString(filterForm.categoryId)
  return {
    current,
    pageSize: pageState.pageSize,
    ...(title ? { title } : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
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

function buildCategoryMeta(categories: ProblemCategoryVO[]) {
  const options: Array<{ label: string; value: string }> = [{ label: '全部分类', value: '' }]
  const mapping: Record<string, string> = {}

  categories.forEach((item) => {
    const id = String(item.id ?? '').trim()
    const name = String(item.categoryName ?? '').trim()
    if (!id || !name) {
      return
    }
    options.push({ label: name, value: id })
    mapping[id] = name
  })

  categoryOptions.value = options
  categoryNameMap.value = mapping
}

async function loadCategories() {
  try {
    const onlyEnabled = !canManageProblems.value
    const response = await getProblemCategoryList(onlyEnabled)
    if (response.code !== 0 || !Array.isArray(response.data)) {
      throw new Error(response.message || '分类加载失败')
    }
    buildCategoryMeta(response.data)
  } catch (error) {
    categoryOptions.value = [{ label: '全部分类', value: '' }]
    categoryNameMap.value = {}
    ojMessage.error(resolveErrorMessage(error))
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

function openProblem(id: string) {
  void router.push(`/problems/${id}`)
}

function openProblemEdit(row: ProblemVO) {
  if (!canManageProblems.value) {
    return
  }
  void router.push({ name: 'problem-edit', params: { id: row.id } })
}

function openProblemCreate() {
  if (!canManageProblems.value) {
    return
  }
  void router.push({ name: 'problem-create' })
}

function isDeletingProblem(id: string) {
  return deletingProblemIds.value.includes(id)
}

const deletingTargetProblem = computed(() => {
  const target = deleteTargetProblem.value
  if (!target) {
    return false
  }
  return isDeletingProblem(target.id)
})

const deleteConfirmTitle = computed(() =>
  deleteTargetProblem.value?.status === 2 ? '确认彻底删除题目' : '确认下线题目',
)

const deleteConfirmDescription = computed(() => {
  const target = deleteTargetProblem.value
  if (!target) {
    return ''
  }
  if (target.status === 2) {
    return `题目「${target.title}」已是下线状态。继续删除将尝试物理删除，且不可恢复。`
  }
  return `确定将题目「${target.title}」下线吗？下线后学生将无法查看和提交。`
})

const deleteConfirmButtonText = computed(() =>
  deleteTargetProblem.value?.status === 2 ? '永久删除' : '确认下线',
)

function openDeleteProblemModal(row: ProblemVO) {
  if (!canManageProblems.value || isDeletingProblem(row.id) || loading.value) {
    return
  }
  deleteTargetProblem.value = row
  deleteConfirmOpen.value = true
}

function closeDeleteProblemModal() {
  if (deletingTargetProblem.value) {
    return
  }
  deleteConfirmOpen.value = false
  deleteTargetProblem.value = null
}

async function confirmDeleteProblem() {
  const row = deleteTargetProblem.value
  if (!row || !canManageProblems.value || isDeletingProblem(row.id)) {
    return
  }

  // Confirm click should close modal immediately; request continues in background.
  deleteConfirmOpen.value = false
  deleteTargetProblem.value = null

  deletingProblemIds.value.push(row.id)
  try {
    const response = await deleteProblem(row.id)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '删除题目失败')
    }

    const successMessage =
      response.message && response.message !== 'ok'
        ? response.message
        : row.status === 2
          ? '题目已永久删除'
          : '题目已下线'

    ojMessage.success(successMessage)
    const nextPage = records.value.length === 1 && pageState.current > 1 ? pageState.current - 1 : pageState.current
    pageState.current = nextPage
    await loadProblems(nextPage)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    deletingProblemIds.value = deletingProblemIds.value.filter((id) => id !== row.id)
  }
}

function categoryLabel(row: ProblemVO) {
  const fromApi = row.categoryName?.trim()
  if (fromApi) {
    return fromApi
  }
  return categoryNameMap.value[row.categoryId] || '未分类'
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
  void Promise.all([
    loadCategories(),
    loadProblems(1),
  ])
})
</script>

<template>
  <section class="oj-page">
    <OjTableLayout :loading="loading" loading-text="加载题目中...">
      <template #filters>
        <form class="oj-table-filter-grid grid gap-2 lg:grid-cols-[minmax(0,1fr)_156px_140px_140px_auto]" @submit.prevent="handleSearch">
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
            <OjButton
              v-if="canManageProblems"
              tone="primary"
              size="small"
              :disabled="loading"
              @click="openProblemCreate"
            >
              创建题目
            </OjButton>
          </div>
        </form>
      </template>

      <template #error>
        <div
          v-if="errorMessage"
          class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {{ errorMessage }}
        </div>
      </template>

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

          <el-table-column
            v-if="canManageProblems"
            label="操作"
            width="168"
            fixed="right"
            header-align="center"
            class-name="problem-action-col"
          >
            <template #default="{ row }">
              <div class="problem-actions">
                <OjButton
                  size="small"
                  tone="secondary"
                  style="min-width: 64px"
                  :disabled="loading || isDeletingProblem(row.id)"
                  @click="openProblemEdit(row)"
                >
                  编辑
                </OjButton>
                <OjButton
                  size="small"
                  tone="danger"
                  style="min-width: 64px"
                  :loading="isDeletingProblem(row.id)"
                  :disabled="loading"
                  @click="openDeleteProblemModal(row)"
                >
                  删除
                </OjButton>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <div v-if="!loading" class="py-10 text-sm text-slate-500 dark:text-slate-400">没有符合条件的题目</div>
          </template>
      </el-table>

      <template #pagination>
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
      </template>
    </OjTableLayout>

    <OjModal
      v-model="deleteConfirmOpen"
      :title="deleteConfirmTitle"
      :description="deleteConfirmDescription"
      max-width="30rem"
      :close-on-overlay="!deletingTargetProblem"
      :close-on-esc="!deletingTargetProblem"
      :show-close="!deletingTargetProblem"
      @close="closeDeleteProblemModal"
    >
      <template #footer>
        <div class="problem-delete-footer">
          <OjButton tone="secondary" :disabled="deletingTargetProblem" @click="closeDeleteProblemModal">取消</OjButton>
          <OjButton tone="danger" :loading="deletingTargetProblem" @click="confirmDeleteProblem">{{ deleteConfirmButtonText }}</OjButton>
        </div>
      </template>
    </OjModal>
  </section>
</template>

<style scoped>
.problem-table :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
}

.problem-table :deep(.problem-action-col .cell) {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

.problem-cell-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.problem-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.problem-delete-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
