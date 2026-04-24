<script setup lang="ts">
import axios from 'axios'
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  getAdminSystemConfigCategories,
  getAdminSystemConfigPage,
  getAdminRoleOptions,
  getAdminUserPage,
  updateAdminSystemConfig,
  updateAdminUserProfile,
  updateAdminUserRoles,
  updateAdminUserStatus,
  type AdminRoleOptionVO,
  type AdminSystemConfigVO,
  type AdminUserVO,
} from '../api/admin'
import { getHomeOverview, type HomeRecentContestVO } from '../api/home'
import {
  getJudgeDailyStats,
  getJudgeOverview,
  getJudgeSystemMetrics,
  getSubmissionPage,
  type JudgeDailyStatsVO,
  type JudgeSystemMetricsVO,
  type SubmissionStatus,
  type SubmissionVO,
} from '../api/submission'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import OjEmptyState from '../components/ui/OjEmptyState.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjModal from '../components/ui/OjModal.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'
import { ojMessage } from '../utils/message'

type AdminTabKey = 'users' | 'configs' | 'monitor'

const activeTab = ref<AdminTabKey>('users')

const adminTabs: Array<{ key: AdminTabKey; label: string; description: string }> = [
  { key: 'users', label: '用户管理', description: '账号、角色与状态维护' },
  { key: 'configs', label: '系统配置', description: '运行参数与功能开关配置' },
  { key: 'monitor', label: '数据监控', description: '评测队列、提交与成绩入口' },
]

const loading = ref(false)
const errorMessage = ref('')
const records = ref<AdminUserVO[]>([])
const roleOptions = ref<AdminRoleOptionVO[]>([])
const roleLoading = ref(false)
const configLoading = ref(false)
const configErrorMessage = ref('')
const configRecords = ref<AdminSystemConfigVO[]>([])
const configCategories = ref<string[]>([])

const pageState = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
})

const filterForm = reactive({
  keyword: '',
  roleCode: '',
  status: '',
})

const configPageState = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
})

const configFilterForm = reactive({
  keyword: '',
  category: '',
  status: '',
})

const configModalOpen = ref(false)
const configSubmitting = ref(false)
const editingConfigId = ref('')
const configEditForm = reactive({
  configKey: '',
  configName: '',
  configValue: '',
  valueType: '',
  category: '',
  description: '',
  status: '1',
})

const editModalOpen = ref(false)
const editingUserId = ref('')
const editSubmitting = ref(false)
const editForm = reactive({
  username: '',
  realName: '',
  studentNo: '',
  email: '',
  phone: '',
  gender: '',
})

const roleModalOpen = ref(false)
const roleSubmitting = ref(false)
const roleTargetUserId = ref('')
const roleTargetUsername = ref('')
const selectedRoleCode = ref('')

const statusModalOpen = ref(false)
const statusSubmitting = ref(false)
const statusTargetUserId = ref('')
const statusTargetUsername = ref('')
const statusNextValue = ref(1)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
] as const

const configStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: '1' },
  { label: '停用', value: '0' },
] as const

const genderOptions = [
  { label: '未知', value: '0' },
  { label: '男', value: '1' },
  { label: '女', value: '2' },
] as const

const roleFilterOptions = computed(() => [
  { label: '全部角色', value: '' },
  ...roleOptions.value.map((item) => ({ label: item.roleName, value: item.roleCode })),
])

const configCategoryOptions = computed(() => [
  { label: '全部分类', value: '' },
  ...configCategories.value.map((item) => ({ label: item, value: item })),
])

const rowIndexStart = computed(() => (pageState.current - 1) * pageState.pageSize)
const configRowIndexStart = computed(() => (configPageState.current - 1) * configPageState.pageSize)
const activeCount = computed(() => records.value.filter((item) => Number(item.status) === 1).length)
const disabledCount = computed(() => records.value.filter((item) => Number(item.status) === 0).length)
const overviewCards = computed(() => [
  { key: 'total', label: '用户总数', value: pageState.total },
  { key: 'active', label: '当前页启用', value: activeCount.value },
  { key: 'disabled', label: '当前页禁用', value: disabledCount.value },
])
const activeConfigCount = computed(() => configRecords.value.filter((item) => Number(item.status) === 1).length)
const configOverviewCards = computed(() => [
  { key: 'config-total', label: '配置总数', value: configPageState.total },
  { key: 'config-active', label: '当前页启用', value: activeConfigCount.value },
  { key: 'config-category', label: '配置分类', value: configCategories.value.length },
])
const currentUserId = ref(localStorage.getItem('oj-user-id') ?? '')
const monitorLoading = ref(false)
const monitorErrorMessage = ref('')
const monitorInitialized = ref(false)
const monitorAutoRefresh = ref(true)
const monitorLastUpdated = ref('')
const monitorRecentSubmissions = ref<SubmissionVO[]>([])
const monitorRecentContests = ref<HomeRecentContestVO[]>([])
const monitorTrendSamples = ref<SubmissionVO[]>([])
const monitorDailyStats = ref<JudgeDailyStatsVO[]>([])
const monitorTrendChartRef = ref<HTMLElement | null>(null)
const monitorDistributionChartRef = ref<HTMLElement | null>(null)
const monitorRadarChartRef = ref<HTMLElement | null>(null)
const monitorOverview = reactive({
  queueTaskCount: 0,
  onlineNodeCount: 0,
  todaySubmissionCount: 0,
  serviceStatus: 'DOWN',
  problemCount: 0,
  globalAcRate: 0,
})
const MONITOR_REFRESH_INTERVAL_MS = 5000
const monitorSystemMetrics = reactive<JudgeSystemMetricsVO>({
  osName: '-',
  osArch: '-',
  systemCpuUsage: 0,
  processCpuUsage: 0,
  systemLoadAverage: 0,
  systemMemoryTotal: 0,
  systemMemoryFree: 0,
  jvmHeapTotal: 0,
  jvmHeapUsed: 0,
  diskTotal: 0,
  diskUsable: 0,
  processUptimeMs: 0,
  containerized: false,
  runtimeEnvironment: 'HOST',
  containerHint: '',
  collectedAt: '',
})
let monitorRefreshTimer: ReturnType<typeof setInterval> | null = null
let monitorTrendChart: echarts.ECharts | null = null
let monitorDistributionChart: echarts.ECharts | null = null
let monitorRadarChart: echarts.ECharts | null = null

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '请求失败'
  }
  return error instanceof Error ? error.message : '请求失败'
}

