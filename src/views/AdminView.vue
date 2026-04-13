<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getAdminRoleOptions,
  getAdminUserPage,
  updateAdminUserProfile,
  updateAdminUserRoles,
  updateAdminUserStatus,
  type AdminRoleOptionVO,
  type AdminUserVO,
} from '../api/admin'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjModal from '../components/ui/OjModal.vue'
import OjPagination from '../components/ui/OjPagination.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import OjTableLayout from '../components/ui/OjTableLayout.vue'
import { ojMessage } from '../utils/message'

const loading = ref(false)
const errorMessage = ref('')
const records = ref<AdminUserVO[]>([])
const roleOptions = ref<AdminRoleOptionVO[]>([])
const roleLoading = ref(false)

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

const genderOptions = [
  { label: '未知', value: '0' },
  { label: '男', value: '1' },
  { label: '女', value: '2' },
] as const

const roleFilterOptions = computed(() => [
  { label: '全部角色', value: '' },
  ...roleOptions.value.map((item) => ({ label: item.roleName, value: item.roleCode })),
])

const rowIndexStart = computed(() => (pageState.current - 1) * pageState.pageSize)
const activeCount = computed(() => records.value.filter((item) => Number(item.status) === 1).length)
const disabledCount = computed(() => records.value.filter((item) => Number(item.status) === 0).length)
const overviewCards = computed(() => [
  { key: 'total', label: '用户总数', value: pageState.total },
  { key: 'active', label: '当前页启用', value: activeCount.value },
  { key: 'disabled', label: '当前页禁用', value: disabledCount.value },
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

onMounted(async () => {
  await loadRoleOptions()
  await loadUsers(1)
})
</script>

<template>
  <section class="oj-page">
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
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
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

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oj-table-layout :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
}

@media (min-width: 768px) {
  .admin-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

:global(:root[data-theme='dark']) .admin-field-label {
  color: rgb(148 163 184 / 1);
}
</style>
