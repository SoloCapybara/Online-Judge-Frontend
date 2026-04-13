<script setup lang="ts">
import axios from 'axios'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  bindContestProblems,
  createContest,
  deleteContest,
  getContestDetail,
  getContestPage,
  registerContest,
  updateContestStatus,
  type ContestPageQueryRequest,
  type ContestVO,
} from '../api/contest'
import { getProblemPage, type ProblemVO } from '../api/problem'
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
  type: string
  status: string
}

type ContestCreateForm = {
  title: string
  description: string
  type: 'CONTEST' | 'HOMEWORK'
  accessType: 'PUBLIC' | 'PRIVATE'
  accessPassword: string
  submitLimit: string
  resultVisibleMode: 'REALTIME' | 'AFTER_END'
  startTime: string
  endTime: string
}

type ElTableLike = {
  clearSelection: () => void
  toggleRowSelection: (row: unknown, selected?: boolean) => void
}

const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const records = ref<ContestVO[]>([])
const registeringIds = ref<string[]>([])
const statusUpdatingIds = ref<string[]>([])
const deletingContestIds = ref<string[]>([])
const deleteConfirmOpen = ref(false)
const deleteTargetContest = ref<ContestVO | null>(null)

const createModalOpen = ref(false)
const creatingContest = ref(false)
const currentContest = ref<ContestVO | null>(null)

const bindModalOpen = ref(false)
const bindLoading = ref(false)
const bindingSubmitting = ref(false)
const bindingContestId = ref('')
const bindingContestTitle = ref('')

const bindProblemKeyword = ref('')
const bindProblemLoading = ref(false)
const bindProblemError = ref('')
const bindProblemRecords = ref<ProblemVO[]>([])
const bindProblemTableRef = ref<ElTableLike | null>(null)
const selectedProblemIds = ref<string[]>([])
const selectedProblemNameMap = ref<Record<string, string>>({})

const pageState = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
})

const bindProblemPageState = reactive({
  current: 1,
  pageSize: 8,
  total: 0,
  pages: 0,
})

const filterForm = reactive<FilterForm>({
  title: '',
  type: '',
  status: '',
})

const createForm = reactive<ContestCreateForm>({
  title: '',
  description: '',
  type: 'CONTEST',
  accessType: 'PUBLIC',
  accessPassword: '',
  submitLimit: '',
  resultVisibleMode: 'REALTIME',
  startTime: '',
  endTime: '',
})

const canManageContests = computed(
  () => userStore.role === 'teacher' || userStore.role === 'admin',
)

const selectedProblemDisplayList = computed(() =>
  selectedProblemIds.value.map((id) => ({
    id,
    title: selectedProblemNameMap.value[id] || `题目#${id}`,
  })),
)

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '比赛', value: 'CONTEST' },
  { label: '作业', value: 'HOMEWORK' },
] as const

const createTypeOptions = [
  { label: '比赛', value: 'CONTEST' },
  { label: '作业', value: 'HOMEWORK' },
] as const

const accessTypeOptions = [
  { label: '公开', value: 'PUBLIC' },
  { label: '私有', value: 'PRIVATE' },
] as const

const resultVisibleModeOptions = [
  { label: '实时可见', value: 'REALTIME' },
  { label: '结束后可见', value: 'AFTER_END' },
] as const

const statusOptions = computed(() => {
  if (canManageContests.value) {
    return [
      { label: '全部状态', value: '' },
      { label: '未发布', value: '0' },
      { label: '已发布', value: '1' },
      { label: '已结束', value: '2' },
      { label: '已关闭', value: '3' },
    ]
  }
  return [
    { label: '全部状态', value: '' },
    { label: '已发布', value: '1' },
    { label: '已结束', value: '2' },
  ]
})

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
    const backendMessage = (error.response?.data as { message?: string } | undefined)
      ?.message
    return backendMessage || error.message || '请求失败'
  }
  return error instanceof Error ? error.message : '请求失败'
}

