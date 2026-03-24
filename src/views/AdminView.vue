<script setup lang="ts">
const cards = [
  { title: '用户管理', description: '学生 / 教师 / 管理员账号维护、禁用与角色分配。', action: '管理账号' },
  { title: '题库管理', description: '新增题目、编辑测试用例、设置标签和判题限制。', action: '维护题目' },
  { title: '系统监控', description: '查看判题服务、消息队列积压、提交峰值和容器状态。', action: '查看监控' },
]

const metrics = [
  { label: '用户总数', value: '1,284' },
  { label: '运行中的判题容器', value: '12' },
  { label: '今日提交量', value: '2,431' },
]
</script>

<template>
  <section class="oj-page">
    <article class="oj-panel admin-panel">
      <h1 class="oj-page-title">管理台</h1>
      <p class="oj-page-subtitle">这是管理员视角面板，重点放在用户治理、系统配置和判题服务监控。</p>
    </article>

    <section class="oj-grid cols-3">
      <article v-for="metric in metrics" :key="metric.label" class="oj-panel oj-kpi">
        <div class="oj-kpi-label">{{ metric.label }}</div>
        <div class="oj-kpi-value">{{ metric.value }}</div>
      </article>
    </section>

    <section class="oj-grid cols-3">
      <article v-for="card in cards" :key="card.title" class="oj-panel admin-card">
        <h2>{{ card.title }}</h2>
        <p>{{ card.description }}</p>
        <el-button type="primary" plain>{{ card.action }}</el-button>
      </article>
    </section>
  </section>
</template>

<style scoped>
.admin-panel,
.admin-card {
  padding: 24px;
}

.admin-card h2 {
  margin: 0 0 10px;
}

.admin-card p {
  margin: 0 0 18px;
  color: var(--oj-muted);
}
</style>
