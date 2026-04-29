<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import {
  getAdminPermissionList,
  getAdminRolePermissionList,
  updateAdminRolePermissions,
  type AdminPermissionVO,
  type AdminRolePermissionVO,
} from '../api/admin'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import { ojMessage } from '../utils/message'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const permissions = ref<AdminPermissionVO[]>([])
const rolePermissions = ref<AdminRolePermissionVO[]>([])
const selectedRoleCode = ref('')
const selectedPermissionCodes = ref<string[]>([])

const roleOptions = computed(() =>
  rolePermissions.value.map((item) => ({
    label: `${item.roleName}（${item.roleCode}）`,
    value: item.roleCode,
  })),
)
const isAdminRoleSelected = computed(() => selectedRoleCode.value.toUpperCase() === 'ADMIN')

const groupedPermissions = computed(() => {
  const groups: Array<{ type: string; items: AdminPermissionVO[] }> = []
  const map = new Map<string, AdminPermissionVO[]>()
  permissions.value.forEach((item) => {
    const type = String(item.permissionType || '').toUpperCase() || 'OTHER'
    const bucket = map.get(type) || []
    bucket.push(item)
    map.set(type, bucket)
  })
  ;['MENU', 'API', 'BUTTON', 'OTHER'].forEach((type) => {
    const items = map.get(type)
    if (items && items.length > 0) {
      groups.push({
        type,
        items: [...items].sort((a, b) => Number(a.sortNo || 0) - Number(b.sortNo || 0)),
      })
    }
  })
  return groups
})

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '权限中心请求失败'
  }
  return error instanceof Error ? error.message : '权限中心请求失败'
}

function syncRoleSelection() {
  if (!selectedRoleCode.value && rolePermissions.value.length > 0) {
    selectedRoleCode.value = rolePermissions.value[0].roleCode
  }
  if (selectedRoleCode.value.toUpperCase() === 'ADMIN') {
    selectedPermissionCodes.value = permissions.value
      .filter((item) => Number(item.status) === 1)
      .map((item) => item.permissionCode)
    return
  }
  const current = rolePermissions.value.find((item) => item.roleCode === selectedRoleCode.value)
  selectedPermissionCodes.value = current?.permissionCodes ? [...current.permissionCodes] : []
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [permissionRes, rolePermissionRes] = await Promise.all([
      getAdminPermissionList(),
      getAdminRolePermissionList(),
    ])
    if (permissionRes.code !== 0 || !permissionRes.data) {
      throw new Error(permissionRes.message || '加载权限点失败')
    }
    if (rolePermissionRes.code !== 0 || !rolePermissionRes.data) {
      throw new Error(rolePermissionRes.message || '加载角色权限失败')
    }
    permissions.value = Array.isArray(permissionRes.data) ? permissionRes.data : []
    rolePermissions.value = Array.isArray(rolePermissionRes.data) ? rolePermissionRes.data : []
    syncRoleSelection()
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function handleRoleChange() {
  syncRoleSelection()
}

async function handleSave() {
  if (!selectedRoleCode.value || saving.value) {
    return
  }
  if (isAdminRoleSelected.value) {
    ojMessage.warning('ADMIN 角色权限为系统内置固定全量权限，不允许修改')
    return
  }
  saving.value = true
  try {
    const payload = {
      roleCode: selectedRoleCode.value,
      permissionCodes: [...selectedPermissionCodes.value],
    }
    const response = await updateAdminRolePermissions(payload)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '保存角色权限失败')
    }
    ojMessage.success('角色权限已更新')
    await loadData()
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <section class="oj-page space-y-5">
    <OjCard tone="primary" class="rounded-[18px]">
      <div class="text-sm text-slate-500 dark:text-slate-300">管理员工具</div>
      <h1 class="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">权限中心</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">选择角色后勾选权限并保存，保存行为会覆盖该角色原有授权。</p>
    </OjCard>

    <OjCard tone="neutral" class="rounded-[18px] permission-card">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="w-[280px]">
          <OjSelect v-model="selectedRoleCode" :options="roleOptions" placeholder="选择角色" @change="handleRoleChange" />
        </div>
        <OjButton tone="secondary" size="small" :disabled="loading" @click="loadData">刷新</OjButton>
        <OjButton
          tone="primary"
          size="small"
          :disabled="loading || saving || !selectedRoleCode || isAdminRoleSelected"
          :loading="saving"
          @click="handleSave"
        >
          保存授权
        </OjButton>
      </div>

      <el-alert
        v-if="isAdminRoleSelected"
        title="ADMIN 角色使用系统内置全量权限，不允许在权限中心修改。"
        type="info"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <el-skeleton v-if="loading" :rows="6" animated />

      <el-empty
        v-else-if="!groupedPermissions.length"
        description="暂无权限点，请先初始化权限数据"
      />

      <div v-else class="space-y-4">
        <div v-for="group in groupedPermissions" :key="group.type" class="permission-group">
          <h3 class="mb-3 text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">{{ group.type }} 权限</h3>
          <el-checkbox-group v-model="selectedPermissionCodes" class="permission-grid">
            <el-checkbox
              v-for="item in group.items"
              :key="item.permissionCode"
              :value="item.permissionCode"
              class="permission-item"
              :disabled="isAdminRoleSelected"
            >
              <div class="permission-item__content">
                <div class="permission-item__name">{{ item.permissionName }}</div>
                <div class="permission-item__meta">{{ item.permissionCode }}</div>
                <div class="permission-item__meta permission-item__path">
                  {{ item.path ? `${item.path} ${item.method || ''}` : '—' }}
                </div>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </OjCard>
  </section>
</template>

<style scoped>
.permission-card {
  padding: 2px;
}

.permission-group {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  padding: 16px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.permission-item {
  margin-right: 0;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  min-height: 96px;
  padding: 10px 12px;
}

.permission-item__content {
  display: grid;
  grid-template-rows: 20px 18px 18px;
  gap: 2px;
}

:deep(.permission-item .el-checkbox__label) {
  width: 100%;
  padding-left: 8px;
}

:deep(.permission-item .el-checkbox__input) {
  align-self: flex-start;
  margin-top: 1px;
}

:deep(.permission-item .el-checkbox__label > *) {
  margin: 0;
}

.permission-item__name {
  font-size: 14px;
  font-weight: 600;
  color: rgb(15 23 42);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permission-item__meta {
  font-size: 12px;
  color: rgb(100 116 139);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.45;
}

.permission-item__path {
  opacity: 0.95;
}

.dark .permission-item__name {
  color: rgb(226 232 240);
}

.dark .permission-item__meta {
  color: rgb(148 163 184);
}

@media (max-width: 1280px) {
  .permission-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 960px) {
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
