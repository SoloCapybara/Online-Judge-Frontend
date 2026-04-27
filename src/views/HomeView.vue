<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { getHomeOverview, type HomeOverviewVO, type HomeRecentSubmissionVO } from '../api/home'
import type { SubmissionStatus } from '../api/submission'
import OjBadge from '../components/ui/OjBadge.vue'
import OjCard from '../components/ui/OjCard.vue'

type BadgeTone = 'ac' | 'warning' | 'danger' | 'neutral' | 'judging' | 'wa' | 'ce' | 're' | 'tle'

const loading = ref(false)
const errorMessage = ref('')
const overview = ref<HomeOverviewVO | null>(null)

const recentContests = computed(() => (
  Array.isArray(overview.value?.recentContests) ? overview.value?.recentContests ?? [] : []
))

const recentSubmissions = computed(() => (
  Array.isArray(overview.value?.recentSubmissions) ? overview.value?.recentSubmissions ?? [] : []
))

const headline = computed(() => {
  if (!recentContests.value.length) {
    return '平台首页数据已接入真实接口'
  }
  const first = recentContests.value[0]
  return `最近活动：${typeLabel(first.type)}「${first.title}」`
})

const overviewCards = computed(() => {
  const problemCount = Number(overview.value?.problemCount || 0)
  const todaySubmissionCount = Number(overview.value?.todaySubmissionCount || 0)
  const queueTaskCount = Number(overview.value?.queueTaskCount || 0)
  const globalAcRate = Number(overview.value?.globalAcRate || 0)

  return [
    {
      label: '题库题目',
      value: formatNumber(problemCount),
      trend: '实时统计',
      trendClass: 'text-slate-500 dark:text-slate-400',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      label: '今日提交',
      value: formatNumber(todaySubmissionCount),
      trend: '按自然日累计',
      trendClass: 'text-slate-500 dark:text-slate-400',
      icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
    },
    {
      label: '评测队列',
      value: queueTaskCount > 0 ? String(queueTaskCount) : '空闲',
      trend: `${queueTaskCount} 等待中任务`,
      trendClass: queueTaskCount > 0
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400',
      icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
    },
    {
      label: '全站 AC 率',
      value: `${globalAcRate.toFixed(1)}%`,
      trend: '基于历史提交计算',
      trendClass: 'text-slate-500 dark:text-slate-400',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ]
})

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '首页数据加载失败'
  }
  return error instanceof Error ? error.message : '首页数据加载失败'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(Math.max(0, Number(value || 0)))
}

function formatDateTime(raw: string | undefined) {
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

function formatRelativeTime(raw: string | undefined) {
  if (!raw) {
    return '-'
  }
  const time = new Date(raw).getTime()
  if (Number.isNaN(time)) {
    return raw
  }
  const diff = Date.now() - time
  if (diff < 0) {
    return '刚刚'
  }
  if (diff < 10_000) {
    return '刚刚'
  }
  if (diff < 60_000) {
    return `${Math.floor(diff / 1000)} 秒前`
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} 分钟前`
  }
  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)} 小时前`
  }
  return `${Math.floor(diff / 86_400_000)} 天前`
}

function typeLabel(type: string | undefined) {
  return String(type || '').toUpperCase() === 'HOMEWORK' ? '作业' : '比赛'
}

function contestStatusTone(statusText: string | undefined): BadgeTone {
  const text = String(statusText || '')
  if (text === '进行中') {
    return 'ac'
  }
  if (text === '未开始') {
    return 'warning'
  }
  if (text === '已关闭') {
    return 'danger'
  }
  return 'neutral'
}

function resultLabel(status: SubmissionStatus | undefined) {
  switch (String(status || '').toUpperCase()) {
    case 'WAITING':
      return '排队中'
    case 'JUDGING':
      return '评测中'
    case 'ACCEPTED':
      return 'AC'
    case 'PARTIAL_ACCEPTED':
      return '部分通过'
    case 'WRONG_ANSWER':
      return 'WA'
    case 'COMPILE_ERROR':
      return 'CE'
    case 'RUNTIME_ERROR':
      return 'RE'
    case 'TIME_LIMIT_EXCEEDED':
      return 'TLE'
    case 'SYSTEM_ERROR':
      return '系统错误'
    default:
      return status || '未知'
  }
}

