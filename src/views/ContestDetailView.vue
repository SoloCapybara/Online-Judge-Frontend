<script setup lang="ts">
import axios from 'axios'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContestDetail, registerContest, type ContestDetailVO, type ContestProblemVO } from '../api/contest'
import { getSubmissionPage } from '../api/submission'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'
import { useUserStore } from '../stores/user'
import { ojMessage } from '../utils/message'

type BadgeTone = 'ac' | 'warning' | 'danger' | 'neutral' | 'judging'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const registering = ref(false)
const attemptLoading = ref(false)
const attemptLoadError = ref('')
const problemAttemptCountMap = ref<Record<string, number>>({})
const problemBestScoreMap = ref<Record<string, number>>({})
const problemAcceptedMap = ref<Record<string, boolean>>({})
const errorMessage = ref('')
const contest = ref<ContestDetailVO | null>(null)
let attemptStatsRequestSerial = 0
let statsAutoRefreshTimer: number | null = null

const contestId = computed(() => {
  const raw = route.params.id
  if (Array.isArray(raw)) {
    return String(raw[0] ?? '').trim()
  }
  return typeof raw === 'string' ? raw.trim() : ''
})

const isManager = computed(() => userStore.role === 'teacher' || userStore.role === 'admin')

const problemList = computed(() => {
  const list = contest.value?.problemList
  return Array.isArray(list) ? list : []
})
const submitLimitValue = computed(() => {
  const value = Number(contest.value?.submitLimit ?? 0)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
})
const hasSubmitLimit = computed(() => submitLimitValue.value > 0)
const contestAcLockEnabled = computed(
  () => String(contest.value?.type || '').toUpperCase() === 'CONTEST',
)
const scoreHiddenUntilEnd = computed(() => {
  const detail = contest.value
  if (!detail) {
    return false
  }
  const mode = String(detail.resultVisibleMode || '').toUpperCase()
  if (mode !== 'AFTER_END') {
    return false
  }
  return String(detail.statusText || '') !== '已结束'
})
const exhaustedProblemCount = computed(() => {
  if (!hasSubmitLimit.value) {
    return 0
  }
  const limit = submitLimitValue.value
  return problemList.value.filter((item) => {
    const used = Number(problemAttemptCountMap.value[String(item.problemId)] || 0)
    return used >= limit
  }).length
})

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '比赛详情加载失败'
  }
  return error instanceof Error ? error.message : '比赛详情加载失败'
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

function typeLabel(type: string | undefined) {
  return String(type || '').toUpperCase() === 'HOMEWORK' ? '作业' : '比赛'
}

function accessTypeLabel(accessType: string | undefined) {
  return String(accessType || '').toUpperCase() === 'PRIVATE' ? '私有' : '公开'
}

function resultVisibleLabel(mode: string | undefined) {
  return String(mode || '').toUpperCase() === 'AFTER_END' ? '结束后可见' : '实时可见'
}

function submitLimitLabel(limit: number | null | undefined) {
  const value = Number(limit ?? 0)
  if (!Number.isFinite(value) || value <= 0) {
    return '不限'
  }
  return `每题 ${Math.floor(value)} 次`
}

function submitRuleLabel(detail: ContestDetailVO | null) {
  if (!detail) {
    return '-'
  }
  return String(detail.type || '').toUpperCase() === 'HOMEWORK'
    ? '规则：可继续提交，按最高分计'
    : '规则：AC后不可再次提交'
}

function statusMeta(statusText: string | undefined): { label: string; tone: BadgeTone } {
  const text = String(statusText || '未知')
  if (text === '进行中') {
    return { label: text, tone: 'ac' }
  }
  if (text === '未开始') {
    return { label: text, tone: 'warning' }
  }
  if (text === '已结束') {
    return { label: text, tone: 'neutral' }
  }
  if (text === '已关闭') {
    return { label: text, tone: 'danger' }
  }
  return { label: text, tone: 'neutral' }
}

function registerDisabledReason(detail: ContestDetailVO | null) {
  if (!detail) {
    return '比赛信息不存在'
  }
  if (isManager.value) {
    return '教师/管理员无需报名'
  }
  if (detail.joined) {
    return '你已报名该比赛'
  }

  const statusText = String(detail.statusText || '')
  if (statusText === '未发布') {
    return '比赛未发布，暂不可报名'
  }
  if (statusText === '已结束') {
    return '比赛已结束，无法报名'
  }
  if (statusText === '已关闭') {
    return '比赛已关闭，无法报名'
  }
  return ''
}