function formatDateTime(value: string | undefined) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ')
}

function formatBytes(value: number | undefined) {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDuration(ms: number | undefined) {
  const total = Math.max(0, Number(ms || 0))
  const seconds = Math.floor(total / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainSeconds = seconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${remainSeconds}s`
  }
  return `${remainSeconds}s`
}

function safePercent(value: number | undefined) {
  const next = Number(value || 0)
  if (!Number.isFinite(next)) {
    return 0
  }
  return Math.max(0, Math.min(100, next))
}

function roleLabel(row: AdminUserVO) {
  const names = Array.isArray(row.roleNames) ? row.roleNames.filter((item) => item && item.trim()) : []
  if (names.length) {
    return names.join(' / ')
  }
  const codes = Array.isArray(row.roleCodes) ? row.roleCodes.filter((item) => item && item.trim()) : []
  if (codes.length) {
    return codes.join(' / ')
  }
  return '-'
}

function isCurrentUser(row: AdminUserVO) {
  return Boolean(currentUserId.value) && String(row.id) === String(currentUserId.value)
}

function genderLabel(value: number | string | undefined) {
  const raw = Number(value)
  if (raw === 1) {
    return '男'
  }
  if (raw === 2) {
    return '女'
  }
  return '未知'
}

function statusLabel(value: number | string | undefined) {
  return Number(value) === 1 ? '启用' : '禁用'
}

function statusTone(value: number | string | undefined) {
  return Number(value) === 1 ? 'ac' : 'danger'
}

function judgeServiceStatusLabel(status: string | undefined) {
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

function judgeServiceStatusTone(status: string | undefined) {
  switch (String(status || '').toUpperCase()) {
    case 'NORMAL':
      return 'ac'
    case 'BUSY':
      return 'warning'
    case 'DOWN':
      return 'danger'
    default:
      return 'neutral'
  }
}

function submissionStatusLabel(status: SubmissionStatus | undefined) {
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
      return '运行错误'
    case 'TIME_LIMIT_EXCEEDED':
      return '超时'
    case 'SYSTEM_ERROR':
      return '系统错误'
    default:
      return status || '未知'
  }
}

function submissionStatusTone(status: SubmissionStatus | undefined) {
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

function monitorUserLabel(row: SubmissionVO) {
  const realName = String(row.userRealName || '').trim()
  if (realName) {
    return realName
  }
  const username = String(row.username || '').trim()
  if (username) {
    return username
  }
  return row.userId ? `用户#${row.userId}` : '-'
}

function monitorProblemLabel(row: SubmissionVO) {
  const title = String(row.problemTitle || '').trim()
  if (title) {
    return title
  }
  return row.problemId ? `题目#${row.problemId}` : '-'
}

function monitorContestStatusTone(statusText: string | undefined) {
  const text = String(statusText || '')
  if (text.includes('进行中')) {
    return 'ac'
  }
  if (text.includes('未开始')) {
    return 'warning'
  }
  if (text.includes('已结束') || text.includes('已关闭')) {
    return 'neutral'
  }
  return 'neutral'
}

function monitorTypeLabel(type: string | undefined) {
  return String(type || '').toUpperCase() === 'HOMEWORK' ? '作业' : '比赛'
}

async function loadMonitorDashboard() {
  monitorLoading.value = true
  monitorErrorMessage.value = ''
  try {
    const [judgeRes, systemRes, homeRes, submissionRes, dailyRes, trendRes] = await Promise.all([
      getJudgeOverview(),
      getJudgeSystemMetrics(),
      getHomeOverview(),
      getSubmissionPage({ current: 1, pageSize: 8 }),
      getJudgeDailyStats(7),
      getSubmissionPage({ current: 1, pageSize: 100 }),
    ])
    if (judgeRes.code !== 0 || !judgeRes.data) {
      throw new Error(judgeRes.message || '加载判题概览失败')
    }
    if (homeRes.code !== 0 || !homeRes.data) {
      throw new Error(homeRes.message || '加载首页概览失败')
    }
    if (systemRes.code !== 0 || !systemRes.data) {
      throw new Error(systemRes.message || '加载系统资源失败')
    }
    if (submissionRes.code !== 0 || !submissionRes.data) {
      throw new Error(submissionRes.message || '加载最近提交失败')
    }
    if (dailyRes.code !== 0 || !dailyRes.data) {
      throw new Error(dailyRes.message || '加载每日趋势失败')
    }
    if (trendRes.code !== 0 || !trendRes.data) {
      throw new Error(trendRes.message || '加载趋势样本失败')
    }

    monitorOverview.queueTaskCount = Number(judgeRes.data.queueTaskCount || 0)
    monitorOverview.onlineNodeCount = Number(judgeRes.data.onlineNodeCount || 0)
    monitorOverview.todaySubmissionCount = Number(judgeRes.data.todaySubmissionCount || 0)
    monitorOverview.serviceStatus = String(judgeRes.data.serviceStatus || 'DOWN')
    monitorOverview.problemCount = Number(homeRes.data.problemCount || 0)
    monitorOverview.globalAcRate = Number(homeRes.data.globalAcRate || 0)
    monitorSystemMetrics.osName = systemRes.data.osName || '-'
    monitorSystemMetrics.osArch = systemRes.data.osArch || '-'
    monitorSystemMetrics.systemCpuUsage = Number(systemRes.data.systemCpuUsage || 0)
    monitorSystemMetrics.processCpuUsage = Number(systemRes.data.processCpuUsage || 0)
    monitorSystemMetrics.systemLoadAverage = Number(systemRes.data.systemLoadAverage || 0)
    monitorSystemMetrics.systemMemoryTotal = Number(systemRes.data.systemMemoryTotal || 0)
    monitorSystemMetrics.systemMemoryFree = Number(systemRes.data.systemMemoryFree || 0)
    monitorSystemMetrics.jvmHeapTotal = Number(systemRes.data.jvmHeapTotal || 0)
    monitorSystemMetrics.jvmHeapUsed = Number(systemRes.data.jvmHeapUsed || 0)
    monitorSystemMetrics.diskTotal = Number(systemRes.data.diskTotal || 0)
    monitorSystemMetrics.diskUsable = Number(systemRes.data.diskUsable || 0)
    monitorSystemMetrics.processUptimeMs = Number(systemRes.data.processUptimeMs || 0)
    monitorSystemMetrics.containerized = Boolean(systemRes.data.containerized)
    monitorSystemMetrics.runtimeEnvironment = String(systemRes.data.runtimeEnvironment || 'HOST')
    monitorSystemMetrics.containerHint = systemRes.data.containerHint || ''
    monitorSystemMetrics.collectedAt = systemRes.data.collectedAt || ''

    monitorRecentContests.value = Array.isArray(homeRes.data.recentContests) ? homeRes.data.recentContests.slice(0, 6) : []
    monitorRecentSubmissions.value = Array.isArray(submissionRes.data.records) ? submissionRes.data.records : []
    monitorDailyStats.value = Array.isArray(dailyRes.data) ? dailyRes.data : []
    monitorTrendSamples.value = Array.isArray(trendRes.data.records) ? trendRes.data.records : []
    monitorLastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
    monitorInitialized.value = true
    await nextTick()
    updateMonitorCharts()
  } catch (error) {
    monitorErrorMessage.value = resolveErrorMessage(error)
    monitorRecentContests.value = []
    monitorRecentSubmissions.value = []
    monitorDailyStats.value = []
    monitorTrendSamples.value = []
    monitorSystemMetrics.osName = '-'
    monitorSystemMetrics.osArch = '-'
    monitorSystemMetrics.systemCpuUsage = 0
    monitorSystemMetrics.processCpuUsage = 0
    monitorSystemMetrics.systemLoadAverage = 0
    monitorSystemMetrics.systemMemoryTotal = 0
    monitorSystemMetrics.systemMemoryFree = 0
    monitorSystemMetrics.jvmHeapTotal = 0
    monitorSystemMetrics.jvmHeapUsed = 0
    monitorSystemMetrics.diskTotal = 0
    monitorSystemMetrics.diskUsable = 0
    monitorSystemMetrics.processUptimeMs = 0
    monitorSystemMetrics.containerized = false
    monitorSystemMetrics.runtimeEnvironment = 'HOST'
    monitorSystemMetrics.containerHint = ''
    monitorSystemMetrics.collectedAt = ''
    await nextTick()
    updateMonitorCharts()
  } finally {
    monitorLoading.value = false
  }
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

function formatDayLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function buildRecent7DaySeries(records: JudgeDailyStatsVO[]) {
  const labels = records.map((item) => {
    const date = parseDate(item.statDate)
    if (!date) {
      return item.statDate || '-'
    }
    return formatDayLabel(date)
  })
  const counts = records.map((item) => Number(item.submitCount || 0))
  const acRates = records.map((item) => Number(item.acRate || 0))
  return { labels, counts, acRates }
}

function buildStatusDistribution(records: SubmissionVO[]) {
  const grouped = new Map<string, number>()
  records.forEach((item) => {
    const key = String(item.status || 'UNKNOWN').toUpperCase()
    grouped.set(key, (grouped.get(key) || 0) + 1)
  })
  const ordered = Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  return ordered.map(([status, value]) => ({
    name: submissionStatusLabel(status),
    value,
  }))
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.min(100, value))
}

function buildRadarValues(records: SubmissionVO[]) {
  const total = records.length
  const accepted = records.filter((item) => String(item.status || '').toUpperCase() === 'ACCEPTED').length
  const successRate = total <= 0 ? 0 : (accepted * 100) / total

  const queuePressureScore = clampPercent(100 - monitorOverview.queueTaskCount * 4)
  const nodeAvailabilityScore = clampPercent(monitorOverview.onlineNodeCount * 25)
  const dailyActivityScore = clampPercent(monitorOverview.todaySubmissionCount * 2)
  const acRateScore = clampPercent(monitorOverview.globalAcRate)
  const stabilityScore = clampPercent(successRate)

  return [
    dailyActivityScore,
    nodeAvailabilityScore,
    queuePressureScore,
    acRateScore,
    stabilityScore,
  ]
}

function createChartInstance(el: HTMLElement | null, current: echarts.ECharts | null) {
  if (!el) {
    return null
  }
  if (current) {
    return current
  }
  return echarts.init(el)
}

function updateMonitorCharts() {
  monitorTrendChart = createChartInstance(monitorTrendChartRef.value, monitorTrendChart)
  monitorDistributionChart = createChartInstance(monitorDistributionChartRef.value, monitorDistributionChart)
  monitorRadarChart = createChartInstance(monitorRadarChartRef.value, monitorRadarChart)

  if (!monitorTrendChart || !monitorDistributionChart || !monitorRadarChart) {
    return
  }

  const trend = buildRecent7DaySeries(monitorDailyStats.value)
  const distribution = buildStatusDistribution(monitorTrendSamples.value)
  const radarValues = buildRadarValues(monitorTrendSamples.value)

  monitorTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { color: '#64748b' },
    },
    grid: { left: 36, right: 44, top: 36, bottom: 24 },
    xAxis: {
      type: 'category',
      data: trend.labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#94a3b8' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: [
      {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.25)' } },
        name: '提交量',
        nameTextStyle: { color: '#64748b' },
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: '#64748b', formatter: '{value}%' },
        splitLine: { show: false },
        name: 'AC率',
        nameTextStyle: { color: '#64748b' },
      },
    ],
    series: [
      {
        name: '提交量',
        type: 'line',
        smooth: true,
        data: trend.counts,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 3, color: '#6366f1' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99,102,241,0.36)' },
              { offset: 1, color: 'rgba(99,102,241,0.02)' },
            ],
          },
        },
      },
      {
        name: 'AC率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trend.acRates,
        showSymbol: true,
        symbolSize: 5,
        lineStyle: { width: 2, color: '#10b981' },
        itemStyle: { color: '#10b981' },
      },
    ],
  })

  monitorDistributionChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#64748b' } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '46%'],
        data: distribution.length ? distribution : [{ name: '暂无数据', value: 1 }],
        label: { color: '#475569' },
        labelLine: { length: 12, length2: 10 },
      },
    ],
  })

  monitorRadarChart.setOption({
    tooltip: {},
    radar: {
      radius: '62%',
      indicator: [
        { name: '今日活跃度', max: 100 },
        { name: '节点可用性', max: 100 },
        { name: '排队压力', max: 100 },
        { name: '通过率表现', max: 100 },
        { name: '稳定性', max: 100 },
      ],
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
      splitArea: { areaStyle: { color: ['rgba(148,163,184,0.05)', 'rgba(148,163,184,0.09)'] } },
      axisName: { color: '#475569' },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarValues,
            name: '系统体征',
            areaStyle: { color: 'rgba(16,185,129,0.2)' },
            lineStyle: { color: '#10b981', width: 2 },
            itemStyle: { color: '#10b981' },
          },
        ],
      },
    ],
  })
}

