<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CodeEditor from '../components/CodeEditor.vue'

type Language = 'java' | 'cpp' | 'python'

const route = useRoute()
const language = ref<Language>('java')

const starterCode: Record<Language, string> = {
  java: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    int a = scanner.nextInt();
    int b = scanner.nextInt();
    System.out.println(a + b);
  }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int a, b;
  cin >> a >> b;
  cout << a + b << "\\n";
  return 0;
}
`,
  python: `a, b = map(int, input().split())
print(a + b)
`,
}

const sourceCode = ref(starterCode.java)
const testCases = [
  { input: '1 2', output: '3' },
  { input: '100 250', output: '350' },
]

watch(language, (value) => {
  sourceCode.value = starterCode[value]
})

const problemId = computed(() => route.params.id ?? '1001')
</script>

<template>
  <section class="oj-page">
    <article class="oj-panel problem-panel">
      <div class="problem-header">
        <div>
          <div class="problem-id">题目 {{ problemId }}</div>
          <h1 class="oj-page-title">A + B Problem</h1>
          <p class="oj-page-subtitle">
            读入两个整数，输出它们的和。这个页面已经预留了代码编辑、语言切换、提交和样例区。
          </p>
        </div>
        <div class="problem-tags">
          <el-tag type="success">简单</el-tag>
          <el-tag effect="plain">模拟</el-tag>
          <el-tag effect="plain">输入输出</el-tag>
        </div>
      </div>

      <div class="description">
        <h2 class="oj-section-title">题目描述</h2>
        <p>输入两个整数 <code>a</code> 和 <code>b</code>，输出它们的和。</p>
        <p><strong>输入格式：</strong> 一行两个整数。</p>
        <p><strong>输出格式：</strong> 一行一个整数，表示 <code>a + b</code>。</p>
      </div>
    </article>

    <section class="editor-layout">
      <article class="oj-panel editor-panel">
        <div class="editor-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-title">在线代码编辑器</span>
            <el-select v-model="language" class="language-select">
              <el-option label="Java" value="java" />
              <el-option label="C++" value="cpp" />
              <el-option label="Python" value="python" />
            </el-select>
          </div>
          <div class="toolbar-actions">
            <el-button>保存草稿</el-button>
            <el-button type="primary">提交评测</el-button>
          </div>
        </div>

        <CodeEditor v-model="sourceCode" :language="language" />
      </article>

      <article class="oj-panel case-panel">
        <h2 class="oj-section-title">样例与提交信息</h2>

        <div class="case-list">
          <div v-for="(item, index) in testCases" :key="index" class="case-item">
            <div class="case-title">样例 {{ index + 1 }}</div>
            <div class="case-block">
              <div class="case-label">输入</div>
              <pre>{{ item.input }}</pre>
            </div>
            <div class="case-block">
              <div class="case-label">输出</div>
              <pre>{{ item.output }}</pre>
            </div>
          </div>
        </div>

        <div class="submit-info">
          <div class="submit-row">
            <span>最近一次结果</span>
            <el-tag type="success">Accepted</el-tag>
          </div>
          <div class="submit-row">
            <span>耗时</span>
            <strong>12 ms</strong>
          </div>
          <div class="submit-row">
            <span>内存</span>
            <strong>8.4 MB</strong>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.problem-panel,
.editor-panel,
.case-panel {
  padding: 24px;
}

.problem-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.problem-id {
  margin-bottom: 12px;
  color: var(--oj-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.problem-tags {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.description {
  margin-top: 22px;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-title {
  font-weight: 700;
}

.language-select {
  width: 150px;
}

.case-list {
  display: grid;
  gap: 16px;
}

.case-item {
  padding: 16px;
  border-radius: 18px;
  background: rgba(20, 86, 193, 0.05);
}

.case-title {
  font-weight: 700;
}

.case-block {
  margin-top: 12px;
}

.case-label {
  margin-bottom: 8px;
  color: var(--oj-muted);
  font-size: 13px;
}

pre {
  margin: 0;
  padding: 12px;
  border-radius: 14px;
  overflow: auto;
  background: rgba(255, 255, 255, 0.84);
}

.submit-info {
  margin-top: 20px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(249, 115, 22, 0.08);
}

.submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.submit-row + .submit-row {
  margin-top: 12px;
}

@media (max-width: 960px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}
</style>
