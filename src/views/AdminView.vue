<script setup lang="ts">
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'

const cards = [
  { title: '用户管理', description: '学生、教师和管理员账号维护、禁用与角色分配。', action: '管理账号' },
  { title: '系统配置', description: '设置判题资源限制、并发参数和运行策略。', action: '编辑配置' },
  { title: '系统监控', description: '查看判题服务、消息队列积压和容器状态。', action: '查看监控' },
]

const metrics = [
  { label: '用户总数', value: '1,284', hint: '+34 本周新增' },
  { label: '运行中的判题容器', value: '12', hint: '全部在线' },
  { label: '今日提交量', value: '2,431', hint: '峰值已过' },
]
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="oj-kicker">系统管理</div>
      <h1 class="mt-3 oj-page-title">管理台</h1>
      <p class="oj-page-subtitle">面向管理员的用户治理、系统配置和判题服务监控入口。</p>
    </OjCard>

    <section class="grid grid-cols-1 gap-5 md:grid-cols-3">
      <OjCard
        v-for="metric in metrics"
        :key="metric.label"
        tone="neutral"
        class="rounded-[18px]"
      >
        <div class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ metric.label }}</div>
        <div class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ metric.value }}</div>
        <div class="mt-3 text-sm text-slate-500 dark:text-slate-400">{{ metric.hint }}</div>
      </OjCard>
    </section>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <OjCard
        v-for="card in cards"
        :key="card.title"
        tone="accent"
        class="rounded-[18px]"
      >
        <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ card.title }}</h2>
        <p class="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ card.description }}</p>
        <div class="mt-6">
          <OjButton tone="secondary">{{ card.action }}</OjButton>
        </div>
      </OjCard>
    </section>
  </section>
</template>
