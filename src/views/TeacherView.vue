<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  exportContestScoreFile,
  getContestPage,
  getContestScorePage,
  type ContestScoreExportFormat,
  type ContestScoreVO,
  type ContestVO,
} from '../api/contest'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'
import { ojMessage } from '../utils/message'

const loading = ref(false)
const exporting = ref(false)
const exportFormat = ref<ContestScoreExportFormat>('csv')
const errorMessage = ref('')
const contestOptions = ref<Array<{ label: string; value: string }>>([])
const selectedContestId = ref('')
const records = ref<ContestScoreVO[]>([])

const filterForm = reactive({
  usernameKeyword: '',
  classKeyword: '',
})

const pageState = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  pages: 0,
})

const hasContest = computed(() => contestOptions.value.length > 0)

const exportFormatOptions = [
  { label: 'CSV（通用）', value: 'csv' },
  { label: 'Excel（美化）', value: 'xlsx' },
] as const

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '成绩总览加载失败'
  }
  return error instanceof Error ? error.message : '成绩总览加载失败'
}

function typeLabel(type: string | undefined) {
  return String(type || '').toUpperCase() === 'HOMEWORK' ? '作业' : '比赛'
}

function displayUser(row: ContestScoreVO) {
  const realName = String(row.realName || '').trim()
  if (realName) {
    return realName
  }
  const username = String(row.username || '').trim()
  if (username) {
    return username
  }
  return `用户${row.userId || '-'}`
}

function buildQuery(current = pageState.current) {
  const usernameKeyword = filterForm.usernameKeyword.trim()
  const classKeyword = filterForm.classKeyword.trim()
  return {
    current,
    pageSize: pageState.pageSize,
    ...(usernameKeyword ? { usernameKeyword } : {}),
    ...(classKeyword ? { classKeyword } : {}),
  }
}

function buildExportQuery() {
  const usernameKeyword = filterForm.usernameKeyword.trim()
  const classKeyword = filterForm.classKeyword.trim()
  return {
    ...(usernameKeyword ? { usernameKeyword } : {}),
    ...(classKeyword ? { classKeyword } : {}),
  }
}

async function loadContestOptions() {
  const response = await getContestPage({
    current: 1,
    pageSize: 100,
  })
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || '比赛列表加载失败')
  }
  const options = (response.data.records || []).map((contest: ContestVO) => ({
    label: `${typeLabel(contest.type)}：${contest.title}${contest.statusText ? `（${contest.statusText}）` : ''}`,
    value: String(contest.id),
  }))
  contestOptions.value = options
  if (!selectedContestId.value && options.length > 0) {
    selectedContestId.value = options[0].value
  }
}

async function loadScores(current = pageState.current) {
  if (!selectedContestId.value) {
    records.value = []
    pageState.total = 0
    pageState.pages = 0
    return
  }

  const response = await getContestScorePage(selectedContestId.value, buildQuery(current))
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || '成绩总览加载失败')
  }

  records.value = Array.isArray(response.data.records) ? response.data.records : []
  pageState.current = Number(response.data.current || current)
  pageState.total = Number(response.data.total || 0)
  pageState.pageSize = Number(response.data.size || pageState.pageSize)
  pageState.pages = Number(response.data.pages || 0)
}

async function loadAll() {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadContestOptions()
    await loadScores(1)
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
  loading.value = true
  errorMessage.value = ''
  void loadScores(1)
    .catch((error) => {
      records.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

function handleReset() {
  filterForm.usernameKeyword = ''
  filterForm.classKeyword = ''
  handleSearch()
}

function handleRefresh() {
  loading.value = true
  errorMessage.value = ''
  void Promise.all([
    loadContestOptions(),
    loadScores(pageState.current),
  ])
    .catch((error) => {
      records.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

async function handleExport() {
  if (!selectedContestId.value || exporting.value) {
    return
  }
  exporting.value = true
  try {
    const format = exportFormat.value
    const blob = await exportContestScoreFile(selectedContestId.value, format, buildExportQuery())
    const ext = format === 'xlsx' ? 'xlsx' : 'csv'
    const fileName = `成绩总览_${selectedContestId.value}.${ext}`
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = fileName
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ojMessage.success('导出成功')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    exporting.value = false
  }
}

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  loading.value = true
  errorMessage.value = ''
  void loadScores(nextPage)
    .catch((error) => {
      records.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

function handlePageSizeChange(nextSize: number) {
  pageState.pageSize = nextSize
  pageState.current = 1
  loading.value = true
  errorMessage.value = ''
  void loadScores(1)
    .catch((error) => {
      records.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

watch(selectedContestId, () => {
  if (!selectedContestId.value) {
    records.value = []
    pageState.total = 0
    pageState.pages = 0
    return
  }
  pageState.current = 1
  loading.value = true
  errorMessage.value = ''
  void loadScores(1)
    .catch((error) => {
      records.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
})

onMounted(() => {
  void loadAll()
})
</script>

<template>
  <section class="oj-page">
    <OjTableLayout :loading="loading" loading-text="成绩总览加载中...">
      <template #filters>
        <form class="oj-table-filter-grid grid gap-2 lg:grid-cols-[220px_minmax(0,1fr)_220px_auto]" @submit.prevent="handleSearch">
          <OjSelect
            v-model="selectedContestId"
            :options="contestOptions"
            placeholder="选择比赛/作业"
          />

          <OjInput
            v-model="filterForm.usernameKeyword"
            placeholder="搜索用户名或姓名"
            clearable
          />

          <OjInput
            v-model="filterForm.classKeyword"
            placeholder="按学号搜索"
            clearable
          />

          <div class="flex items-center gap-2">
            <OjButton tone="info" size="small" native-type="submit" :disabled="loading" :loading="loading">查询</OjButton>
            <OjButton tone="secondary" size="small" :disabled="loading" @click="handleReset">重置</OjButton>
            <OjButton tone="secondary" size="small" :disabled="loading" @click="handleRefresh">刷新</OjButton>
            <div class="w-[150px]">
              <OjSelect
                v-model="exportFormat"
                :options="exportFormatOptions"
                placeholder="导出格式"
              />
            </div>
            <OjButton
              tone="primary"
              size="small"
              :disabled="loading || !selectedContestId || exporting"
              :loading="exporting"
              @click="handleExport"
            >
              导出
            </OjButton>
          </div>
        </form>
      </template>

      <template #error>
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
        />
      </template>

      <el-empty v-if="!hasContest" description="暂无可统计的比赛/作业" />

      <el-table
        v-else
        :data="records"
        stripe
        table-layout="fixed"
        height="460"
      >
        <el-table-column prop="rank" label="排名" width="90" align="center" />

        <el-table-column label="学生" min-width="220">
          <template #default="{ row }">
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ displayUser(row) }}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">@{{ row.username || row.userId }}</div>
          </template>
        </el-table-column>

        <el-table-column label="学号/工号" width="170" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.studentNo || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="总分" width="100" align="center">
          <template #default="{ row }">
            {{ Number(row.totalScore || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="已AC题数" width="110" align="center">
          <template #default="{ row }">
            {{ Number(row.acCount || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="罚时 / 提交数" width="180" align="center">
          <template #default="{ row }">
            {{ Number(row.penaltyMinutes || 0) }} min / {{ Number(row.submitCount || 0) }}
          </template>
        </el-table-column>
      </el-table>

      <template #pagination>
        <OjPagination
          v-if="hasContest"
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
