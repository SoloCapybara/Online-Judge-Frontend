<script setup lang="ts">
import OjCard from '../components/ui/OjCard.vue'
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="oj-kicker">帮助中心</div>
      <h1 class="mt-3 oj-page-title">帮助 / FAQ</h1>
      <p class="oj-page-subtitle">常见问题、使用指引和判题说明，后续可接公告和文档管理接口。</p>
    </OjCard>

    <section class="space-y-4">
      <OjCard tone="neutral" class="rounded-[18px]">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">为什么代码本地能跑，提交后 WA？</h2>
        <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">请优先检查边界条件、输入输出格式、换行和多组数据处理。</p>
      </OjCard>
      <OjCard tone="neutral" class="rounded-[18px]">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">为什么会出现 Time Limit Exceeded？</h2>
        <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">通常是算法复杂度过高或存在死循环，建议先分析时间复杂度再优化实现。</p>
      </OjCard>
      <OjCard tone="neutral" class="rounded-[18px]">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">支持哪些语言？</h2>
        <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">当前演示环境支持 Java、C++、Python，后续可按课程需要扩展更多语言。</p>
      </OjCard>
    </section>
  </section>
</template>
