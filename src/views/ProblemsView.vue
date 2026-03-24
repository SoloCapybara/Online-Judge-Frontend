<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

type Difficulty = '简单' | '中等' | '困难'

interface ProblemItem {
  id: number
  title: string
  difficulty: Difficulty
  tags: string[]
  acceptance: string
}

const router = useRouter()
const keyword = ref('')
const difficulty = ref<'全部' | Difficulty>('全部')

const problems: ProblemItem[] = [
  { id: 1001, title: 'A + B Problem', difficulty: '简单', tags: ['入门', '模拟'], acceptance: '78%' },
  { id: 1024, title: '最长上升子序列', difficulty: '中等', tags: ['动态规划'], acceptance: '46%' },
  { id: 1088, title: '最短路模板', difficulty: '中等', tags: ['图论', 'Dijkstra'], acceptance: '51%' },
  { id: 1203, title: '区间修改与查询', difficulty: '困难', tags: ['线段树'], acceptance: '29%' },
]

const filteredProblems = computed(() =>
  problems.filter((problem) => {
    const matchKeyword =
      keyword.value.length === 0 ||
      problem.title.toLowerCase().includes(keyword.value.toLowerCase()) ||
      String(problem.id).includes(keyword.value)
    const matchDifficulty =
      difficulty.value === '全部' || problem.difficulty === difficulty.value

    return matchKeyword && matchDifficulty
  }),
)

function openProblem(id: number) {
  void router.push(`/problems/${id}`)
}
</script>

<template>
  <section class="oj-page">
    <article class="oj-panel filter-panel">
      <div>
        <h1 class="oj-page-title">题库</h1>
        <p class="oj-page-subtitle">支持按题号、标题、难度快速筛选，后续可继续接分类与标签接口。</p>
      </div>

      <div class="filters">
        <el-input v-model="keyword" placeholder="搜索题号或标题" clearable />
        <el-select v-model="difficulty" class="difficulty-select">
          <el-option label="全部难度" value="全部" />
          <el-option label="简单" value="简单" />
          <el-option label="中等" value="中等" />
          <el-option label="困难" value="困难" />
        </el-select>
      </div>
    </article>

    <article class="oj-panel table-panel">
      <el-table :data="filteredProblems" stripe>
        <el-table-column prop="id" label="题号" width="100" />
        <el-table-column label="题目">
          <template #default="{ row }">
            <el-button link type="primary" @click="openProblem(row.id)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="120">
          <template #default="{ row }">
            <el-tag :type="row.difficulty === '简单' ? 'success' : row.difficulty === '中等' ? 'warning' : 'danger'">
              {{ row.difficulty }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签">
          <template #default="{ row }">
            <div class="tag-list">
              <el-tag v-for="tag in row.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="acceptance" label="通过率" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" plain @click="openProblem(row.id)">开始做题</el-button>
          </template>
        </el-table-column>
      </el-table>
    </article>
  </section>
</template>

<style scoped>
.filter-panel,
.table-panel {
  padding: 24px;
}

.filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 14px;
  margin-top: 20px;
}

.difficulty-select {
  width: 100%;
}

.tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 860px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
