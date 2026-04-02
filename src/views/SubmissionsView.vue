<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'
import { getSubmissionPage, type SubmissionStatus, type SubmissionVO } from '../api/submission'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'

const loading = ref(false)
const errorMessage = ref('')
const records = ref<SubmissionVO[]>([])

const pageState = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
})

const filterForm = reactive({
  status: '',
  language: '',
  problemId: '',
})

const statusOptions = [
  { label: '全部结果', value: '' },
  { label: '排队中', value: 'WAITING' },
  { label: '判题中', value: 'JUDGING' },
  { label: '通过', value: 'ACCEPTED' },
  { label: '部分通过', value: 'PARTIAL_ACCEPTED' },
  { label: '答案错误', value: 'WRONG_ANSWER' },
  { label: '编译错误', value: 'COMPILE_ERROR' },
  { label: '运行时错误', value: 'RUNTIME_ERROR' },
  { label: '超时', value: 'TIME_LIMIT_EXCEEDED' },
  { label: '系统错误', value: 'SYSTEM_ERROR' },
] as const

const languageOptions = [
  { label: '全部语言', value: '' },
  { label: 'C++17', value: 'CPP17' },
  { label: 'C17', value: 'C17' },
  { label: 'Python 3.14.2', value: 'PYTHON3142' },
  { label: 'Java 17', value: 'JAVA17' },
] as const

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '加载提交记录失败'
  }
  return error instanceof Error ? error.message : '加载提交记录失败'
}

function statusLabel(status: SubmissionStatus) {
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

function statusTone(status: SubmissionStatus) {
  switch (String(status || '').toUpperCase()) {
    case 'WAITING':
    case 'JUDGING':
      return 'judging'
    case 'ACCEPTED':
      return 'ac'
    case 'PARTIAL_ACCEPTED':
      return 'warning'
    case 'WRONG_ANSWER':
      return 'wa'
    case 'COMPILE_ERROR':
      return 'ce'
    case 'RUNTIME_ERROR':
      return 're'
    case 'TIME_LIMIT_EXCEEDED':
      return 'tle'
    case 'SYSTEM_ERROR':
      return 'danger'
    default:
      return 'neutral'
  }
}

function formatSubmitTime(value: string | undefined) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ')
}

function safeTimeLabel(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-'
  }
  return `${Number(value)} ms`
}

function problemLabel(row: SubmissionVO) {
  const title = row.problemTitle?.trim()
  if (title) {
    return title
  }
  return `#${row.problemId}`
}

function userLabel(row: SubmissionVO) {
  const realName = row.userRealName?.trim()
  if (realName) {
    return realName
  }
  const username = row.username?.trim()
  return username || '-'
}

function toOptionalProblemId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }
  return parsed
}

function buildQuery(current = pageState.current) {
  const problemId = toOptionalProblemId(filterForm.problemId)
  return {
    current,
    pageSize: pageState.pageSize,
    ...(filterForm.status ? { status: filterForm.status } : {}),
    ...(filterForm.language ? { language: filterForm.language } : {}),
    ...(problemId !== undefined ? { problemId } : {}),
  }
}

async function loadSubmissions(current = pageState.current) {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getSubmissionPage(buildQuery(current))
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '加载提交记录失败')
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

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  void loadSubmissions(nextPage)
}

function handlePageSizeChange(nextSize: number) {
  pageState.pageSize = nextSize
  pageState.current = 1
  void loadSubmissions(1)
}

function handleSearch() {
  pageState.current = 1
  void loadSubmissions(1)
}

function handleReset() {
  filterForm.status = ''
  filterForm.language = ''
  filterForm.problemId = ''
  pageState.current = 1
  void loadSubmissions(1)
}

onMounted(() => {
  void loadSubmissions(1)
})
</script>

<template>
  <section class="oj-page">
    <OjTableLayout :loading="loading" loading-text="加载提交记录中...">
      <template #filters>
        <form class="oj-table-filter-grid grid gap-2 lg:grid-cols-[136px_136px_180px_auto]" @submit.prevent="handleSearch">
          <OjSelect
            v-model="filterForm.status"
            :options="statusOptions"
            placeholder="结果"
          />

          <OjSelect
            v-model="filterForm.language"
            :options="languageOptions"
            placeholder="语言"
          />

          <OjInput
            v-model="filterForm.problemId"
            clearable
            placeholder="题目ID（如 10001）"
            @keyup.enter="handleSearch"
          />

          <div class="flex items-center gap-2">
            <OjButton size="small" tone="info" native-type="submit" :loading="loading" :disabled="loading">查询</OjButton>
            <OjButton size="small" tone="secondary" :disabled="loading" @click="handleReset">重置</OjButton>
          </div>
        </form>
      </template>

      <template #error>
        <div v-if="errorMessage" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {{ errorMessage }}
        </div>
      </template>

      <el-table class="submissions-table" :data="records" row-key="id" height="440" table-layout="fixed">
        <el-table-column prop="id" label="提交号" width="130" />
        <el-table-column label="用户" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="submission-cell-ellipsis" :title="userLabel(row)">
              {{ userLabel(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="题目">
          <template #default="{ row }">
            {{ problemLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="language" label="语言" width="130" />
        <el-table-column label="结果" width="190">
          <template #default="{ row }">
            <OjBadge size="small" :tone="statusTone(row.status)">
              {{ statusLabel(row.status) }}
            </OjBadge>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="100" />
        <el-table-column label="耗时" width="120">
          <template #default="{ row }">
            {{ safeTimeLabel(row.timeUsed) }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatSubmitTime(row.submitTime) }}
          </template>
        </el-table-column>
      </el-table>

      <template #pagination>
        <OjPagination
          :current="pageState.current"
          :page-size="pageState.pageSize"
          :total="pageState.total"
          :pages="pageState.pages"
          @current-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </template>
    </OjTableLayout>
  </section>
</template>

<style scoped>
.submissions-table :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
}

.submission-cell-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .oj-table-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .oj-table-filter-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