function resizeMonitorCharts() {
  monitorTrendChart?.resize()
  monitorDistributionChart?.resize()
  monitorRadarChart?.resize()
}

function disposeMonitorCharts() {
  monitorTrendChart?.dispose()
  monitorDistributionChart?.dispose()
  monitorRadarChart?.dispose()
  monitorTrendChart = null
  monitorDistributionChart = null
  monitorRadarChart = null
}

function startMonitorRefreshTimer() {
  if (document.hidden) {
    return
  }
  if (monitorRefreshTimer) {
    return
  }
  monitorRefreshTimer = setInterval(() => {
    if (document.hidden) {
      return
    }
    if (activeTab.value === 'monitor' && monitorAutoRefresh.value) {
      void loadMonitorDashboard()
    }
  }, MONITOR_REFRESH_INTERVAL_MS)
}

function stopMonitorRefreshTimer() {
  if (!monitorRefreshTimer) {
    return
  }
  clearInterval(monitorRefreshTimer)
  monitorRefreshTimer = null
}

function handleRefreshMonitorDashboard() {
  void loadMonitorDashboard()
}

function handleVisibilityChange() {
  if (!monitorAutoRefresh.value || activeTab.value !== 'monitor') {
    return
  }
  if (document.hidden) {
    stopMonitorRefreshTimer()
    return
  }
  void loadMonitorDashboard()
  startMonitorRefreshTimer()
}

