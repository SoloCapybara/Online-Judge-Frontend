<script setup lang="ts">
import OjBadge from '../components/ui/OjBadge.vue'
import OjCard from '../components/ui/OjCard.vue'

const submissions = [
  { id: 58231, problem: 'A + B Problem', language: 'Java', result: 'Accepted', memory: '8.4 MB', time: '12 ms' },
  { id: 58230, problem: '最长上升子序列', language: 'C++', result: 'Wrong Answer', memory: '7.1 MB', time: '8 ms' },
  { id: 58229, problem: '最短路模板', language: 'Python', result: 'Time Limit Exceeded', memory: '56.2 MB', time: '1000 ms' },
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
      <div class="oj-kicker">提交历史</div>
      <h1 class="mt-3 oj-page-title">提交记录</h1>
      <p class="oj-page-subtitle">用于查看个人或班级维度的提交列表、运行结果、耗时和内存占用。</p>
    </OjCard>

    <OjCard tone="neutral" class="rounded-[20px]">
      <el-table :data="submissions">
        <el-table-column prop="id" label="提交号" width="120" />
        <el-table-column prop="problem" label="题目" />
        <el-table-column prop="language" label="语言" width="120" />
        <el-table-column label="结果" width="190">
          <template #default="{ row }">
            <OjBadge size="small" :tone="resultType(row.result)">{{ row.result }}</OjBadge>
          </template>
        </el-table-column>
        <el-table-column prop="memory" label="内存" width="120" />
        <el-table-column prop="time" label="耗时" width="120" />
      </el-table>
    </OjCard>
  </section>
</template>
