<script setup lang="ts">
const metrics = [
  { label: '已发布作业', value: '6', trend: '其中 3 个进行中' },
  { label: '题库题目', value: '128', trend: '支持继续增删改查' },
  { label: '待关注异常提交', value: '14', trend: '建议查看运行错误与超时' },
]

const cards = [
  {
    title: '题库管理',
    description: '维护题目标题、标签、难度、测试用例和判题限制。',
    action: '进入题库维护',
  },
  {
    title: '比赛与作业发布',
    description: '创建课程作业、周赛和题目集，设置起止时间与参与规则。',
    action: '发布比赛',
  },
  {
    title: '成绩统计',
    description: '查看学生提交记录、通过率和成绩导出入口。',
    action: '查看统计',
  },
]

const submissions = [
  { student: 'student01', problem: 'A + B Problem', result: 'Accepted', score: '100' },
  { student: 'student08', problem: '最长上升子序列', result: 'Wrong Answer', score: '60' },
  { student: 'student13', problem: '最短路模板', result: 'Time Limit Exceeded', score: '40' },
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
    <article class="oj-panel teacher-panel">
      <h1 class="oj-page-title">教师工作台</h1>
      <p class="oj-page-subtitle">这一页是教师 mock 面板，和学生端、管理员端已经分开。</p>
    </article>

    <section class="oj-grid cols-3">
      <article v-for="metric in metrics" :key="metric.label" class="oj-panel oj-kpi">
        <div class="oj-kpi-label">{{ metric.label }}</div>
        <div class="oj-kpi-value">{{ metric.value }}</div>
        <div class="metric-trend">{{ metric.trend }}</div>
      </article>
    </section>

    <section class="oj-grid cols-3">
      <article v-for="card in cards" :key="card.title" class="oj-panel teacher-card">
        <h2>{{ card.title }}</h2>
        <p>{{ card.description }}</p>
        <el-button type="primary" plain>{{ card.action }}</el-button>
      </article>
    </section>

    <article class="oj-panel teacher-table">
      <h2 class="oj-section-title">近期学生提交</h2>
      <el-table :data="submissions" stripe>
        <el-table-column prop="student" label="学生" width="160" />
        <el-table-column prop="problem" label="题目" />
        <el-table-column label="结果" width="200">
          <template #default="{ row }">
            <el-tag :type="resultType(row.result)">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="120" />
      </el-table>
    </article>
  </section>
</template>

<style scoped>
.teacher-panel,
.teacher-card,
.teacher-table {
  padding: 24px;
}

.teacher-card h2 {
  margin: 0 0 10px;
}

.teacher-card p {
  margin: 0 0 18px;
  color: var(--oj-muted);
}
</style>
