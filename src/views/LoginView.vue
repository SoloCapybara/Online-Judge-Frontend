<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, type UserRole } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const demoAccounts = [
  { username: 'student01', role: 'student' as UserRole, label: '学生账号' },
  { username: 'teacher01', role: 'teacher' as UserRole, label: '教师账号' },
  { username: 'admin01', role: 'admin' as UserRole, label: '管理员账号' },
]

const form = reactive({
  username: 'student01',
  password: '123456',
  role: 'student' as UserRole,
})

function fillDemoAccount(role: UserRole) {
  const account = demoAccounts.find((item) => item.role === role)
  if (!account) {
    return
  }

  form.username = account.username
  form.role = account.role
  form.password = '123456'
}

async function handleLogin() {
  loading.value = true
  try {
    userStore.login(form.role, form.username)
    ElMessage.success('已进入前端演示环境')
    await router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-copy">
      <div class="copy-badge">Online Judge</div>
      <h1>让编程作业、竞赛和自动判题落到同一个系统里。</h1>
      <p>
        这个登录页已经是完整的 Vue 3 页面，你后面只需要把模拟登录替换成真实接口，并把 token 持久化逻辑接上即可。
      </p>
    </section>

    <section class="login-card oj-panel">
      <div class="card-header">
        <h2>登录系统</h2>
        <p>可直接切换三套 mock 账号查看不同角色面板</p>
      </div>

      <div class="demo-account-list">
        <el-button
          v-for="account in demoAccounts"
          :key="account.role"
          plain
          @click="fillDemoAccount(account.role)"
        >
          {{ account.label }}
        </el-button>
      </div>

      <el-form label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" :prefix-icon="User" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            show-password
            type="password"
          />
        </el-form-item>

        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio-button label="student">学生</el-radio-button>
            <el-radio-button label="teacher">教师</el-radio-button>
            <el-radio-button label="admin">管理员</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-button :loading="loading" class="submit-btn" size="large" type="primary" @click="handleLogin">
          进入系统
        </el-button>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 460px);
  align-items: center;
  gap: 24px;
  min-height: 100vh;
  padding: 24px;
}

.login-copy {
  padding: 32px;
}

.copy-badge {
  width: fit-content;
  margin-bottom: 18px;
  padding: 8px 14px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #1456c1, #f97316);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.login-copy h1 {
  margin: 0;
  font-size: clamp(38px, 6vw, 68px);
  line-height: 0.96;
}

.login-copy p {
  max-width: 620px;
  margin-top: 18px;
  color: var(--oj-muted);
  font-size: 18px;
}

.login-card {
  padding: 28px;
}

.card-header h2 {
  margin: 0;
  font-size: 28px;
}

.card-header p {
  margin: 8px 0 0;
  color: var(--oj-muted);
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
}

.demo-account-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 18px 0 8px;
}

@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-copy {
    padding: 8px;
  }
}
</style>
