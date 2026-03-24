<script setup lang="ts">
const contests = [
  { title: '程序设计基础周赛 No.12', time: '2026-03-28 19:00', status: '报名中', type: '课程作业' },
  { title: '数据结构专题训练', time: '2026-04-02 14:30', status: '即将开始', type: '实验' },
  { title: '算法设计月赛', time: '2026-04-06 20:00', status: '草稿', type: '竞赛' },
]
</script>

<template>
  <section class="oj-page">
    <article class="oj-panel contests-panel">
      <h1 class="oj-page-title">比赛与作业</h1>
      <p class="oj-page-subtitle">这里适合继续接比赛列表、倒计时、题目集配置和成绩统计接口。</p>
    </article>

    <section class="oj-grid cols-3">
      <article v-for="contest in contests" :key="contest.title" class="oj-panel contest-card">
        <div class="contest-type">{{ contest.type }}</div>
        <h2>{{ contest.title }}</h2>
        <div class="contest-time">{{ contest.time }}</div>
        <div class="contest-footer">
          <el-tag :type="contest.status === '报名中' ? 'success' : contest.status === '即将开始' ? 'warning' : 'info'">
            {{ contest.status }}
          </el-tag>
          <el-button type="primary" plain>管理题目集</el-button>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.contests-panel,
.contest-card {
  padding: 24px;
}

.contest-card h2 {
  margin: 12px 0 10px;
  font-size: 22px;
}

.contest-type {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--oj-primary);
  background: var(--oj-primary-soft);
  font-size: 12px;
  font-weight: 700;
}

.contest-time {
  color: var(--oj-muted);
}

.contest-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