function resultTone(status: SubmissionStatus | undefined): BadgeTone {
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

function displayUser(item: HomeRecentSubmissionVO) {
  const name = String(item.userRealName || '').trim()
  if (name) {
    return name
  }
  const username = String(item.username || '').trim()
  return username || '-'
}

function displayProblem(item: HomeRecentSubmissionVO) {
  const title = String(item.problemTitle || '').trim()
  if (title) {
    return title
  }
  const problemId = String(item.problemId || '').trim()
  if (problemId) {
    return `题目 #${problemId}`
  }
  return '-'
}

function submissionCost(item: HomeRecentSubmissionVO) {
  if ((item.timeUsed === null || item.timeUsed === undefined) && (item.memoryUsed === null || item.memoryUsed === undefined)) {
    return '—'
  }
  const time = item.timeUsed === null || item.timeUsed === undefined ? '-' : `${Number(item.timeUsed)}ms`
  const memory = item.memoryUsed === null || item.memoryUsed === undefined ? '-' : `${Number(item.memoryUsed)}MB`
  return `${time} / ${memory}`
}

async function loadOverview() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getHomeOverview()
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '首页数据加载失败')
    }
    overview.value = response.data
  } catch (error) {
    overview.value = null
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadOverview()
})
</script>

<template>
  <section class="oj-page">
    <div>
      <h1 class="oj-page-title">开始刷题，保持手感</h1>
      <p class="oj-page-subtitle">{{ headline }}</p>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
    >
      {{ errorMessage }}
    </div>

    <section class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="平台概览">
      <OjCard
        v-for="item in overviewCards"
        :key="item.label"
        tone="neutral"
        class="rounded-xl transition hover:-translate-y-px"
      >
        <div class="mb-3 grid h-[38px] w-[38px] place-items-center rounded-lg bg-slate-100 dark:bg-white/[0.06]" aria-hidden="true">
          <svg class="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
        </div>
        <div class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{{ item.label }}</div>
        <div class="text-[1.625rem] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{{ item.value }}</div>
        <div class="mt-2 text-sm" :class="item.trendClass">{{ item.trend }}</div>
      </OjCard>
    </section>

    <section>
      <OjCard tone="neutral" class="rounded-xl">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4 dark:border-white/[0.06]">
          <h2 class="text-[0.9375rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">最近比赛</h2>
          <RouterLink to="/contests" class="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400">比赛列表</RouterLink>
        </div>
        <div v-if="!recentContests.length" class="py-3 text-sm text-slate-500 dark:text-slate-400">
          暂无比赛数据
        </div>
        <div v-else class="flex flex-col">
          <div
            v-for="(item, index) in recentContests"
            :key="item.id"
            class="flex items-start justify-between gap-3 py-3.5"
            :class="index === recentContests.length - 1 ? '' : 'border-b border-slate-200 dark:border-white/[0.06]'"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{{ item.title }}</p>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {{ formatDateTime(item.startTime) }} ~ {{ formatDateTime(item.endTime) }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <OjBadge size="small" tone="neutral">{{ typeLabel(item.type) }}</OjBadge>
              <OjBadge size="small" :tone="contestStatusTone(item.statusText)">{{ item.statusText || '未知' }}</OjBadge>
            </div>
          </div>
        </div>
      </OjCard>
    </section>

    <OjCard tone="neutral" class="rounded-xl" aria-labelledby="recent-submissions-title">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4 dark:border-white/[0.06]">
        <h2 id="recent-submissions-title" class="text-[0.9375rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">最近提交</h2>
        <RouterLink to="/submissions" class="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400">全局提交记录</RouterLink>
      </div>
      <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.06]">
        <table class="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#181c2a]">
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">提交 ID</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">用户</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">题目</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">语言</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">评测结果</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">耗时 / 内存</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">时间</th>
            </tr>
          </thead>
          <tbody class="text-slate-800 dark:text-slate-200">
            <tr
              v-for="item in recentSubmissions"
              :key="item.id"
              class="border-t border-slate-200 transition hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
            >
              <td class="px-4 py-3 font-mono text-[0.82rem]">#{{ item.id }}</td>
              <td class="px-4 py-3">{{ displayUser(item) }}</td>
              <td class="px-4 py-3">{{ displayProblem(item) }}</td>
              <td class="px-4 py-3 font-mono text-[0.8rem]">{{ item.language || '-' }}</td>
              <td class="px-4 py-3">
                <OjBadge size="small" :tone="resultTone(item.status)">{{ resultLabel(item.status) }}</OjBadge>
              </td>
              <td class="px-4 py-3 font-mono text-[0.8rem] text-slate-500">{{ submissionCost(item) }}</td>
              <td class="px-4 py-3 text-slate-500">{{ formatRelativeTime(item.submitTime) }}</td>
            </tr>
            <tr v-if="!recentSubmissions.length && !loading">
              <td colspan="7" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">暂无提交记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </OjCard>
  </section>
</template>