function buildQuery(current = pageState.current): ContestPageQueryRequest {
  const title = filterForm.title.trim()
  return {
    current,
    pageSize: pageState.pageSize,
    ...(title ? { title } : {}),
    ...(filterForm.type ? { type: filterForm.type } : {}),
    ...(toOptionalNumber(filterForm.status) !== undefined
      ? { status: toOptionalNumber(filterForm.status) }
      : {}),
    ...(canManageContests.value ? { mine: false } : {}),
  }
}

async function loadContests(current = pageState.current) {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getContestPage(buildQuery(current))
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '比赛列表加载失败')
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
  void loadContests(1)
}

function handleReset() {
  filterForm.title = ''
  filterForm.type = ''
  filterForm.status = ''
  pageState.current = 1
  void loadContests(1)
}

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  void loadContests(nextPage)
}

function handlePageSizeChange(nextSize: number) {
  pageState.pageSize = nextSize
  pageState.current = 1
  void loadContests(1)
}

function openContest(contestId: string) {
  if (!contestId) {
    return
  }
  void router.push({ name: 'contest-detail', params: { id: contestId } })
}

function isRegistering(contestId: string) {
  return registeringIds.value.includes(contestId)
}

function isStatusUpdating(contestId: string) {
  return statusUpdatingIds.value.includes(contestId)
}

function isDeletingContest(contestId: string) {
  return deletingContestIds.value.includes(contestId)
}

function registerDisabledReason(contest: ContestVO) {
  if (contest.joined) {
    return '你已报名该比赛'
  }
  const statusText = String(contest.statusText || '')
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

function canEditProblemSet(contest: ContestVO) {
  return Number(contest.status) === 0
}

function bindProblemEditHint(contest: ContestVO) {
  if (canEditProblemSet(contest)) {
    return ''
  }
  return '仅未发布(草稿)状态可修改题目集'
}

async function handleRegister(contest: ContestVO) {
  if (isRegistering(contest.id) || isStatusUpdating(contest.id)) {
    return
  }
  const disabledReason = registerDisabledReason(contest)
  if (disabledReason) {
    ojMessage.warning(disabledReason)
    return
  }
  registeringIds.value.push(contest.id)
  try {
    const response = await registerContest(contest.id)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '报名失败')
    }
    contest.joined = true
    contest.participantCount = Number(contest.participantCount || 0) + 1
    ojMessage.success('报名成功')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    registeringIds.value = registeringIds.value.filter((id) => id !== contest.id)
  }
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

function statusMeta(contest: ContestVO) {
  const text = String(contest.statusText || '未知')
  if (text === '进行中') {
    return { label: text, tone: 'ac' as const }
  }
  if (text === '未开始') {
    return { label: text, tone: 'warning' as const }
  }
  if (text === '已结束') {
    return { label: text, tone: 'neutral' as const }
  }
  if (text === '已关闭') {
    return { label: text, tone: 'danger' as const }
  }
  return { label: text, tone: 'neutral' as const }
}

function typeLabel(type: string) {
  return type === 'HOMEWORK' ? '作业' : '比赛'
}

function statusActionMeta(contest: ContestVO) {
  const status = Number(contest.status)
  if (status === 0) {
    const problemCount = Number(contest.problemCount || 0)
    return {
      label: '发布',
      tone: 'primary' as const,
      targetStatus: 1 as const,
      successText: '比赛已发布',
      disabledReason: problemCount > 0 ? '' : '请先绑定至少1道题后再发布',
    }
  }
  if (status === 1 || status === 2) {
    return { label: '关闭', tone: 'danger' as const, targetStatus: 3 as const, successText: '比赛已关闭' }
  }
  if (status === 3) {
    return { label: '重新发布', tone: 'info' as const, targetStatus: 1 as const, successText: '比赛已重新发布' }
  }
  return null
}

const deletingTargetContest = computed(() => {
  const target = deleteTargetContest.value
  if (!target) {
    return false
  }
  return isDeletingContest(target.id)
})

const deleteConfirmTitle = computed(() => {
  const target = deleteTargetContest.value
  if (!target) {
    return '确认删除'
  }
  return `确认删除${typeLabel(target.type)}`
})

