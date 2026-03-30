<script setup lang="ts">
import OjBadge from '../components/ui/OjBadge.vue'
import OjCard from '../components/ui/OjCard.vue'

const overviewCards = [
  {
    label: '题库题目',
    value: '3,842',
    trend: '↑ 24 本周新增',
    trendClass: 'text-emerald-600 dark:text-emerald-400',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: '今日提交',
    value: '18.6k',
    trend: '↑ 5.2% 较昨日',
    trendClass: 'text-emerald-600 dark:text-emerald-400',
    icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
  },
  {
    label: '评测队列',
    value: '空闲',
    trend: '0 等待中任务',
    trendClass: 'text-slate-500 dark:text-slate-400',
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  },
  {
    label: '全站首次 AC 率',
    value: '41.6%',
    trend: '↓ 0.3pt 较上周',
    trendClass: 'text-rose-600 dark:text-rose-400',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

const weeklyBars = [
  { day: '一', height: '45%' },
  { day: '二', height: '62%' },
  { day: '三', height: '38%' },
  { day: '四', height: '78%' },
  { day: '五', height: '55%' },
  { day: '六', height: '92%' },
  { day: '日', height: '68%' },
]

const announcements = [
  { title: '春季积分赛 #3 进行中 · Rated', desc: '截止今晚 22:00 · ICPC 赛制' },
  { title: '新题 P3842「树上的路径」已公开', desc: '难度：省选 / 图论 · 树链剖分' },
  { title: 'Python 3.12 评测镜像已切换', desc: '1 小时前 · 系统公告' },
  { title: '下周模拟赛：NOI 2025 真题复现', desc: '报名开放中 · 4 月 5 日 14:00' },
]

const submissions = [
  { id: '#928441', user: 'star_x', problem: 'P2103 区间 GCD', lang: 'C++17', result: 'AC', cost: '92ms / 15.2MB', time: '刚刚' },
  { id: '#928440', user: 'mintea', problem: 'P3842 树上的路径', lang: 'Python 3', result: '评测中', cost: '—', time: '12s 前' },
  { id: '#928438', user: 'visitor_07', problem: 'P1001 A+B Problem', lang: 'Java 21', result: 'WA', cost: '4ms / 48MB', time: '1 分钟前' },
  { id: '#928435', user: 'algo_fan', problem: 'P3379 模板·最近公共祖先', lang: 'C++20', result: 'TLE', cost: '1000ms / 32MB', time: '3 分钟前' },
  { id: '#928431', user: 'newbie_2026', problem: 'P1048 采药', lang: 'Go 1.22', result: 'RE', cost: '0ms / 0MB', time: '6 分钟前' },
]

function resultTone(result: string) {
  if (result === 'AC') return 'ac'
  if (result === '评测中') return 'judging'
  if (result === 'WA') return 'wa'
  if (result === 'TLE') return 'tle'
  if (result === 'RE') return 're'
  if (result === 'CE') return 'ce'
  return 'neutral'
}
</script>

<template>
  <section class="oj-page">
    <div>
      <h1 class="oj-page-title">开始刷题，保持手感</h1>
      <p class="oj-page-subtitle">
        本周有 <strong class="font-medium text-slate-900 dark:text-slate-100">春季积分赛 #3</strong>
        正在进行；全站数据更新至 2026 年 3 月 30 日。
      </p>
    </div>

    <section class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="平台概览">
      <OjCard
        v-for="item in overviewCards"
        :key="item.label"
        tone="neutral"
        class="rounded-xl transition hover:-translate-y-px"
      >
        <div class="mb-3 grid h-[38px] w-[38px] place-items-center rounded-lg bg-slate-100 dark:bg-white/[0.06]" aria-hidden="true">
          <svg class="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
        </div>
        <div class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{{ item.label }}</div>
        <div class="text-[1.625rem] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{{ item.value }}</div>
        <div class="mt-2 text-sm" :class="item.trendClass">{{ item.trend }}</div>
      </OjCard>
    </section>

    <section class="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <OjCard tone="neutral" class="rounded-xl">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4 dark:border-white/[0.06]">
          <h2 class="text-[0.9375rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">近 7 日提交量</h2>
          <a href="#" class="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400">下载统计</a>
        </div>
        <div
          class="flex h-[200px] items-end justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-1 pt-3 dark:border-white/[0.06] dark:bg-[#181c2a]"
          style="background-image: repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(148,163,184,0.12) 39px, rgba(148,163,184,0.12) 40px)"
          role="img"
          aria-label="柱状图：周一至周日提交次数"
        >
          <div v-for="bar in weeklyBars" :key="bar.day" class="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div class="w-full max-w-[44px] rounded-t-md bg-violet-500/40" :style="{ height: bar.height }"></div>
            <span class="font-mono text-[0.7rem] text-slate-500">{{ bar.day }}</span>
          </div>
        </div>
      </OjCard>

      <OjCard tone="neutral" class="rounded-xl">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4 dark:border-white/[0.06]">
          <h2 class="text-[0.9375rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">公告与赛程</h2>
          <a href="#" class="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400">日历</a>
        </div>
        <div class="flex flex-col">
          <div
            v-for="(item, index) in announcements"
            :key="item.title"
            class="flex gap-3 py-3.5"
            :class="index === announcements.length - 1 ? '' : 'border-b border-slate-200 dark:border-white/[0.06]'"
          >
            <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden="true"></span>
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ item.title }}</p>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </OjCard>
    </section>

    <OjCard tone="neutral" class="rounded-xl" aria-labelledby="recent-submissions-title">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4 dark:border-white/[0.06]">
        <h2 id="recent-submissions-title" class="text-[0.9375rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">最近提交</h2>
        <a href="#" class="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400">全局提交记录</a>
      </div>
      <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.06]">
        <table class="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#181c2a]">
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">提交 ID</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">用户</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">题目</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">语言</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">评测结果</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">耗时 / 内存</th>
              <th class="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">时间</th>
            </tr>
          </thead>
          <tbody class="text-slate-800 dark:text-slate-200">
            <tr
              v-for="item in submissions"
              :key="item.id"
              class="border-t border-slate-200 transition hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
            >
              <td class="px-4 py-3 font-mono text-[0.82rem]">{{ item.id }}</td>
              <td class="px-4 py-3">{{ item.user }}</td>
              <td class="px-4 py-3">{{ item.problem }}</td>
              <td class="px-4 py-3 font-mono text-[0.8rem]">{{ item.lang }}</td>
              <td class="px-4 py-3">
                <OjBadge size="small" :tone="resultTone(item.result)">{{ item.result }}</OjBadge>
              </td>
              <td class="px-4 py-3 font-mono text-[0.8rem] text-slate-500">{{ item.cost }}</td>
              <td class="px-4 py-3 text-slate-500">{{ item.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </OjCard>
  </section>
</template>
