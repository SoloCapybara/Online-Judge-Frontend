<script setup lang="ts">
const submissions = [
  { id: 58231, user: 'student01', problem: 'A + B Problem', language: 'Java', result: 'Accepted', time: '12 ms' },
  { id: 58230, user: 'student02', problem: '最长上升子序列', language: 'C++', result: 'Wrong Answer', time: '8 ms' },
  { id: 58229, user: 'student03', problem: '最短路模板', language: 'Python', result: 'Time Limit Exceeded', time: '1000 ms' },
]

function resultType(result: string) {
  if (result === 'Accepted') {
    return 'success'
  }
  if (result === 'Wrong Answer') {
    return 'danger'
  }
  return 'warning'
}
</script>

<template>
  <section class="oj-page">
    <article class="oj-panel status-panel">
      <h1 class="oj-page-title">评测状态</h1>
      <p class="oj-page-subtitle">这里已经适合接提交记录分页、按用户筛选、WebSocket 实时更新结果。</p>
    </article>

    <article class="oj-panel status-table">
      <el-table :data="submissions" stripe>
        <el-table-column prop="id" label="提交号" width="120" />
        <el-table-column prop="user" label="用户" width="140" />
        <el-table-column prop="problem" label="题目" />
        <el-table-column prop="language" label="语言" width="120" />
        <el-table-column label="结果" width="180">
          <template #default="{ row }">
            <el-tag :type="resultType(row.result)">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="耗时" width="120" />
      </el-table>
    </article>
  </section>
</template>

<style scoped>
.status-panel,
.status-table {
  padding: 24px;
}
</style>