const deleteConfirmDescription = computed(() => {
  const target = deleteTargetContest.value
  if (!target) {
    return ''
  }
  const prefix = typeLabel(target.type)
  return `你将永久删除「${prefix}：${target.title}」。该操作会同时删除题目集绑定、报名记录、该${prefix}下所有提交记录与测试点明细，以及排行榜缓存，且不可恢复。`
})

async function handleUpdateStatus(contest: ContestVO) {
  const action = statusActionMeta(contest)
  if (!action || isStatusUpdating(contest.id)) {
    return
  }
  if (action.disabledReason) {
    ojMessage.warning(action.disabledReason)
    return
  }
  statusUpdatingIds.value.push(contest.id)
  try {
    const response = await updateContestStatus(contest.id, { status: action.targetStatus })
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '更新状态失败')
    }
    ojMessage.success(action.successText)
    await loadContests(pageState.current)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter((id) => id !== contest.id)
  }
}

function openDeleteContestModal(contest: ContestVO) {
  if (!canManageContests.value || loading.value || isDeletingContest(contest.id)) {
    return
  }
  if (isStatusUpdating(contest.id) || isRegistering(contest.id)) {
    return
  }
  deleteTargetContest.value = contest
  deleteConfirmOpen.value = true
}

function closeDeleteContestModal() {
  if (deletingTargetContest.value) {
    return
  }
  deleteConfirmOpen.value = false
  deleteTargetContest.value = null
}

async function confirmDeleteContest() {
  const target = deleteTargetContest.value
  if (!target || isDeletingContest(target.id)) {
    return
  }
  deletingContestIds.value.push(target.id)
  try {
    const response = await deleteContest(target.id)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '删除比赛失败')
    }
    ojMessage.success(`${typeLabel(target.type)}已删除`)
    deleteConfirmOpen.value = false
    deleteTargetContest.value = null
    const nextPage = records.value.length <= 1 && pageState.current > 1
      ? pageState.current - 1
      : pageState.current
    pageState.current = nextPage
    await loadContests(nextPage)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    deletingContestIds.value = deletingContestIds.value.filter((id) => id !== target.id)
  }
}

