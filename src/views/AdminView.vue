<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
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

function goToStatusPage() {
  void router.push('/status')
}

function goToSubmissionsPage() {
  void router.push('/submissions')
}

function goToTeacherPage() {
  void router.push('/teacher')
}

onMounted(async () => {
  await Promise.all([loadRoleOptions(), loadConfigCategories()])
  await Promise.all([loadUsers(1), loadConfigs(1)])
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
      <OjEmptyState
        title="数据监控入口"
        description="系统运行监控、最新提交与成绩统计已拆分到独立页面。可从这里快速跳转到对应工作台。"
        tone="neutral"
      >
        <template #actions>
          <OjButton tone="info" size="small" @click="goToStatusPage">评测状态</OjButton>
          <OjButton tone="secondary" size="small" @click="goToSubmissionsPage">提交记录</OjButton>
          <OjButton tone="secondary" size="small" @click="goToTeacherPage">教师工作台</OjButton>
        </template>
      </OjEmptyState>
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
