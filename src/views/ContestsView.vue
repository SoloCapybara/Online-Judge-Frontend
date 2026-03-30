<script setup lang="ts">
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'

const contests = [
  { title: '程序设计基础周赛 No.12', time: '2026-03-28 19:00', status: '报名中', type: '课程作业' },
  { title: '数据结构专题训练', time: '2026-04-02 14:30', status: '即将开始', type: '实验' },
  { title: '算法设计月赛', time: '2026-04-06 20:00', status: '草稿', type: '竞赛' },
]

function statusTone(status: string) {
  if (status === '报名中') return 'success'
  if (status === '即将开始') return 'warning'
  return 'neutral'
}
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="oj-kicker">比赛与作业</div>
      <h1 class="mt-3 oj-page-title">比赛 / 作业活动</h1>
      <p class="oj-page-subtitle">用于展示课程作业、周赛和训练活动，后续可继续接报名、题目集和成绩统计接口。</p>
    </OjCard>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <OjCard
        v-for="contest in contests"
        :key="contest.title"
        tone="neutral"
        class="rounded-[18px]"
      >
        <div class="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/12 dark:text-indigo-300">
          {{ contest.type }}
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ contest.title }}</h2>
        <div class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ contest.time }}</div>
        <div class="mt-6 flex items-center justify-between gap-3">
          <OjBadge size="small" :tone="statusTone(contest.status)">{{ contest.status }}</OjBadge>
          <OjButton tone="secondary">管理题目集</OjButton>
        </div>
      </OjCard>
    </section>
  </section>
</template>