function toDateTimeLocalValue(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  const min = `${date.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

function resetCreateForm() {
  const start = new Date(Date.now() + 60 * 60 * 1000)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

  createForm.title = ''
  createForm.description = ''
  createForm.type = 'CONTEST'
  createForm.accessType = 'PUBLIC'
  createForm.accessPassword = ''
  createForm.submitLimit = ''
  createForm.resultVisibleMode = 'REALTIME'
  createForm.startTime = toDateTimeLocalValue(start)
  createForm.endTime = toDateTimeLocalValue(end)
}

function openCreateModal() {
  resetCreateForm()
  createModalOpen.value = true
}

function closeCreateModal() {
  if (creatingContest.value) {
    return
  }
  createModalOpen.value = false
}

function toApiDateTime(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.length === 16 ? `${trimmed}:00` : trimmed
}

async function handleCreateContest() {
  const title = createForm.title.trim()
  if (!title) {
    ojMessage.warning('比赛标题不能为空')
    return
  }
  if (!createForm.startTime || !createForm.endTime) {
    ojMessage.warning('请设置开始和结束时间')
    return
  }
  const start = new Date(createForm.startTime)
  const end = new Date(createForm.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    ojMessage.warning('结束时间必须晚于开始时间')
    return
  }

  const submitLimit = createForm.submitLimit.trim()
  let submitLimitValue: number | undefined
  if (submitLimit) {
    const parsed = Number(submitLimit)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      ojMessage.warning('提交次数限制必须为正整数')
      return
    }
    submitLimitValue = parsed
  }

  if (createForm.accessType === 'PRIVATE' && !createForm.accessPassword.trim()) {
    ojMessage.warning('私有比赛必须填写访问密码')
    return
  }

  creatingContest.value = true
  try {
    const response = await createContest({
      title,
      description: createForm.description.trim() || undefined,
      type: createForm.type,
      status: 0,
      accessType: createForm.accessType,
      accessPassword: createForm.accessType === 'PRIVATE'
        ? createForm.accessPassword.trim()
        : undefined,
      submitLimit: submitLimitValue,
      resultVisibleMode: createForm.resultVisibleMode,
      startTime: toApiDateTime(createForm.startTime),
      endTime: toApiDateTime(createForm.endTime),
    })
    if (response.code !== 0 || !response.data?.contestId) {
      throw new Error(response.message || '创建比赛失败')
    }

    ojMessage.success(`创建成功，比赛ID：${response.data.contestId}`)
    createModalOpen.value = false
    pageState.current = 1
    await loadContests(1)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    creatingContest.value = false
  }
}

function resetBindState() {
  currentContest.value = null
  bindLoading.value = false
  bindingSubmitting.value = false
  bindingContestId.value = ''
  bindingContestTitle.value = ''
  bindProblemKeyword.value = ''
  bindProblemLoading.value = false
  bindProblemError.value = ''
  bindProblemRecords.value = []
  selectedProblemIds.value = []
  selectedProblemNameMap.value = {}
  bindProblemPageState.current = 1
  bindProblemPageState.pageSize = 8
  bindProblemPageState.total = 0
  bindProblemPageState.pages = 0
}

async function syncBindProblemTableSelection() {
  await nextTick()
  const table = bindProblemTableRef.value
  if (!table) {
    return
  }
  table.clearSelection()
  const selectedSet = new Set(selectedProblemIds.value)
  bindProblemRecords.value.forEach((row) => {
    if (selectedSet.has(String(row.id))) {
      table.toggleRowSelection(row, true)
    }
  })
}

async function loadBindProblemCandidates(current = bindProblemPageState.current) {
  bindProblemLoading.value = true
  bindProblemError.value = ''

  try {
    const response = await getProblemPage({
      current,
      pageSize: bindProblemPageState.pageSize,
      title: bindProblemKeyword.value.trim() || undefined,
    })
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '题目列表加载失败')
    }

    bindProblemRecords.value = Array.isArray(response.data.records) ? response.data.records : []
    bindProblemPageState.current = Number(response.data.current || current)
    bindProblemPageState.total = Number(response.data.total || 0)
    bindProblemPageState.pageSize = Number(response.data.size || bindProblemPageState.pageSize)
    bindProblemPageState.pages = Number(response.data.pages || 0)

    bindProblemRecords.value.forEach((row) => {
      const id = String(row.id)
      if (!selectedProblemNameMap.value[id]) {
        selectedProblemNameMap.value[id] = row.title || `题目#${id}`
      }
    })

    await syncBindProblemTableSelection()
  } catch (error) {
    bindProblemRecords.value = []
    bindProblemPageState.total = 0
    bindProblemPageState.pages = 0
    bindProblemError.value = resolveErrorMessage(error)
  } finally {
    bindProblemLoading.value = false
  }
}

async function openBindModal(contest: ContestVO) {
  if (bindLoading.value || bindingSubmitting.value) {
    return
  }

  resetBindState()
  currentContest.value = contest
  bindModalOpen.value = true
  bindLoading.value = true
  bindingContestId.value = contest.id
  bindingContestTitle.value = contest.title

  try {
    const detailResponse = await getContestDetail(contest.id)
    if (detailResponse.code !== 0 || !detailResponse.data) {
      throw new Error(detailResponse.message || '加载比赛详情失败')
    }

    const list = Array.isArray(detailResponse.data.problemList) ? detailResponse.data.problemList : []
    selectedProblemIds.value = list.map((item) => String(item.problemId))
    const nextNameMap: Record<string, string> = {}
    list.forEach((item) => {
      nextNameMap[String(item.problemId)] = item.problemTitle || `题目#${item.problemId}`
    })
    selectedProblemNameMap.value = nextNameMap

    await loadBindProblemCandidates(1)
  } catch (error) {
    bindProblemError.value = resolveErrorMessage(error)
  } finally {
    bindLoading.value = false
  }
}

function closeBindModal() {
  if (bindLoading.value || bindProblemLoading.value || bindingSubmitting.value) {
    return
  }
  bindModalOpen.value = false
}

function handleBindProblemSearch() {
  bindProblemPageState.current = 1
  void loadBindProblemCandidates(1)
}

