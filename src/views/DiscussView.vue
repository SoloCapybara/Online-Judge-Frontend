<script setup lang="ts">
import OjCard from '../components/ui/OjCard.vue'

const posts = [
  { title: '最短路模板里的堆优化怎么写？', author: 'student09', replies: 12, updatedAt: '10 分钟前' },
  { title: '动态规划入门路线推荐', author: 'student03', replies: 27, updatedAt: '35 分钟前' },
  { title: '周赛 No.12 题解交流帖', author: 'teacher01', replies: 43, updatedAt: '1 小时前' },
]
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="oj-kicker">社区交流</div>
      <h1 class="mt-3 oj-page-title">讨论区</h1>
      <p class="oj-page-subtitle">用于题解交流、答疑和课程通知，后续可接发帖、回复和置顶功能。</p>
    </OjCard>

    <section class="space-y-4">
      <OjCard
        v-for="post in posts"
        :key="post.title"
        tone="neutral"
        class="rounded-[18px]"
      >
        <h2 class="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ post.title }}</h2>
        <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>作者：{{ post.author }}</span>
          <span>回复：{{ post.replies }}</span>
          <span>更新：{{ post.updatedAt }}</span>
        </div>
      </OjCard>
    </section>
  </section>
</template>
