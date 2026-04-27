<script setup lang="ts">
import axios from 'axios'
import { onMounted, reactive, ref } from 'vue'
import { getJudgeOverview, getSubmissionPage, type JudgeOverviewVO, type SubmissionStatus, type SubmissionVO } from '../api/submission'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'

const loading = ref(false)
const errorMessage = ref('')
const submissions = ref<SubmissionVO[]>([])

const overview = reactive<JudgeOverviewVO>({
  queueTaskCount: 0,
  onlineNodeCount: 0,
  todaySubmissionCount: 0,
  serviceStatus: 'DOWN',
})

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '评测状态加载失败'
  }
  return error instanceof Error ? error.message : '评测状态加载失败'
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

function serviceStatusLabel(status: string) {
  switch (String(status || '').toUpperCase()) {
    case 'NORMAL':
      return '正常'
    case 'BUSY':
      return '繁忙'
    case 'DOWN':
      return '异常'
    default:
      return status || '未知'
  }
}

function serviceStatusTone(status: string) {
  switch (String(status || '').toUpperCase()) {
    case 'NORMAL':
      return 'success'
    case 'BUSY':
      return 'accent'
    case 'DOWN':
      return 'danger'
    default:
      return 'neutral'
  }
}

function userLabel(row: SubmissionVO) {
  const realName = row.userRealName?.trim()
  if (realName) {
    return realName
  }
  return row.username?.trim() || '-'
}

function problemLabel(row: SubmissionVO) {
  const title = row.problemTitle?.trim()
  if (title) {
    return title
  }
  return `#${row.problemId}`
}

function safeTimeLabel(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-'
  }
  return `${Number(value)} ms`
}

async function loadStatusData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [overviewRes, submissionRes] = await Promise.all([
      getJudgeOverview(),
      getSubmissionPage({ current: 1, pageSize: 10 }),
    ])
    if (overviewRes.code !== 0 || !overviewRes.data) {
      throw new Error(overviewRes.message || '加载判题概览失败')
    }
    if (submissionRes.code !== 0 || !submissionRes.data) {
      throw new Error(submissionRes.message || '加载最近提交失败')
    }

    overview.queueTaskCount = Number(overviewRes.data.queueTaskCount || 0)
    overview.onlineNodeCount = Number(overviewRes.data.onlineNodeCount || 0)
    overview.todaySubmissionCount = Number(overviewRes.data.todaySubmissionCount || 0)
    overview.serviceStatus = String(overviewRes.data.serviceStatus || 'DOWN')

    submissions.value = Array.isArray(submissionRes.data.records) ? submissionRes.data.records : []
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
    submissions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStatusData()
})
</script>

<template>
  <section class="oj-page">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="oj-page-title">评测状态</h1>
        <p class="oj-page-subtitle">实时查看队列、节点与最近提交状态。</p>
      </div>
      <OjButton tone="secondary" size="small" :loading="loading" @click="loadStatusData">刷新状态</OjButton>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <OjCard tone="neutral" class="rounded-2xl">
        <div class="text-xs uppercase tracking-[0.12em] text-slate-400">队列任务</div>
        <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{{ overview.queueTaskCount }}</div>
      </OjCard>
      <OjCard tone="neutral" class="rounded-2xl">
        <div class="text-xs uppercase tracking-[0.12em] text-slate-400">在线节点</div>
        <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{{ overview.onlineNodeCount }}</div>
      </OjCard>
      <OjCard tone="neutral" class="rounded-2xl">
        <div class="text-xs uppercase tracking-[0.12em] text-slate-400">今日提交量</div>
        <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{{ overview.todaySubmissionCount }}</div>
      </OjCard>
      <OjCard :tone="serviceStatusTone(overview.serviceStatus)" class="rounded-2xl">
        <div class="text-xs uppercase tracking-[0.12em] text-slate-400">服务状态</div>
        <div class="mt-2 text-lg font-semibold">{{ serviceStatusLabel(overview.serviceStatus) }}</div>
      </OjCard>
    </div>

    <OjCard tone="neutral" class="rounded-[20px]">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">最新提交</h2>
        <OjButton tone="secondary" size="small" :loading="loading" @click="loadStatusData">刷新列表</OjButton>
      </div>

      <div v-if="errorMessage" class="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {{ errorMessage }}
      </div>

      <el-table v-loading="loading" :data="submissions">
        <el-table-column prop="id" label="提交号" width="120" />
        <el-table-column label="用户" width="150">
          <template #default="{ row }">
            {{ userLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column label="题目">
          <template #default="{ row }">
            {{ problemLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="language" label="语言" width="120" />
        <el-table-column label="结果" width="190">
          <template #default="{ row }">
            <OjBadge size="small" :tone="statusTone(row.status)">{{ statusLabel(row.status) }}</OjBadge>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="120">
          <template #default="{ row }">
            {{ safeTimeLabel(row.timeUsed) }}
          </template>
        </el-table-column>
      </el-table>
    </OjCard>
  </section>
</template>
