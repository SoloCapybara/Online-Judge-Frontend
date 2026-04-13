<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  getContestPage,
  getContestRankPage,
  type ContestRankVO,
  type ContestVO,
} from '../api/contest'
import OjButton from '../components/ui/OjButton.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'

const loading = ref(false)
const errorMessage = ref('')
const contestOptions = ref<Array<{ label: string; value: string }>>([])
const selectedContestId = ref('')
const rankRecords = ref<ContestRankVO[]>([])

const pageState = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  pages: 0,
})

const hasContest = computed(() => contestOptions.value.length > 0)

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)
      ?.message
    return backendMessage || error.message || '排行榜加载失败'
  }
  return error instanceof Error ? error.message : '排行榜加载失败'
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
    label: `${contest.title}${contest.statusText ? `（${contest.statusText}）` : ''}`,
    value: String(contest.id),
  }))
  contestOptions.value = options

  if (!selectedContestId.value && options.length > 0) {
    selectedContestId.value = options[0].value
  }
}

async function loadRank(current = pageState.current) {
  if (!selectedContestId.value) {
    rankRecords.value = []
    pageState.total = 0
    pageState.pages = 0
    return
  }

  const response = await getContestRankPage(selectedContestId.value, {
    current,
    pageSize: pageState.pageSize,
  })
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || '排行榜加载失败')
  }

  rankRecords.value = Array.isArray(response.data.records) ? response.data.records : []
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
    await loadRank(1)
  } catch (error) {
    rankRecords.value = []
    pageState.total = 0
    pageState.pages = 0
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function handleContestChange() {
  pageState.current = 1
  loading.value = true
  errorMessage.value = ''
  void loadRank(1)
    .catch((error) => {
      rankRecords.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

function handleRefresh() {
  loading.value = true
  errorMessage.value = ''
  void Promise.all([
    loadContestOptions(),
    loadRank(pageState.current),
  ])
    .catch((error) => {
      rankRecords.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  loading.value = true
  errorMessage.value = ''
  void loadRank(nextPage)
    .catch((error) => {
      rankRecords.value = []
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
  void loadRank(1)
    .catch((error) => {
      rankRecords.value = []
      pageState.total = 0
      pageState.pages = 0
      errorMessage.value = resolveErrorMessage(error)
    })
    .finally(() => {
      loading.value = false
    })
}

function displayUser(row: ContestRankVO) {
  const realName = String(row.realName || '').trim()
  if (realName) {
    return realName
  }
  const username = String(row.username || '').trim()
  if (username) {
    return username
  }
  return `用户${row.userId}`
}

watch(selectedContestId, () => {
  if (!selectedContestId.value) {
    rankRecords.value = []
    pageState.total = 0
    pageState.pages = 0
    return
  }
  handleContestChange()
})

onMounted(() => {
  void loadAll()
})
</script>

<template>
  <section class="oj-page">
    <OjTableLayout :loading="loading" loading-text="排行榜加载中...">
      <template #filters>
        <div class="oj-table-filter-grid grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <OjSelect
            v-model="selectedContestId"
            :options="contestOptions"
            placeholder="请选择比赛"
          />

          <div class="flex items-center gap-2">
            <OjButton
              tone="secondary"
              size="small"
              :disabled="loading"
              @click="handleRefresh"
            >
              刷新
            </OjButton>
          </div>
        </div>
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

      <el-empty v-if="!hasContest" description="暂无可查看的比赛" />

      <el-table v-else :data="rankRecords" stripe style="width: 100%">
        <el-table-column prop="rank" label="排名" width="100" align="center" />

        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ displayUser(row) }}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">@{{ row.username || row.userId }}</div>
          </template>
        </el-table-column>

        <el-table-column label="通过题数" width="120" align="center">
          <template #default="{ row }">
            {{ Number(row.acCount || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="总分" width="120" align="center">
          <template #default="{ row }">
            {{ Number(row.totalScore || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="罚时(分钟)" width="140" align="center">
          <template #default="{ row }">
            {{ Number(row.penaltyMinutes || 0) }}
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
