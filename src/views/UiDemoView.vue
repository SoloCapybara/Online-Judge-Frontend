<script setup lang="ts">
import { ref } from 'vue'
import OjBadge from '../components/ui/OjBadge.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjCard from '../components/ui/OjCard.vue'
import OjEmptyState from '../components/ui/OjEmptyState.vue'
import OjInput from '../components/ui/OjInput.vue'

const keyword = ref('')
const notes = ref('当前页面集中展示项目内已封装的基础 UI 组件。')
</script>

<template>
  <section class="oj-page">
    <OjCard tone="primary" class="rounded-[20px]">
      <div class="oj-kicker">组件示例</div>
      <h1 class="mt-3 oj-page-title">OJ UI Playground</h1>
      <p class="oj-page-subtitle">这里集中展示当前封装的按钮、徽标、卡片、输入和空状态组件，后续业务页可继续复用。</p>
    </OjCard>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <OjCard eyebrow="Buttons" title="按钮体系" description="主按钮、次按钮和轻量按钮统一收口。">
        <div class="flex flex-wrap gap-3">
          <OjButton tone="primary">主要操作</OjButton>
          <OjButton tone="secondary">次级操作</OjButton>
          <OjButton tone="accent">强调操作</OjButton>
          <OjButton tone="danger">危险操作</OjButton>
        </div>
      </OjCard>

      <OjCard eyebrow="Badges" title="徽标体系" description="支持状态色和自定义内容。">
        <div class="flex flex-wrap gap-3">
          <OjBadge tone="primary" dot>开发中</OjBadge>
          <OjBadge tone="success" dot>已完成</OjBadge>
          <OjBadge tone="warning" dot>待联调</OjBadge>
          <OjBadge tone="danger" dot>需修复</OjBadge>
        </div>
      </OjCard>
    </section>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <OjCard eyebrow="Inputs" title="输入组件" description="统一输入框尺寸、边框和聚焦态。">
        <div class="space-y-4">
          <OjInput v-model="keyword" clearable placeholder="请输入题号、模块名或课程名" />
          <OjInput v-model="notes" type="textarea" placeholder="请输入说明内容" />
        </div>
      </OjCard>

      <OjCard eyebrow="Empty State" title="空状态组件" description="适用于暂无数据或尚未接入接口的场景。">
        <OjEmptyState
          title="暂无真实数据"
          description="当前为组件演示页面。后续业务模块接接口后，可以复用这套空状态。"
          tone="accent"
        >
          <template #actions>
            <OjButton tone="secondary">返回首页</OjButton>
            <OjButton tone="primary">开始接接口</OjButton>
          </template>
        </OjEmptyState>
      </OjCard>
    </section>
  </section>
</template>
