<script setup lang="ts">
import OjBadge from '../components/ui/OjBadge.vue'
import OjCard from '../components/ui/OjCard.vue'

const submissions = [
  { id: 58231, user: 'student01', problem: 'A + B Problem', language: 'Java', result: 'Accepted', time: '12 ms' },
  { id: 58230, user: 'student02', problem: '最长上升子序列', language: 'C++', result: 'Wrong Answer', time: '8 ms' },
  { id: 58229, user: 'student03', problem: '最短路模板', language: 'Python', result: 'Time Limit Exceeded', time: '1000 ms' },
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
          <div class="oj-kicker">提交概览</div>
          <div>
            <h1 class="oj-page-title">评测状态</h1>
            <p class="oj-page-subtitle">用于查看提交记录、运行结果和当前判题服务情况，后续可以继续接实时刷新接口。</p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <OjCard tone="neutral" class="rounded-2xl">
            <div class="text-xs uppercase tracking-[0.12em] text-slate-400">队列任务</div>
            <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">37</div>
          </OjCard>
          <OjCard tone="neutral" class="rounded-2xl">
            <div class="text-xs uppercase tracking-[0.12em] text-slate-400">在线节点</div>
            <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">4</div>
          </OjCard>
          <OjCard tone="success" class="rounded-2xl">
            <div class="text-xs uppercase tracking-[0.12em] text-slate-400">服务状态</div>
            <div class="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-300">正常</div>
          </OjCard>
        </div>
      </div>
    </OjCard>

    <OjCard tone="neutral" class="rounded-[20px]">
      <el-table :data="submissions">
        <el-table-column prop="id" label="提交号" width="120" />
        <el-table-column prop="user" label="用户" width="140" />
        <el-table-column prop="problem" label="题目" />
        <el-table-column prop="language" label="语言" width="120" />
        <el-table-column label="结果" width="180">
          <template #default="{ row }">
            <OjBadge size="small" :tone="resultType(row.result)">{{ row.result }}</OjBadge>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="耗时" width="120" />
      </el-table>
    </OjCard>
  </section>
</template>