function answerDisabledReason(detail: ContestDetailVO | null) {
  if (!detail) {
    return '比赛信息不存在'
  }
  if (isManager.value) {
    return ''
  }
  if (!detail.joined) {
    return '请先报名比赛后再答题'
  }
  const statusText = String(detail.statusText || '')
  if (statusText === '未发布') {
    return '比赛未发布，暂不能答题'
  }
  if (statusText === '未开始') {
    return '比赛未开始，暂不能提交'
  }
  if (statusText === '已结束') {
    return '比赛已结束，不能继续答题'
  }
  if (statusText === '已关闭') {
    return '比赛已关闭，不能继续答题'
  }
  return ''
}

function resolveAttemptUsed(problemId: string | number | null | undefined) {
  const key = String(problemId || '').trim()
  if (!key) {
    return 0
  }
  return Number(problemAttemptCountMap.value[key] || 0)
}

function resolveBestScore(problemId: string | number | null | undefined) {
  const key = String(problemId || '').trim()
  if (!key) {
    return 0
  }
  return Number(problemBestScoreMap.value[key] || 0)
}

function resolveAccepted(problemId: string | number | null | undefined) {
  const key = String(problemId || '').trim()
  if (!key) {
    return false
  }
  return Boolean(problemAcceptedMap.value[key])
}

function bestScoreMeta(
  problemId: string | number | null | undefined,
  fullScore: number | null | undefined,
): { label: string; tone: BadgeTone } {
  if (scoreHiddenUntilEnd.value) {
    return { label: '结束后可查看', tone: 'neutral' }
  }
  if (attemptLoadError.value && Object.keys(problemBestScoreMap.value).length === 0) {
    return { label: '统计失败', tone: 'danger' }
  }
  if (attemptLoading.value && Object.keys(problemBestScoreMap.value).length === 0) {
    return { label: '统计中', tone: 'judging' }
  }
  const best = Math.max(0, resolveBestScore(problemId))
  const target = Number(fullScore || 0)
  if (best <= 0) {
    return { label: '0', tone: 'neutral' }
  }
  if (target > 0 && best >= target) {
    return { label: String(best), tone: 'ac' }
  }
  return { label: String(best), tone: 'warning' }
}

function attemptMeta(problemId: string | number | null | undefined): { label: string; tone: BadgeTone } {
  const used = resolveAttemptUsed(problemId)
  const accepted = resolveAccepted(problemId)
  if (contestAcLockEnabled.value && accepted) {
    if (hasSubmitLimit.value) {
      return { label: `已通过 · 提交已锁定（已用 ${used}/${submitLimitValue.value}）`, tone: 'ac' }
    }
    return { label: '已通过 · 提交已锁定', tone: 'ac' }
  }
  if (!hasSubmitLimit.value) {
    return { label: '不限', tone: 'neutral' }
  }
  if (attemptLoadError.value) {
    return { label: '统计失败', tone: 'danger' }
  }
  if (attemptLoading.value && Object.keys(problemAttemptCountMap.value).length === 0) {
    return { label: '统计中', tone: 'judging' }
  }
  const limit = submitLimitValue.value
  const remaining = Math.max(0, limit - used)
  if (used >= limit) {
    return { label: `已达上限 ${used}/${limit}`, tone: 'danger' }
  }
  if (used > 0 || remaining < limit) {
    return { label: `已用 ${used}/${limit} · 剩余 ${remaining}`, tone: 'warning' }
  }
  return { label: `已用 0/${limit} · 剩余 ${remaining}`, tone: 'ac' }
}

