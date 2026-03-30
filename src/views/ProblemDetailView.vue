<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import { useRoute } from 'vue-router'
import CodeEditor from '../components/CodeEditor.vue'

type Language = 'java' | 'cpp' | 'python'

const route = useRoute()
const language = ref<Language>('java')

const starterCode: Record<Language, string> = {
  java: `import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n    System.out.println(a + b);\n  }\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  int a, b;\n  cin >> a >> b;\n  cout << a + b << "\\n";\n  return 0;\n}\n`,
  python: `a, b = map(int, input().split())\nprint(a + b)\n`,
}

const sourceCode = ref(starterCode.java)
const problemId = computed(() => route.params.id ?? '1001')
const samples = [
  { input: '1 2', output: '3' },
  { input: '100 250', output: '350' },
]

watch(language, (value) => {
  sourceCode.value = starterCode[value]
})
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="oj-kicker">题目 {{ problemId }}</div>
          <div>
            <h1 class="oj-page-title">A + B Problem</h1>
            <p class="oj-page-subtitle">读入两个整数并输出它们的和。当前页面已预留语言切换、在线编程和提交结果展示区域。</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <OjBadge size="small" tone="success">简单</OjBadge>
          <OjBadge size="small" tone="neutral">模拟</OjBadge>
          <OjBadge size="small" tone="neutral">输入输出</OjBadge>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <OjCard tone="neutral" class="rounded-2xl">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">时间限制</div>
          <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">1000 ms</div>
        </OjCard>
        <OjCard tone="neutral" class="rounded-2xl">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">内存限制</div>
          <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">256 MB</div>
        </OjCard>
        <OjCard tone="accent" class="rounded-2xl">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">来源</div>
          <div class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">入门示例题</div>
        </OjCard>
      </div>

      <OjCard tone="neutral" class="mt-6 rounded-[18px]">
        <h2 class="oj-section-title">题目描述</h2>
        <div class="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>输入两个整数 <code class="rounded bg-white px-1.5 py-0.5 text-indigo-700 dark:bg-[#111827] dark:text-indigo-300">a</code> 和 <code class="rounded bg-white px-1.5 py-0.5 text-indigo-700 dark:bg-[#111827] dark:text-indigo-300">b</code>，输出它们的和。</p>
          <p><strong>输入格式：</strong> 一行两个整数。</p>
          <p><strong>输出格式：</strong> 一行一个整数，表示 <code class="rounded bg-white px-1.5 py-0.5 text-indigo-700 dark:bg-[#111827] dark:text-indigo-300">a + b</code>。</p>
        </div>
      </OjCard>
    </OjCard>

    <section class="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
      <OjCard tone="neutral" class="rounded-[20px]">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="oj-section-title">在线代码编辑</h2>
            <el-select v-model="language" class="!w-[140px]">
              <el-option label="Java" value="java" />
              <el-option label="C++" value="cpp" />
              <el-option label="Python" value="python" />
            </el-select>
          </div>
          <div class="flex flex-wrap gap-3">
            <OjButton tone="secondary">保存草稿</OjButton>
            <OjButton tone="primary">提交评测</OjButton>
          </div>
        </div>
        <CodeEditor v-model="sourceCode" :language="language" />
      </OjCard>

      <OjCard tone="accent" class="rounded-[20px]">
        <h2 class="oj-section-title">样例与结果</h2>
        <div class="mt-5 space-y-4">
          <OjCard
            v-for="(sample, index) in samples"
            :key="index"
            tone="neutral"
            class="rounded-[18px]"
          >
            <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">样例 {{ index + 1 }}</div>
            <div class="mt-3 space-y-3">
              <div>
                <div class="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">输入</div>
                <pre class="overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">{{ sample.input }}</pre>
              </div>
              <div>
                <div class="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">输出</div>
                <pre class="overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">{{ sample.output }}</pre>
              </div>
            </div>
          </OjCard>
        </div>

        <OjCard tone="success" class="mt-5 rounded-[18px]">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-slate-600 dark:text-slate-300">最近一次结果</span>
            <OjBadge size="small" tone="ac">Accepted</OjBadge>
          </div>
          <div class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div class="rounded-xl bg-white px-3 py-2 text-slate-700 dark:bg-[#111827] dark:text-slate-200">耗时：12 ms</div>
            <div class="rounded-xl bg-white px-3 py-2 text-slate-700 dark:bg-[#111827] dark:text-slate-200">内存：8.4 MB</div>
          </div>
        </OjCard>
      </OjCard>
    </section>
  </section>
</template>