function handleBindProblemReset() {
  bindProblemKeyword.value = ''
  bindProblemPageState.current = 1
  void loadBindProblemCandidates(1)
}

function handleBindProblemPageChange(nextPage: number) {
  bindProblemPageState.current = nextPage
  void loadBindProblemCandidates(nextPage)
}

function handleBindProblemPageSizeChange(nextSize: number) {
  bindProblemPageState.pageSize = nextSize
  bindProblemPageState.current = 1
  void loadBindProblemCandidates(1)
}

function handleBindProblemSelectionChange(selection: ProblemVO[]) {
  const currentPageIds = new Set(bindProblemRecords.value.map((row) => String(row.id)))
  const kept = selectedProblemIds.value.filter((id) => !currentPageIds.has(id))
  selection.forEach((row) => {
    const id = String(row.id)
    if (!kept.includes(id)) {
      kept.push(id)
    }
    selectedProblemNameMap.value[id] = row.title || `题目#${id}`
  })
  selectedProblemIds.value = kept
}

function removeSelectedProblem(problemId: string) {
  selectedProblemIds.value = selectedProblemIds.value.filter((id) => id !== problemId)
  delete selectedProblemNameMap.value[problemId]
  void syncBindProblemTableSelection()
}

function bindDifficultyLabel(difficulty: number | null | undefined) {
  if (difficulty === 1) {
    return '简单'
  }
  if (difficulty === 2) {
    return '中等'
  }
  if (difficulty === 3) {
    return '困难'
  }
  return '-'
}

async function handleBindProblems() {
  if (!currentContest.value) {
    ojMessage.warning('未找到当前比赛，请重新打开题目集')
    return
  }
  if (!canEditProblemSet(currentContest.value)) {
    ojMessage.warning('仅未发布(草稿)状态可修改题目集')
    return
  }
  
  if (!bindingContestId.value) {
    return
  }
  if (selectedProblemIds.value.length === 0) {
    ojMessage.warning('请至少选择一题')
    return
  }

  const validIds: string[] = []
  for (const id of selectedProblemIds.value) {
    if (!/^[1-9]\d*$/.test(id)) {
      ojMessage.warning(`题目ID不合法：${id}`)
      return
    }
    validIds.push(id)
  }

  bindingSubmitting.value = true
  try {
    const payload = {
      problemList: validIds.map((id, index) => ({
        problemId: id,
        displayOrder: index + 1,
        score: 100,
      })),
    }
    const response = await bindContestProblems(bindingContestId.value, payload)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '绑定题目失败')
    }

    ojMessage.success('题目集保存成功')
    bindModalOpen.value = false
    await loadContests(pageState.current)
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    bindingSubmitting.value = false
  }
}

onMounted(() => {
  void loadContests()
})
</script>