async function loadProblemAttemptStats(detail: ContestDetailVO) {
  const contestIdText = String(detail.id || '').trim()
  if (!contestIdText) {
    problemAttemptCountMap.value = {}
    problemBestScoreMap.value = {}
    problemAcceptedMap.value = {}
    attemptLoadError.value = ''
    attemptLoading.value = false
    return
  }

  const requestSerial = ++attemptStatsRequestSerial
  attemptLoading.value = true
  attemptLoadError.value = ''

  try {
    const nextCountMap: Record<string, number> = {}
    const nextBestScoreMap: Record<string, number> = {}
    const nextAcceptedMap: Record<string, boolean> = {}
    let current = 1
    let pages = 1
    const maxPages = 200

    while (current <= pages && current <= maxPages) {
      const response = await getSubmissionPage({
        current,
        pageSize: 100,
        contestId: contestIdText,
        mine: true,
      })
      if (response.code !== 0 || !response.data) {
        throw new Error(response.message || '提交统计加载失败')
      }
      if (requestSerial !== attemptStatsRequestSerial) {
        return
      }

      const records = Array.isArray(response.data.records) ? response.data.records : []
      records.forEach((item) => {
        const key = String(item.problemId || '').trim()
        if (!key) {
          return
        }
        nextCountMap[key] = Number(nextCountMap[key] || 0) + 1
        const scoreValue = Number(item.score ?? 0)
        const safeScore = Number.isFinite(scoreValue) ? Math.max(0, scoreValue) : 0
        nextBestScoreMap[key] = Math.max(Number(nextBestScoreMap[key] || 0), safeScore)
        if (String(item.status || '').toUpperCase() === 'ACCEPTED') {
          nextAcceptedMap[key] = true
        }
      })

      const totalPages = Number(response.data.pages || 0)
      pages = totalPages > 0 ? totalPages : 1
      current += 1
    }
    if (requestSerial !== attemptStatsRequestSerial) {
      return
    }
    problemAttemptCountMap.value = nextCountMap
    problemBestScoreMap.value = nextBestScoreMap
    problemAcceptedMap.value = nextAcceptedMap
  } catch (error) {
    if (requestSerial !== attemptStatsRequestSerial) {
      return
    }
    problemAttemptCountMap.value = {}
    problemBestScoreMap.value = {}
    problemAcceptedMap.value = {}
    attemptLoadError.value = resolveErrorMessage(error)
  } finally {
    if (requestSerial === attemptStatsRequestSerial) {
      attemptLoading.value = false
    }
  }
}

async function loadContestDetail() {
  const id = contestId.value
  if (!id) {
    contest.value = null
    errorMessage.value = '比赛ID无效'
    return
  }
  loading.value = true
  errorMessage.value = ''
  attemptLoadError.value = ''
  problemAttemptCountMap.value = {}
  problemBestScoreMap.value = {}
  problemAcceptedMap.value = {}
  try {
    const response = await getContestDetail(id)
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '比赛详情加载失败')
    }
    contest.value = response.data
    await loadProblemAttemptStats(response.data)
  } catch (error) {
    contest.value = null
    errorMessage.value = resolveErrorMessage(error)
    attemptLoading.value = false
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (loading.value || registering.value) {
    return
  }
  const detail = contest.value
  const reason = registerDisabledReason(detail)
  if (reason) {
    ojMessage.warning(reason)
    return
  }
  if (!detail) {
    return
  }

  let payload: { accessPassword?: string } | undefined
  if (String(detail.accessType || '').toUpperCase() === 'PRIVATE') {
    const password = window.prompt('该比赛为私有比赛，请输入访问密码')
    if (password === null) {
      return
    }
    const trimmed = password.trim()
    if (!trimmed) {
      ojMessage.warning('访问密码不能为空')
      return
    }
    payload = { accessPassword: trimmed }
  }

  registering.value = true
  try {
    const response = await registerContest(detail.id, payload)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '报名失败')
    }
    contest.value = {
      ...detail,
      joined: true,
      participantCount: Number(detail.participantCount || 0) + 1,
    }
    ojMessage.success('报名成功')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    registering.value = false
  }
}

function goBackToContestList() {
  void router.push({ name: 'contests' })
}

function goProblem(problem: ContestProblemVO) {
  const detail = contest.value
  if (!detail || !problem.problemId) {
    return
  }
  const reason = answerDisabledReason(detail)
  if (reason) {
    ojMessage.warning(reason)
    return
  }
  if (contestAcLockEnabled.value && resolveAccepted(problem.problemId)) {
    ojMessage.warning('该题已通过，比赛模式下不可再次提交（可继续查看题目）')
  }
  const meta = attemptMeta(problem.problemId)
  if (meta.tone === 'danger') {
    ojMessage.warning('该题提交次数已达上限，可查看题目但无法继续提交')
  }
  void router.push({
    name: 'problem-detail',
    params: { id: String(problem.problemId) },
    query: { contestId: String(detail.id) },
  })
}

function stopAutoRefreshStats() {
  if (statsAutoRefreshTimer !== null) {
    window.clearInterval(statsAutoRefreshTimer)
    statsAutoRefreshTimer = null
  }
}

function setupAutoRefreshStats(detail: ContestDetailVO | null) {
  stopAutoRefreshStats()
  if (!detail || String(detail.statusText || '') !== '进行中') {
    return
  }
  statsAutoRefreshTimer = window.setInterval(() => {
    if (attemptLoading.value || loading.value || !contest.value) {
      return
    }
    void loadProblemAttemptStats(contest.value)
  }, 10000)
}

watch(contestId, () => {
  void loadContestDetail()
}, { immediate: true })

watch(contest, (value) => {
  setupAutoRefreshStats(value)
}, { deep: false })

