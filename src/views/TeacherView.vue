<script setup lang="ts">
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'

const metrics = [
  { label: '已发布作业', value: '6', trend: '其中 3 个进行中' },
  { label: '题库题目', value: '128', trend: '支持继续增删改查' },
  { label: '待关注异常提交', value: '14', trend: '建议查看运行错误与超时' },
]

const cards = [
  { title: '题库管理', description: '维护题目标题、标签、难度、测试用例和判题限制。', action: '进入题库维护' },
  { title: '比赛与作业发布', description: '创建课程作业、周赛和题目集，设置起止时间与参与规则。', action: '发布比赛' },
  { title: '成绩统计', description: '查看学生提交记录、通过率和成绩导出入口。', action: '查看统计' },
]

const submissions = [
  { student: 'student01', problem: 'A + B Problem', result: 'Accepted', score: '100' },
  { student: 'student08', problem: '最长上升子序列', result: 'Wrong Answer', score: '60' },
  { student: 'student13', problem: '最短路模板', result: 'Time Limit Exceeded', score: '40' },
]

function resultType(result: string) {
  if (result === 'Accepted') return 'ac'
  if (result === 'Wrong Answer') return 'wa'
  if (result === 'Time Limit Exceeded') return 'tle'
  if (result === 'Runtime Error') return 're'
  if (result === 'Compilation Error') return 'ce'
  if (result === 'Judging') return 'judging'
  return 'neutral'
}
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-3">
          <div class="oj-kicker">教师端</div>
          <div>
            <h1 class="oj-page-title">教师工作台</h1>
            <p class="oj-page-subtitle">集中查看题库维护、作业发布和学生提交情况，便于继续接教师端管理接口。</p>
          </div>
        </div>
        <div class="space-y-3 rounded-[18px] border border-slate-100 bg-slate-50 p-5 dark:border-white/[0.06] dark:bg-[#172033]">
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="text-slate-500 dark:text-slate-400">当前课程</span>
            <strong class="text-slate-900 dark:text-slate-100">软件工程 2026 春</strong>
          </div>
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="text-slate-500 dark:text-slate-400">待处理提交</span>
            <strong class="text-slate-900 dark:text-slate-100">14 条</strong>
          </div>
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="text-slate-500 dark:text-slate-400">导出状态</span>
            <strong class="text-emerald-600 dark:text-emerald-300">可导出</strong>
          </div>
        </div>
      </div>
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
        <div class="mt-3 text-sm text-slate-500 dark:text-slate-400">{{ metric.trend }}</div>
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
          <OjButton tone="primary">{{ card.action }}</OjButton>
        </div>
      </OjCard>
    </section>

    <OjCard tone="neutral" class="rounded-[20px]">
      <div class="px-3 pb-3 pt-1">
        <h2 class="oj-section-title">近期学生提交</h2>
      </div>
      <el-table :data="submissions">
        <el-table-column prop="student" label="学生" width="160" />
        <el-table-column prop="problem" label="题目" />
        <el-table-column label="结果" width="200">
          <template #default="{ row }">
            <OjBadge size="small" :tone="resultType(row.result)">{{ row.result }}</OjBadge>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="120" />
      </el-table>
    </OjCard>
  </section>
</template>