<template>
  <section class="oj-page">
    <OjTableLayout :loading="loading" loading-text="比赛数据加载中...">
      <template #filters>
        <form class="oj-table-filter-grid grid gap-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto]" @submit.prevent="handleSearch">
          <OjInput
            v-model="filterForm.title"
            placeholder="搜索比赛标题"
            clearable
          />

          <OjSelect
            v-model="filterForm.type"
            :options="typeOptions"
            placeholder="类型"
          />

          <OjSelect
            v-model="filterForm.status"
            :options="statusOptions"
            placeholder="状态"
          />

          <div class="flex items-center gap-2">
            <OjButton tone="info" size="small" native-type="submit" :loading="loading" :disabled="loading">
              查询
            </OjButton>
            <OjButton tone="secondary" size="small" :disabled="loading" @click="handleReset">
              重置
            </OjButton>
            <OjButton
              v-if="canManageContests"
              tone="primary"
              size="small"
              :disabled="loading"
              @click="openCreateModal"
            >
              创建比赛
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

      <el-table
        class="contest-table"
        :data="records"
        stripe
        height="440"
        table-layout="fixed"
      >
        <el-table-column label="序号" width="100" align="center">
          <template #default="{ $index }">
            {{ (pageState.current - 1) * pageState.pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="标题" min-width="260">
          <template #default="{ row }">
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ row.title }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.description || '暂无描述' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            {{ typeLabel(row.type) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <OjBadge size="small" :tone="statusMeta(row).tone">{{ statusMeta(row).label }}</OjBadge>
          </template>
        </el-table-column>

        <el-table-column label="时间" min-width="190" align="center">
          <template #default="{ row }">
            <div>{{ formatDateTime(row.startTime) }}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">~ {{ formatDateTime(row.endTime) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="题目数" width="90" align="center">
          <template #default="{ row }">
            {{ Number(row.problemCount || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="参与人数" width="100" align="center">
          <template #default="{ row }">
            {{ Number(row.participantCount || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="470" align="center" fixed="right">
          <template #default="{ row }">
            <div class="contest-action-group">
              <OjButton
                tone="info"
                size="small"
                :disabled="bindLoading || bindingSubmitting || isStatusUpdating(row.id) || isDeletingContest(row.id)"
                @click="openContest(row.id)"
              >
                进入比赛
              </OjButton>

              <OjButton
                v-if="canManageContests"
                tone="secondary"
                size="small"
                :title="bindProblemEditHint(row)"
                :disabled="bindLoading || bindingSubmitting || isStatusUpdating(row.id) || isDeletingContest(row.id)"
                @click="openBindModal(row)"
              >
                题目集
              </OjButton>

              <OjButton
                v-if="canManageContests && statusActionMeta(row)"
                :tone="statusActionMeta(row)?.tone || 'secondary'"
                size="small"
                :title="statusActionMeta(row)?.disabledReason || ''"
                :loading="isStatusUpdating(row.id)"
                :disabled="isStatusUpdating(row.id) || isDeletingContest(row.id)"
                @click="handleUpdateStatus(row)"
              >
                {{ statusActionMeta(row)?.label }}
              </OjButton>

              <OjButton
                size="small"
                :tone="row.joined ? 'secondary' : 'primary'"
                :title="registerDisabledReason(row)"
                :disabled="row.joined || isRegistering(row.id) || isStatusUpdating(row.id) || isDeletingContest(row.id)"
                :loading="isRegistering(row.id)"
                @click="handleRegister(row)"
              >
                {{ row.joined ? '已报名' : '报名' }}
              </OjButton>

              <OjButton
                v-if="canManageContests"
                tone="danger"
                size="small"
                :disabled="isDeletingContest(row.id) || isStatusUpdating(row.id) || isRegistering(row.id)"
                :loading="isDeletingContest(row.id)"
                @click="openDeleteContestModal(row)"
              >
                删除
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

    <OjModal
      v-model="createModalOpen"
      title="创建比赛/作业"
      :close-on-overlay="!creatingContest"
      :close-on-esc="!creatingContest"
      :show-close="!creatingContest"
      max-width="44rem"
      @close="closeCreateModal"
    >
      <div class="contest-modal-grid">
        <label class="contest-field contest-field-full">
          <span class="contest-field__label">标题</span>
          <OjInput v-model="createForm.title" placeholder="例如：算法周赛 No.1" />
        </label>

        <label class="contest-field contest-field-full">
          <span class="contest-field__label">描述</span>
          <OjInput v-model="createForm.description" type="textarea" :rows="3" placeholder="填写比赛说明（可选）" />
        </label>

        <label class="contest-field">
          <span class="contest-field__label">类型</span>
          <OjSelect v-model="createForm.type" :options="createTypeOptions" placeholder="类型" />
        </label>

        <div class="contest-field contest-field-full contest-field__hint">创建后默认为未发布，需先绑定题目再发布。</div>

        <label class="contest-field">
          <span class="contest-field__label">参与方式</span>
          <OjSelect v-model="createForm.accessType" :options="accessTypeOptions" placeholder="参与方式" />
        </label>

        <label class="contest-field">
          <span class="contest-field__label">结果可见</span>
          <OjSelect v-model="createForm.resultVisibleMode" :options="resultVisibleModeOptions" placeholder="结果可见" />
        </label>

        <label class="contest-field">
          <span class="contest-field__label">开始时间</span>
          <input v-model="createForm.startTime" class="contest-datetime-input" type="datetime-local" />
        </label>

        <label class="contest-field">
          <span class="contest-field__label">结束时间</span>
          <input v-model="createForm.endTime" class="contest-datetime-input" type="datetime-local" />
        </label>

        <label class="contest-field">
          <span class="contest-field__label">提交次数限制</span>
          <OjInput v-model="createForm.submitLimit" placeholder="留空表示不限" />
        </label>

        <label v-if="createForm.accessType === 'PRIVATE'" class="contest-field">
          <span class="contest-field__label">访问密码</span>
          <OjInput v-model="createForm.accessPassword" type="password" placeholder="私有比赛必填" />
        </label>
      </div>

      <template #footer>
        <div class="contest-modal-footer">
          <OjButton tone="secondary" :disabled="creatingContest" @click="closeCreateModal">取消</OjButton>
          <OjButton tone="primary" :loading="creatingContest" @click="handleCreateContest">创建</OjButton>
        </div>
      </template>
    </OjModal>

    <OjModal
      v-model="bindModalOpen"
      :title="`绑定题目集 · ${bindingContestTitle || ''}`"
      :close-on-overlay="!bindLoading && !bindProblemLoading && !bindingSubmitting"
      :close-on-esc="!bindLoading && !bindProblemLoading && !bindingSubmitting"
      :show-close="!bindLoading && !bindProblemLoading && !bindingSubmitting"
      max-width="56rem"
      @close="closeBindModal"
    >
      <div v-if="bindLoading" class="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        加载比赛详情中...
      </div>

      <div v-else class="space-y-3">
        <div class="contest-bind-toolbar">
          <OjInput
            v-model="bindProblemKeyword"
            placeholder="搜索题目标题"
            clearable
            @keyup.enter="handleBindProblemSearch"
          />
          <OjButton tone="info" size="small" :disabled="bindProblemLoading" @click="handleBindProblemSearch">查询</OjButton>
          <OjButton tone="secondary" size="small" :disabled="bindProblemLoading" @click="handleBindProblemReset">重置</OjButton>
        </div>

        <el-alert
          v-if="bindProblemError"
          :title="bindProblemError"
          type="error"
          show-icon
          :closable="false"
        />

        <el-table
          ref="bindProblemTableRef"
          :data="bindProblemRecords"
          row-key="id"
          stripe
          height="260"
          table-layout="fixed"
          v-loading="bindProblemLoading"
          @selection-change="handleBindProblemSelectionChange"
        >
          <el-table-column type="selection" width="52" />

          <el-table-column label="#" width="64" align="center">
            <template #default="{ $index }">
              {{ (bindProblemPageState.current - 1) * bindProblemPageState.pageSize + $index + 1 }}
            </template>
          </el-table-column>

          <el-table-column label="题目ID" width="140" align="center">
            <template #default="{ row }">#{{ row.id }}</template>
          </el-table-column>

          <el-table-column label="题目标题" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">{{ row.title }}</template>
          </el-table-column>

          <el-table-column label="难度" width="100" align="center">
            <template #default="{ row }">{{ bindDifficultyLabel(row.difficulty) }}</template>
          </el-table-column>
        </el-table>

        <OjPagination
          :current="bindProblemPageState.current"
          :page-size="bindProblemPageState.pageSize"
          :total="bindProblemPageState.total"
          :pages="bindProblemPageState.pages"
          :page-sizes="[8, 10, 20]"
          @current-change="handleBindProblemPageChange"
          @page-size-change="handleBindProblemPageSizeChange"
        />

        <div class="contest-selected-panel">
          <div class="contest-selected-title">已选择 {{ selectedProblemIds.length }} 题（跨页保留）</div>
          <div v-if="selectedProblemDisplayList.length" class="contest-selected-list">
            <span v-for="item in selectedProblemDisplayList" :key="item.id" class="contest-selected-chip">
              <span class="contest-selected-chip__text">#{{ item.id }} {{ item.title }}</span>
              <button type="button" class="contest-selected-chip__remove" @click="removeSelectedProblem(item.id)">×</button>
            </span>
          </div>
          <div v-else class="text-sm text-slate-500 dark:text-slate-400">暂未选择题目</div>
        </div>
      </div>

      <template #footer>
        <div class="contest-modal-footer">
          <OjButton tone="secondary" :disabled="bindLoading || bindProblemLoading || bindingSubmitting" @click="closeBindModal">取消</OjButton>
          <OjButton tone="primary" :loading="bindingSubmitting" :disabled="bindLoading || bindProblemLoading" @click="handleBindProblems">保存题目集</OjButton>
        </div>
      </template>
    </OjModal>

    <OjModal
      v-model="deleteConfirmOpen"
      :title="deleteConfirmTitle"
      :close-on-overlay="!deletingTargetContest"
      :close-on-esc="!deletingTargetContest"
      :show-close="!deletingTargetContest"
      max-width="36rem"
      @close="closeDeleteContestModal"
    >
      <div class="space-y-3">
        <p class="text-sm text-slate-700 dark:text-slate-200">{{ deleteConfirmDescription }}</p>
        <p class="text-xs text-rose-600 dark:text-rose-300">
          删除后不可恢复，请确认后再执行。
        </p>
      </div>

      <template #footer>
        <div class="contest-modal-footer">
          <OjButton tone="secondary" :disabled="deletingTargetContest" @click="closeDeleteContestModal">取消</OjButton>
          <OjButton tone="danger" :loading="deletingTargetContest" @click="confirmDeleteContest">确认删除</OjButton>
        </div>
      </template>
    </OjModal>
  </section>
</template>

<style scoped>
.contest-table :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
}

.contest-action-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.contest-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.contest-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contest-field-full {
  grid-column: 1 / -1;
}

.contest-field__label {
  font-size: 13px;
  color: rgb(100 116 139 / 1);
}

.contest-field__hint {
  font-size: 13px;
  color: rgb(71 85 105 / 1);
}

.contest-datetime-input {
  width: 100%;
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid rgb(226 232 240 / 1);
  background: rgb(255 255 255 / 1);
  color: rgb(15 23 42 / 1);
  padding: 6px 10px;
}

.contest-datetime-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--oj-primary) 54%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--oj-primary) 16%, transparent);
}

.contest-bind-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
}

.contest-selected-panel {
  border: 1px solid rgb(226 232 240 / 1);
  border-radius: 10px;
  padding: 10px;
  background: rgb(248 250 252 / 0.65);
}

.contest-selected-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: rgb(71 85 105 / 1);
}

.contest-selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.contest-selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  border: 1px solid rgb(203 213 225 / 1);
  border-radius: 999px;
  padding: 2px 8px;
  background: rgb(255 255 255 / 1);
}

.contest-selected-chip__text {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: rgb(51 65 85 / 1);
}

.contest-selected-chip__remove {
  border: none;
  background: transparent;
  color: rgb(100 116 139 / 1);
  font-size: 16px;
  line-height: 1;
}

.contest-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:root[data-theme='dark'] .contest-field__label {
  color: rgb(148 163 184 / 1);
}

:root[data-theme='dark'] .contest-field__hint {
  color: rgb(148 163 184 / 1);
}

:root[data-theme='dark'] .contest-datetime-input {
  border-color: rgb(255 255 255 / 0.12);
  background: rgb(18 21 31 / 1);
  color: rgb(241 245 249 / 1);
}

:root[data-theme='dark'] .contest-selected-panel {
  border-color: rgb(255 255 255 / 0.1);
  background: rgb(18 21 31 / 0.9);
}

:root[data-theme='dark'] .contest-selected-title {
  color: rgb(148 163 184 / 1);
}

:root[data-theme='dark'] .contest-selected-chip {
  border-color: rgb(255 255 255 / 0.14);
  background: rgb(15 23 42 / 0.9);
}

:root[data-theme='dark'] .contest-selected-chip__text {
  color: rgb(203 213 225 / 1);
}

:root[data-theme='dark'] .contest-selected-chip__remove {
  color: rgb(148 163 184 / 1);
}

@media (max-width: 760px) {
  .contest-modal-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .contest-bind-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