function configStatusLabel(value: number | string | undefined) {
  return Number(value) === 1 ? '启用' : '停用'
}

function formatValueType(value: string | undefined) {
  if (!value) {
    return 'STRING'
  }
  return value.toUpperCase()
}

function switchTab(tab: AdminTabKey) {
  activeTab.value = tab
}

function buildQuery(current = pageState.current) {
  const keyword = filterForm.keyword.trim()
  const roleCode = filterForm.roleCode.trim()
  const statusNumber = filterForm.status === '' ? undefined : Number(filterForm.status)
  return {
    current,
    pageSize: pageState.pageSize,
    ...(keyword ? { keyword } : {}),
    ...(roleCode ? { roleCode } : {}),
    ...(statusNumber === 0 || statusNumber === 1 ? { status: statusNumber } : {}),
  }
}

function buildConfigQuery(current = configPageState.current) {
  const keyword = configFilterForm.keyword.trim()
  const category = configFilterForm.category.trim()
  const statusNumber = configFilterForm.status === '' ? undefined : Number(configFilterForm.status)
  return {
    current,
    pageSize: configPageState.pageSize,
    ...(keyword ? { keyword } : {}),
    ...(category ? { category } : {}),
    ...(statusNumber === 0 || statusNumber === 1 ? { status: statusNumber } : {}),
  }
}

async function loadRoleOptions() {
  roleLoading.value = true
  try {
    const response = await getAdminRoleOptions()
    if (response.code !== 0 || !Array.isArray(response.data)) {
      throw new Error(response.message || '加载角色选项失败')
    }
    roleOptions.value = response.data
  } catch (error) {
    roleOptions.value = []
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    roleLoading.value = false
  }
}

async function loadUsers(current = pageState.current) {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getAdminUserPage(buildQuery(current))
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '加载用户列表失败')
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

async function loadConfigCategories() {
  try {
    const response = await getAdminSystemConfigCategories()
    if (response.code !== 0 || !Array.isArray(response.data)) {
      throw new Error(response.message || '加载配置分类失败')
    }
    configCategories.value = response.data
  } catch (error) {
    configCategories.value = []
    ojMessage.error(resolveErrorMessage(error))
  }
}

async function loadConfigs(current = configPageState.current) {
  configLoading.value = true
  configErrorMessage.value = ''
  try {
    const response = await getAdminSystemConfigPage(buildConfigQuery(current))
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '加载系统配置失败')
    }
    configRecords.value = Array.isArray(response.data.records) ? response.data.records : []
    configPageState.current = Number(response.data.current || current)
    configPageState.total = Number(response.data.total || 0)
    configPageState.pageSize = Number(response.data.size || configPageState.pageSize)
    configPageState.pages = Number(response.data.pages || 0)
  } catch (error) {
    configRecords.value = []
    configPageState.total = 0
    configPageState.pages = 0
    configErrorMessage.value = resolveErrorMessage(error)
  } finally {
    configLoading.value = false
  }
}

function handleSearch() {
  pageState.current = 1
  void loadUsers(1)
}

function handleReset() {
  filterForm.keyword = ''
  filterForm.roleCode = ''
  filterForm.status = ''
  pageState.current = 1
  void loadUsers(1)
}

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  void loadUsers(nextPage)
}

function handlePageSizeChange(nextSize: number) {
  pageState.pageSize = nextSize
  pageState.current = 1
  void loadUsers(1)
}

function handleConfigSearch() {
  configPageState.current = 1
  void loadConfigs(1)
}

function handleConfigReset() {
  configFilterForm.keyword = ''
  configFilterForm.category = ''
  configFilterForm.status = ''
  configPageState.current = 1
  void loadConfigs(1)
}

function handleConfigPageChange(nextPage: number) {
  configPageState.current = nextPage
  void loadConfigs(nextPage)
}

function handleConfigPageSizeChange(nextSize: number) {
  configPageState.pageSize = nextSize
  configPageState.current = 1
  void loadConfigs(1)
}

function openEditModal(row: AdminUserVO) {
  if (editSubmitting.value) {
    return
  }
  if (row.superAdmin && !isCurrentUser(row)) {
    ojMessage.warning('仅超管本人可编辑超管资料')
    return
  }
  editingUserId.value = row.id
  editForm.username = row.username || '-'
  editForm.realName = row.realName || ''
  editForm.studentNo = row.studentNo || ''
  editForm.email = row.email || ''
  editForm.phone = row.phone || ''
  editForm.gender = row.gender === null || row.gender === undefined ? '0' : String(row.gender)
  editModalOpen.value = true
}

