<script setup lang="ts">
import OjCard from '../components/ui/OjCard.vue'

const rankList = [
  { rank: 1, user: 'student01', solved: 412, rating: 2148 },
  { rank: 2, user: 'student08', solved: 398, rating: 2087 },
  { rank: 3, user: 'student13', solved: 377, rating: 2013 },
  { rank: 4, user: 'teacher01', solved: 320, rating: 1930 },
]
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="oj-kicker">竞赛排行</div>
      <h1 class="mt-3 oj-page-title">排行榜</h1>
      <p class="oj-page-subtitle">展示用户解题数和评分，后续可以接课程排行、周赛排行和班级筛选。</p>
    </OjCard>

    <OjCard tone="neutral" class="rounded-[20px]">
      <el-table :data="rankList">
        <el-table-column prop="rank" label="排名" width="100" />
        <el-table-column prop="user" label="用户" />
        <el-table-column prop="solved" label="通过题数" width="130" />
        <el-table-column prop="rating" label="Rating" width="130" />
      </el-table>
    </OjCard>
  </section>
</template>
