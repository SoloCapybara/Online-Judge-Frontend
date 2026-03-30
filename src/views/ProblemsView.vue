<script setup lang="ts">
import { computed, ref } from 'vue'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import OjInput from '../components/ui/OjInput.vue'
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
    const matchDifficulty = difficulty.value === '全部' || problem.difficulty === difficulty.value
    return matchKeyword && matchDifficulty
  }),
)

function openProblem(id: number) {
  void router.push(`/problems/${id}`)
}
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
        <div class="space-y-3">
          <div class="oj-kicker">题库检索</div>
          <div>
            <h1 class="oj-page-title">题库</h1>
            <p class="oj-page-subtitle">支持按题号、标题和难度筛选，后续可继续接标签、分类和分页接口。</p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-[1fr_180px]">
          <OjInput v-model="keyword" placeholder="搜索题号或标题" clearable />
          <el-select v-model="difficulty">
            <el-option label="全部难度" value="全部" />
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </div>
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-3">
        <OjCard tone="neutral" class="rounded-2xl">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">当前结果数</div>
          <div class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ filteredProblems.length }}</div>
        </OjCard>
        <OjCard tone="neutral" class="rounded-2xl">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">当前难度</div>
          <div class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ difficulty }}</div>
        </OjCard>
        <OjCard tone="accent" class="rounded-2xl">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">可联调模块</div>
          <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">分类、标签、分页、题目状态</div>
        </OjCard>
      </div>
    </OjCard>

    <OjCard tone="neutral" class="rounded-[20px]">
      <el-table :data="filteredProblems">
        <el-table-column prop="id" label="题号" width="100" />
        <el-table-column label="题目">
          <template #default="{ row }">
            <button class="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300" @click="openProblem(row.id)">
              {{ row.title }}
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="120">
          <template #default="{ row }">
            <OjBadge
              size="small"
              :tone="row.difficulty === '简单' ? 'success' : row.difficulty === '中等' ? 'warning' : 'danger'"
            >
              {{ row.difficulty }}
            </OjBadge>
          </template>
        </el-table-column>
        <el-table-column label="标签">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-2">
              <OjBadge v-for="tag in row.tags" :key="tag" size="small" tone="neutral">{{ tag }}</OjBadge>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="acceptance" label="通过率" width="120" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <OjButton size="small" tone="primary" @click="openProblem(row.id)">开始做题</OjButton>
          </template>
        </el-table-column>
      </el-table>
    </OjCard>
  </section>
</template>