function closeEditModal() {
  if (editSubmitting.value) {
    return
  }
  editModalOpen.value = false
}

async function handleSaveEdit() {
  if (editSubmitting.value || !editingUserId.value) {
    return
  }
  const realName = editForm.realName.trim()
  if (!realName) {
    ojMessage.warning('真实姓名不能为空')
    return
  }

  const payload = {
    realName,
    studentNo: editForm.studentNo.trim(),
    email: editForm.email.trim(),
    phone: editForm.phone.trim(),
    gender: Number(editForm.gender || '0'),
  }

  editSubmitting.value = true
  try {
    const response = await updateAdminUserProfile(editingUserId.value, payload)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '保存用户信息失败')
    }
    editModalOpen.value = false
    ojMessage.success('用户信息已更新')
    await loadUsers(pageState.current)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    editSubmitting.value = false
  }
}

function openRoleModal(row: AdminUserVO) {
  if (roleSubmitting.value || roleLoading.value) {
    return
  }
  if (row.superAdmin) {
    ojMessage.warning('超管账号不允许修改角色')
    return
  }
  roleTargetUserId.value = row.id
  roleTargetUsername.value = row.username || String(row.id)
  selectedRoleCode.value = Array.isArray(row.roleCodes) && row.roleCodes.length ? row.roleCodes[0] : ''
  roleModalOpen.value = true
}

function closeRoleModal() {
  if (roleSubmitting.value) {
    return
  }
  roleModalOpen.value = false
}

async function handleSaveRoles() {
  if (roleSubmitting.value || !roleTargetUserId.value) {
    return
  }
  if (!selectedRoleCode.value) {
    ojMessage.warning('请选择一个角色')
    return
  }

  roleSubmitting.value = true
  try {
    const response = await updateAdminUserRoles(roleTargetUserId.value, {
      roleCodes: [selectedRoleCode.value],
    })
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '保存角色失败')
    }
    roleModalOpen.value = false
    ojMessage.success('角色分配已更新')
    await loadUsers(pageState.current)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    roleSubmitting.value = false
  }
}

function openStatusModal(row: AdminUserVO) {
  if (statusSubmitting.value) {
    return
  }
  if (row.superAdmin) {
    ojMessage.warning('超管账号不允许执行启用/禁用操作')
    return
  }
  statusTargetUserId.value = row.id
  statusTargetUsername.value = row.username || String(row.id)
  statusNextValue.value = Number(row.status) === 1 ? 0 : 1
  statusModalOpen.value = true
}

function closeStatusModal() {
  if (statusSubmitting.value) {
    return
  }
  statusModalOpen.value = false
}

async function handleConfirmStatus() {
  if (statusSubmitting.value || !statusTargetUserId.value) {
    return
  }
  statusSubmitting.value = true
  try {
    const response = await updateAdminUserStatus(statusTargetUserId.value, {
      status: statusNextValue.value,
    })
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '更新用户状态失败')
    }
    statusModalOpen.value = false
    ojMessage.success(statusNextValue.value === 1 ? '已启用该账号' : '已禁用该账号')
    await loadUsers(pageState.current)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    statusSubmitting.value = false
  }
}

function openConfigModal(row: AdminSystemConfigVO) {
  if (configSubmitting.value) {
    return
  }
  editingConfigId.value = row.id
  configEditForm.configKey = row.configKey || ''
  configEditForm.configName = row.configName || ''
  configEditForm.configValue = row.configValue || ''
  configEditForm.valueType = row.valueType || 'STRING'
  configEditForm.category = row.category || '-'
  configEditForm.description = row.description || ''
  configEditForm.status = Number(row.status) === 0 ? '0' : '1'
  configModalOpen.value = true
}

function closeConfigModal() {
  if (configSubmitting.value) {
    return
  }
  configModalOpen.value = false
}

async function handleSaveConfig() {
  if (configSubmitting.value || !editingConfigId.value) {
    return
  }
  if (!configEditForm.configValue.trim()) {
    ojMessage.warning('配置值不能为空')
    return
  }
  configSubmitting.value = true
  try {
    const response = await updateAdminSystemConfig(editingConfigId.value, {
      configValue: configEditForm.configValue.trim(),
      description: configEditForm.description.trim(),
      status: Number(configEditForm.status) === 0 ? 0 : 1,
    })
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '保存系统配置失败')
    }
    configModalOpen.value = false
    ojMessage.success('系统配置已更新')
    await Promise.all([loadConfigs(configPageState.current), loadConfigCategories()])
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    configSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadRoleOptions(), loadConfigCategories()])
  await Promise.all([loadUsers(1), loadConfigs(1)])
  window.addEventListener('resize', resizeMonitorCharts)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

watch(
  () => activeTab.value,
  (nextTab) => {
    if (nextTab === 'monitor') {
      if (!monitorInitialized.value) {
        void loadMonitorDashboard()
      }
      if (monitorAutoRefresh.value) {
        startMonitorRefreshTimer()
      }
      return
    }
    stopMonitorRefreshTimer()
  },
)

watch(
  () => monitorAutoRefresh.value,
  (enabled) => {
    if (!enabled) {
      stopMonitorRefreshTimer()
      return
    }
    if (activeTab.value === 'monitor') {
      startMonitorRefreshTimer()
    }
  },
)

onBeforeUnmount(() => {
  stopMonitorRefreshTimer()
  window.removeEventListener('resize', resizeMonitorCharts)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  disposeMonitorCharts()
})
</script>

