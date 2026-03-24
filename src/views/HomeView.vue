<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const dashboardContent = computed(() => {
  if (userStore.role === 'teacher') {
    return {
      title: '教师教学工作台',
      subtitle: '围绕题库配置、比赛发布、成绩统计和学生提交分析展开的教师视角首页。',
      metrics: [
        { label: '已发布题目', value: '128', trend: '+12 本周新增' },
        { label: '待批改提交', value: '46', trend: '可前往评测状态页查看' },
        { label: '进行中作业', value: '3', trend: '本周已有 2 场课程训练' },
      ],
      highlights: [
        '可以从教师工作台继续细化题库管理、比赛发布和成绩导出页面。',
        '当前前端已经预留题目、比赛、评测状态等路由，适合直接接教师端接口。',
        '后续可增加班级维度统计、学生错误类型分析和导出成绩单功能。',
      ],
    }
  }

  if (userStore.role === 'admin') {
    return {
      title: '系统管理总览',
      subtitle: '面向管理员的系统状态、用户治理和判题服务监控入口。',
      metrics: [
        { label: '注册用户', value: '1,284', trend: '+34 本周新增' },
        { label: '在线判题节点', value: '4', trend: '全部健康' },
        { label: '队列积压任务', value: '37', trend: 'RabbitMQ 异步消费中' },
      ],
      highlights: [
        '管理员菜单已单独显示管理台，和学生、教师的导航分开。',
        '后续适合接用户管理、系统配置、容器运行监控、并发限制配置。',
        '可以继续补充角色权限矩阵和判题服务健康检查页。',
      ],
    }
  }

  return {
    title: '学生学习控制台',
    subtitle: '面向教学场景的在线编程评测系统前端骨架，学生侧重点在刷题、比赛和提交结果查看。',
    metrics: [
      { label: '题目总数', value: '128', trend: '+12 本周新增' },
      { label: '今日提交', value: '2,431', trend: '+18% 相比昨日' },
      { label: '排队判题', value: '37', trend: 'RabbitMQ 异步消费中' },
    ],
    highlights: [
      'Docker 沙箱隔离运行用户代码，便于后续接入 Java / C++ / Python 多语言评测。',
      '题目、比赛、评测状态、后台管理已经拆成独立页面，后续可以直接接接口。',
      'Vite 本地代理已对齐 /api，可直接转发到 Spring Boot 默认 8080 端口。',
    ],
  }
})

const recentActivities = [
  { time: '18:20', title: '题目 1001 已更新测试用例', tag: '题库' },
  { time: '17:40', title: '周赛 No.12 创建成功', tag: '比赛' },
  { time: '16:05', title: '判题节点 worker-02 恢复在线', tag: '运维' },
]
</script>

<template>
  <section class="oj-page">
    <article class="hero oj-panel">
      <div class="hero-copy">
        <div class="hero-badge">Graduation Project Ready</div>
        <h1 class="oj-page-title">{{ dashboardContent.title }}</h1>
        <p class="oj-page-subtitle">{{ dashboardContent.subtitle }}</p>
        <div class="hero-actions">
          <el-button type="primary" size="large">开始接后端接口</el-button>
          <el-button size="large" plain>补充数据库字段映射</el-button>
        </div>
      </div>

      <div class="hero-side">
        <div class="hero-card">
          <div class="hero-card-label">当前技术栈</div>
          <div class="hero-card-value">Vue 3 + TS + Pinia + Element Plus</div>
        </div>
        <div class="hero-card accent">
          <div class="hero-card-label">判题流程</div>
          <div class="hero-card-value">提交 -> 队列 -> 沙箱 -> 结果回传</div>
        </div>
      </div>
    </article>

    <section class="oj-grid cols-3">
      <article v-for="metric in dashboardContent.metrics" :key="metric.label" class="oj-panel oj-kpi">
        <div class="oj-kpi-label">{{ metric.label }}</div>
        <div class="oj-kpi-value">{{ metric.value }}</div>
        <div class="metric-trend">{{ metric.trend }}</div>
      </article>
    </section>

    <section class="oj-grid cols-2">
      <article class="oj-panel section-card">
        <h2 class="oj-section-title">接下来直接能做的事</h2>
        <ul class="plain-list">
          <li v-for="item in dashboardContent.highlights" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="oj-panel section-card">
        <h2 class="oj-section-title">近期动态</h2>
        <div class="activity-list">
          <div v-for="item in recentActivities" :key="item.title" class="activity-item">
            <div class="activity-time">{{ item.time }}</div>
            <div class="activity-body">
              <div class="activity-title">{{ item.title }}</div>
              <el-tag size="small" effect="plain">{{ item.tag }}</el-tag>
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.9fr);
  gap: 20px;
  padding: 28px;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-badge {
  width: fit-content;
  margin-bottom: 16px;
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--oj-primary);
  background: var(--oj-primary-soft);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-card {
  padding: 22px;
  border-radius: 22px;
  color: #fff;
  background: linear-gradient(135deg, #1456c1, #2e8cf7);
}

.hero-card.accent {
  background: linear-gradient(135deg, #0f172a, #f97316);
}

.hero-card-label {
  opacity: 0.78;
  font-size: 13px;
}

.hero-card-value {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-trend {
  margin-top: 10px;
  color: var(--oj-muted);
  font-size: 14px;
}

.section-card {
  padding: 24px;
}

.plain-list {
  margin: 0;
  padding-left: 18px;
  color: var(--oj-muted);
}

.plain-list li + li {
  margin-top: 12px;
}

.activity-list {
  display: grid;
  gap: 14px;
}

.activity-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.activity-time {
  font-size: 14px;
  font-weight: 700;
  color: var(--oj-primary);
}

.activity-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.activity-title {
  font-weight: 600;
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