onUnmounted(() => {
  stopAutoRefreshStats()
})
</script>

<template>
  <section class="oj-page">
    <OjCard
      tone="primary"
      :eyebrow="contest ? `${typeLabel(contest.type)} #${contest.id}` : '比赛详情'"
      :title="contest?.title || '比赛详情'"
      :description="contest?.description || '暂无描述'"
      class="contest-detail-head"
    >
      <div class="contest-detail-head__toolbar">
        <OjButton tone="secondary" size="small" :disabled="loading" @click="goBackToContestList">返回比赛列表</OjButton>
        <div class="contest-detail-head__actions">
          <OjButton tone="secondary" size="small" :disabled="loading" @click="loadContestDetail">刷新</OjButton>
          <OjButton
            v-if="!isManager"
            tone="primary"
            size="small"
            :title="registerDisabledReason(contest)"
            :loading="registering"
            :disabled="loading || registering"
            @click="handleRegister"
          >
            {{ contest?.joined ? '已报名' : '报名比赛' }}
          </OjButton>
        </div>
      </div>

      <div v-if="contest" class="contest-detail-head__meta">
        <OjBadge size="small" :tone="statusMeta(contest.statusText).tone">{{ statusMeta(contest.statusText).label }}</OjBadge>
        <OjBadge size="small" tone="neutral">{{ accessTypeLabel(contest.accessType) }}</OjBadge>
        <OjBadge size="small" tone="neutral">{{ resultVisibleLabel(contest.resultVisibleMode) }}</OjBadge>
        <OjBadge size="small" tone="neutral">提交限制：{{ submitLimitLabel(contest.submitLimit) }}</OjBadge>
        <OjBadge size="small" tone="neutral">{{ submitRuleLabel(contest) }}</OjBadge>
        <span>开始：{{ formatDateTime(contest.startTime) }}</span>
        <span>结束：{{ formatDateTime(contest.endTime) }}</span>
        <span>题目：{{ Number(contest.problemCount || 0) }}</span>
        <span>参与：{{ Number(contest.participantCount || 0) }}</span>
      </div>
    </OjCard>

    <el-alert
      v-if="contest && hasSubmitLimit"
      :type="exhaustedProblemCount > 0 ? 'warning' : 'info'"
      :closable="false"
      show-icon
      :title="`每题最多可提交 ${submitLimitValue} 次，当前已达上限 ${exhaustedProblemCount} / ${problemList.length} 题`"
      :description="attemptLoading ? '正在统计你的提交次数...' : (attemptLoadError ? `提交统计加载异常：${attemptLoadError}` : '进入题目页前可先查看下方提交进度。')"
    />

    <OjTableLayout :loading="loading" loading-text="比赛详情加载中...">
      <template #error>
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
        />
      </template>

      <el-empty v-if="!loading && contest && problemList.length === 0" description="该比赛暂无题目，请联系老师" />

      <el-table
        v-else-if="contest"
        :data="problemList"
        stripe
        height="460"
        table-layout="fixed"
      >
        <el-table-column label="#" width="64" align="center">
          <template #default="{ row, $index }">
            {{ row.displayOrder || $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="题目ID" width="220" align="center">
          <template #default="{ row }">
            #{{ row.problemId }}
          </template>
        </el-table-column>

        <el-table-column label="题目标题" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.problemTitle || `题目 #${row.problemId}` }}
          </template>
        </el-table-column>

        <el-table-column label="分值" width="90" align="center">
          <template #default="{ row }">
            {{ Number(row.score || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="我的最高分" width="130" align="center">
          <template #default="{ row }">
            <OjBadge size="small" :tone="bestScoreMeta(row.problemId, row.score).tone">
              {{ bestScoreMeta(row.problemId, row.score).label }}
            </OjBadge>
          </template>
        </el-table-column>

        <el-table-column label="提交进度" width="280" align="center">
          <template #default="{ row }">
            <OjBadge size="small" :tone="attemptMeta(row.problemId).tone">{{ attemptMeta(row.problemId).label }}</OjBadge>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <OjButton
              tone="info"
              size="small"
              :title="answerDisabledReason(contest)"
              @click="goProblem(row)"
            >
              去答题
            </OjButton>
          </template>
        </el-table-column>
      </el-table>
    </OjTableLayout>
  </section>
</template>

<style scoped>
.contest-detail-head__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.contest-detail-head__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.contest-detail-head__meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  font-size: 13px;
  color: rgb(71 85 105 / 1);
}

:root[data-theme='dark'] .contest-detail-head__meta {
  color: rgb(148 163 184 / 1);
}
</style>