<template>
  <section class="oj-page">
    <section class="admin-tabs">
      <OjCard
        v-for="item in adminTabs"
        :key="item.key"
        :tone="activeTab === item.key ? 'primary' : 'neutral'"
        :class="['admin-tab-card', { 'admin-tab-card--active': activeTab === item.key }]"
      >
        <button
          type="button"
          class="admin-tab-card__button"
          :aria-pressed="activeTab === item.key"
          @click="switchTab(item.key)"
        >
          <span class="admin-tab-card__label">{{ item.label }}</span>
          <span class="admin-tab-card__desc">{{ item.description }}</span>
        </button>
      </OjCard>
    </section>

    <template v-if="activeTab === 'users'">
      <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OjCard
          v-for="item in overviewCards"
          :key="item.key"
          tone="neutral"
          class="rounded-[18px]"
        >
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ item.label }}</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ item.value }}</p>
        </OjCard>
      </section>

      <OjTableLayout :loading="loading" loading-text="加载用户列表中...">
        <template #filters>
          <form class="oj-table-filter-grid grid gap-2 lg:grid-cols-[minmax(0,1fr)_170px_130px_auto]" @submit.prevent="handleSearch">
            <OjInput
              v-model="filterForm.keyword"
              placeholder="搜索用户名 / 姓名 / 学号"
              clearable
            />

            <OjSelect
              v-model="filterForm.roleCode"
              :options="roleFilterOptions"
              placeholder="角色"
              :disabled="roleLoading"
            />

            <OjSelect
              v-model="filterForm.status"
              :options="statusOptions"
              placeholder="状态"
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

        <el-table :data="records" row-key="id" height="440" table-layout="fixed">
          <el-table-column label="#" width="72">
            <template #default="{ $index }">
              {{ rowIndexStart + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="用户名" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <span class="truncate">{{ row.username }}</span>
                <OjBadge v-if="row.superAdmin" size="small" tone="primary">超管</OjBadge>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="realName" label="姓名" width="120" show-overflow-tooltip />
          <el-table-column label="角色" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              {{ roleLabel(row) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="96">
            <template #default="{ row }">
              <OjBadge size="small" :tone="statusTone(row.status)">
                {{ statusLabel(row.status) }}
              </OjBadge>
            </template>
          </el-table-column>
          <el-table-column prop="studentNo" label="学号/工号" width="156" show-overflow-tooltip />
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column label="性别" width="90">
            <template #default="{ row }">
              {{ genderLabel(row.gender) }}
            </template>
          </el-table-column>
          <el-table-column label="最后登录" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.lastLoginTime) }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="348" fixed="right">
            <template #default="{ row }">
              <div class="admin-action-group">
                <OjButton size="small" tone="secondary" :disabled="loading" @click="openEditModal(row)">编辑信息</OjButton>
                <OjButton size="small" tone="secondary" :disabled="loading || roleLoading" @click="openRoleModal(row)">分配角色</OjButton>
                <OjButton
                  size="small"
                  :tone="Number(row.status) === 1 ? 'danger' : 'primary'"
                  :disabled="loading"
                  @click="openStatusModal(row)"
                >
                  {{ Number(row.status) === 1 ? '禁用' : '启用' }}
                </OjButton>
              </div>
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
    </template>

    <template v-else-if="activeTab === 'configs'">
      <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OjCard
          v-for="item in configOverviewCards"
          :key="item.key"
          tone="neutral"
          class="rounded-[18px]"
        >
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ item.label }}</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ item.value }}</p>
        </OjCard>
      </section>

      <OjTableLayout :loading="configLoading" loading-text="加载系统配置中...">
        <template #filters>
          <form class="oj-table-filter-grid grid gap-2 lg:grid-cols-[minmax(0,1fr)_170px_130px_auto]" @submit.prevent="handleConfigSearch">
            <OjInput
              v-model="configFilterForm.keyword"
              placeholder="搜索配置键 / 名称 / 说明"
              clearable
            />

            <OjSelect
              v-model="configFilterForm.category"
              :options="configCategoryOptions"
              placeholder="分类"
            />

            <OjSelect
              v-model="configFilterForm.status"
              :options="configStatusOptions"
              placeholder="状态"
            />

            <div class="flex items-center gap-2">
              <OjButton size="small" tone="info" native-type="submit" :loading="configLoading" :disabled="configLoading">查询</OjButton>
              <OjButton size="small" tone="secondary" :disabled="configLoading" @click="handleConfigReset">重置</OjButton>
              <OjButton size="small" tone="secondary" :disabled="configLoading" @click="loadConfigs(configPageState.current)">
                刷新
              </OjButton>
            </div>
          </form>
        </template>

        <template #error>
          <div v-if="configErrorMessage" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {{ configErrorMessage }}
          </div>
        </template>

        <el-table :data="configRecords" row-key="id" height="420" table-layout="fixed">
          <el-table-column label="#" width="72">
            <template #default="{ $index }">
              {{ configRowIndexStart + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="configKey" label="配置键" min-width="220" show-overflow-tooltip />
          <el-table-column prop="configName" label="配置名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="configValue" label="配置值" min-width="150" show-overflow-tooltip />
          <el-table-column label="值类型" width="100">
            <template #default="{ row }">
              {{ formatValueType(row.valueType) }}
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="110" show-overflow-tooltip />
          <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <OjBadge size="small" :tone="statusTone(row.status)">
                {{ configStatusLabel(row.status) }}
              </OjBadge>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <OjButton size="small" tone="secondary" :disabled="configLoading" @click="openConfigModal(row)">
                编辑
              </OjButton>
            </template>
          </el-table-column>
        </el-table>

        <template #pagination>
          <OjPagination
            :current="configPageState.current"
            :page-size="configPageState.pageSize"
            :total="configPageState.total"
            :pages="configPageState.pages"
            @current-change="handleConfigPageChange"
            @page-size-change="handleConfigPageSizeChange"
          />
        </template>
      </OjTableLayout>
    </template>

    <template v-else>
      <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OjCard tone="neutral" class="rounded-[18px]">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">评测队列任务</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ monitorOverview.queueTaskCount }}</p>
        </OjCard>
        <OjCard tone="neutral" class="rounded-[18px]">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">在线判题节点</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ monitorOverview.onlineNodeCount }}</p>
        </OjCard>
        <OjCard tone="neutral" class="rounded-[18px]">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">今日提交量</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ monitorOverview.todaySubmissionCount }}</p>
        </OjCard>
      </section>

      <section class="grid grid-cols-1 gap-4">
        <OjCard tone="neutral" class="rounded-[18px]">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">系统运行概览</h3>
              <OjBadge size="small" :tone="judgeServiceStatusTone(monitorOverview.serviceStatus)">
                {{ judgeServiceStatusLabel(monitorOverview.serviceStatus) }}
              </OjBadge>
            </div>
            <div class="flex items-center gap-2">
              <label class="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input v-model="monitorAutoRefresh" type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300" />
                自动刷新(5s)
              </label>
              <OjButton size="small" tone="secondary" :loading="monitorLoading" @click="handleRefreshMonitorDashboard">
                刷新
              </OjButton>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-xs text-slate-500 dark:text-slate-400">题库总量</p>
              <p class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{{ monitorOverview.problemCount }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-xs text-slate-500 dark:text-slate-400">全站AC率</p>
              <p class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{{ monitorOverview.globalAcRate.toFixed(1) }}%</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-xs text-slate-500 dark:text-slate-400">最后更新</p>
              <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{{ monitorLastUpdated || '-' }}</p>
            </div>
          </div>
          <div v-if="monitorErrorMessage" class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {{ monitorErrorMessage }}
          </div>
        </OjCard>
      </section>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <OjCard tone="neutral" class="rounded-[18px] xl:col-span-2">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">系统资源监控（宿主机 + JVM）</h3>
            <div class="flex items-center gap-2">
              <OjBadge size="small" :tone="monitorSystemMetrics.containerized ? 'warning' : 'ac'">
                {{ monitorSystemMetrics.containerized ? '容器内运行' : '宿主机运行' }}
              </OjBadge>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                {{ monitorSystemMetrics.osName }} / {{ monitorSystemMetrics.osArch }}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-slate-400">系统CPU</span>
                <span class="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {{ safePercent(monitorSystemMetrics.systemCpuUsage).toFixed(1) }}%
                </span>
              </div>
              <div class="monitor-meter"><span :style="{ width: `${safePercent(monitorSystemMetrics.systemCpuUsage)}%` }"></span></div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-slate-400">进程CPU</span>
                <span class="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {{ safePercent(monitorSystemMetrics.processCpuUsage).toFixed(1) }}%
                </span>
              </div>
              <div class="monitor-meter"><span :style="{ width: `${safePercent(monitorSystemMetrics.processCpuUsage)}%` }"></span></div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-slate-400">系统内存</span>
                <span class="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {{ formatBytes(monitorSystemMetrics.systemMemoryTotal - monitorSystemMetrics.systemMemoryFree) }} / {{ formatBytes(monitorSystemMetrics.systemMemoryTotal) }}
                </span>
              </div>
              <div class="monitor-meter">
                <span
                  :style="{
                    width: `${safePercent((monitorSystemMetrics.systemMemoryTotal <= 0 ? 0 : ((monitorSystemMetrics.systemMemoryTotal - monitorSystemMetrics.systemMemoryFree) * 100) / monitorSystemMetrics.systemMemoryTotal))}%`,
                  }"
                ></span>
              </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-slate-400">JVM堆内存</span>
                <span class="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {{ formatBytes(monitorSystemMetrics.jvmHeapUsed) }} / {{ formatBytes(monitorSystemMetrics.jvmHeapTotal) }}
                </span>
              </div>
              <div class="monitor-meter">
                <span
                  :style="{
                    width: `${safePercent((monitorSystemMetrics.jvmHeapTotal <= 0 ? 0 : (monitorSystemMetrics.jvmHeapUsed * 100) / monitorSystemMetrics.jvmHeapTotal))}%`,
                  }"
                ></span>
              </div>
            </div>
          </div>
        </OjCard>
        <OjCard tone="neutral" class="rounded-[18px]">
          <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">资源摘要</h3>
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex items-center justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">系统负载</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-200">{{ monitorSystemMetrics.systemLoadAverage.toFixed(2) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">磁盘可用</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-200">{{ formatBytes(monitorSystemMetrics.diskUsable) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">磁盘总量</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-200">{{ formatBytes(monitorSystemMetrics.diskTotal) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">进程运行时长</dt>
              <dd class="font-medium text-slate-800 dark:text-slate-200">{{ formatDuration(monitorSystemMetrics.processUptimeMs) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">采集时间</dt>
              <dd class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ monitorSystemMetrics.collectedAt || '-' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">容器线索</dt>
              <dd class="text-xs font-medium text-slate-700 dark:text-slate-300">
                {{ monitorSystemMetrics.containerHint || '-' }}
              </dd>
            </div>
          </dl>
        </OjCard>
      </section>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <OjCard tone="neutral" class="rounded-[18px] xl:col-span-2">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">近7日提交趋势</h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">真实每日聚合（提交量 + AC率）</span>
          </div>
          <div ref="monitorTrendChartRef" class="monitor-chart"></div>
        </OjCard>
        <OjCard tone="neutral" class="rounded-[18px]">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">结果分布</h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">最近样本</span>
          </div>
          <div ref="monitorDistributionChartRef" class="monitor-chart monitor-chart--compact"></div>
        </OjCard>
      </section>

      <section class="grid grid-cols-1 gap-4">
        <OjCard tone="neutral" class="rounded-[18px]">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">监控体征雷达图</h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">综合活跃度/可用性/稳定性</span>
          </div>
          <div ref="monitorRadarChartRef" class="monitor-chart monitor-chart--radar"></div>
        </OjCard>
      </section>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OjCard tone="neutral" class="rounded-[18px]">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">最近提交</h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">展示最近 8 条</span>
          </div>
          <el-table v-loading="monitorLoading" :data="monitorRecentSubmissions" height="320" table-layout="fixed">
            <el-table-column label="用户" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                {{ monitorUserLabel(row) }}
              </template>
            </el-table-column>
            <el-table-column label="题目" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{ monitorProblemLabel(row) }}
              </template>
            </el-table-column>
            <el-table-column label="结果" width="110">
              <template #default="{ row }">
                <OjBadge size="small" :tone="submissionStatusTone(row.status)">
                  {{ submissionStatusLabel(row.status) }}
                </OjBadge>
              </template>
            </el-table-column>
            <el-table-column prop="language" label="语言" width="96" />
          </el-table>
        </OjCard>

        <OjCard tone="neutral" class="rounded-[18px]">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">近期比赛 / 作业</h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">来自首页概览</span>
          </div>
          <el-table v-loading="monitorLoading" :data="monitorRecentContests" height="320" table-layout="fixed">
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                {{ monitorTypeLabel(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="190" show-overflow-tooltip />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <OjBadge size="small" :tone="monitorContestStatusTone(row.statusText)">
                  {{ row.statusText || '-' }}
                </OjBadge>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" min-width="160" show-overflow-tooltip />
          </el-table>
        </OjCard>
      </section>

      <OjEmptyState
        v-if="!monitorLoading && !monitorErrorMessage && monitorRecentSubmissions.length === 0 && monitorRecentContests.length === 0"
        title="暂无可展示监控数据"
        description="当前未查询到最近提交和近期比赛信息，可稍后刷新重试。"
        tone="neutral"
      />
    </template>

    <OjModal
      v-model="editModalOpen"
      title="编辑用户信息"
      :description="editingUserId ? `用户ID：${editingUserId}` : ''"
      max-width="36rem"
      @close="closeEditModal"
    >
      <div class="admin-form-grid">
        <div>
          <label class="admin-field-label">用户名</label>
          <OjInput v-model="editForm.username" disabled />
        </div>
        <div>
          <label class="admin-field-label">真实姓名</label>
          <OjInput v-model="editForm.realName" placeholder="请输入真实姓名" />
        </div>
        <div>
          <label class="admin-field-label">学号/工号</label>
          <OjInput v-model="editForm.studentNo" placeholder="可留空" />
        </div>
        <div>
          <label class="admin-field-label">手机号</label>
          <OjInput v-model="editForm.phone" placeholder="可留空" />
        </div>
        <div class="md:col-span-2">
          <label class="admin-field-label">邮箱</label>
          <OjInput v-model="editForm.email" placeholder="可留空" />
        </div>
        <div>
          <label class="admin-field-label">性别</label>
          <OjSelect v-model="editForm.gender" :options="genderOptions" placeholder="性别" />
        </div>
      </div>

      <template #footer>
        <div class="admin-modal-footer">
          <OjButton tone="secondary" :disabled="editSubmitting" @click="closeEditModal">取消</OjButton>
          <OjButton tone="primary" :loading="editSubmitting" @click="handleSaveEdit">保存</OjButton>
        </div>
      </template>
    </OjModal>

    <OjModal
      v-model="roleModalOpen"
      title="分配角色"
      :description="roleTargetUsername ? `用户：${roleTargetUsername}` : ''"
      max-width="30rem"
      @close="closeRoleModal"
    >
      <div class="space-y-2">
        <label class="admin-field-label">角色（单选）</label>
        <OjSelect
          v-model="selectedRoleCode"
          :options="roleOptions.map((item) => ({ label: `${item.roleName} (${item.roleCode})`, value: item.roleCode }))"
          placeholder="请选择角色"
        />
      </div>

      <template #footer>
        <div class="admin-modal-footer">
          <OjButton tone="secondary" :disabled="roleSubmitting" @click="closeRoleModal">取消</OjButton>
          <OjButton tone="primary" :loading="roleSubmitting" @click="handleSaveRoles">保存角色</OjButton>
        </div>
      </template>
    </OjModal>

    <OjModal
      v-model="statusModalOpen"
      title="确认状态变更"
      :description="statusTargetUsername ? `账号：${statusTargetUsername}` : ''"
      max-width="28rem"
      @close="closeStatusModal"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        {{ statusNextValue === 1 ? '确认启用该账号？' : '确认禁用该账号？禁用后将无法登录系统。' }}
      </p>

      <template #footer>
        <div class="admin-modal-footer">
          <OjButton tone="secondary" :disabled="statusSubmitting" @click="closeStatusModal">取消</OjButton>
          <OjButton :tone="statusNextValue === 1 ? 'primary' : 'danger'" :loading="statusSubmitting" @click="handleConfirmStatus">
            {{ statusNextValue === 1 ? '确认启用' : '确认禁用' }}
          </OjButton>
        </div>
      </template>
    </OjModal>

    <OjModal
      v-model="configModalOpen"
      title="编辑系统配置"
      :description="editingConfigId ? `配置ID：${editingConfigId}` : ''"
      max-width="36rem"
      @close="closeConfigModal"
    >
      <div class="admin-form-grid">
        <div class="md:col-span-2">
          <label class="admin-field-label">配置键</label>
          <OjInput v-model="configEditForm.configKey" disabled />
        </div>
        <div>
          <label class="admin-field-label">配置名称</label>
          <OjInput v-model="configEditForm.configName" disabled />
        </div>
        <div>
          <label class="admin-field-label">值类型</label>
          <OjInput v-model="configEditForm.valueType" disabled />
        </div>
        <div>
          <label class="admin-field-label">分类</label>
          <OjInput v-model="configEditForm.category" disabled />
        </div>
        <div>
          <label class="admin-field-label">状态</label>
          <OjSelect v-model="configEditForm.status" :options="configStatusOptions.slice(1)" placeholder="状态" />
        </div>
        <div class="md:col-span-2">
          <label class="admin-field-label">配置值</label>
          <OjInput v-model="configEditForm.configValue" placeholder="请输入配置值" />
        </div>
        <div class="md:col-span-2">
          <label class="admin-field-label">说明</label>
          <OjInput v-model="configEditForm.description" placeholder="可留空" />
        </div>
      </div>

      <template #footer>
        <div class="admin-modal-footer">
          <OjButton tone="secondary" :disabled="configSubmitting" @click="closeConfigModal">取消</OjButton>
          <OjButton tone="primary" :loading="configSubmitting" @click="handleSaveConfig">保存配置</OjButton>
        </div>
      </template>
    </OjModal>
  </section>
</template>

<style scoped>
.admin-form-grid {
  display: grid;
  gap: 12px;
}

.admin-field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(100 116 139 / 1);
}

.admin-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.admin-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.admin-tab-card {
  border-radius: 16px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.admin-tab-card:hover {
  transform: translateY(-1px);
}

.admin-tab-card :deep(.oj-card__body) {
  padding: 14px 16px;
}

.admin-tab-card__button {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  text-align: left;
  background: transparent;
  cursor: pointer;
  color: inherit;
}

.admin-tab-card--active {
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.08);
}

.admin-tab-card__label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--oj-ink-soft);
}

.admin-tab-card__desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oj-muted);
}

.admin-tab-card--active .admin-tab-card__label {
  color: var(--oj-primary-strong);
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oj-table-layout :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
}

.admin-action-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.monitor-meter {
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(226 232 240 / 0.8);
}

.monitor-meter > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e 0%, #10b981 60%, #0ea5e9 100%);
  transition: width 0.3s ease;
}

.monitor-chart {
  width: 100%;
  min-height: 280px;
}

.monitor-chart--compact {
  min-height: 280px;
}

.monitor-chart--radar {
  min-height: 320px;
}

@media (min-width: 768px) {
  .admin-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .admin-tabs {
    grid-template-columns: 1fr;
  }
}

:global(:root[data-theme='dark']) .admin-field-label {
  color: rgb(148 163 184 / 1);
}
</style>
