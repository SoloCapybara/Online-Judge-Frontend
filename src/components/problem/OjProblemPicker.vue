<script setup lang="ts">
import axios from 'axios'
import { computed, reactive, ref, watch } from 'vue'
import { getProblemPage, type ProblemVO } from '../../api/problem'
import OjButton from '../ui/OjButton.vue'
import OjInput from '../ui/OjInput.vue'
import OjModal from '../ui/OjModal.vue'
import OjPagination from '../ui/OjPagination.vue'

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  disabled?: boolean
  placeholder?: string
}>(), {
  modelValue: '',
  disabled: false,
  placeholder: '选择题目筛选',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const modalOpen = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const records = ref<ProblemVO[]>([])
const selectedTitle = ref('')

const pageState = reactive({
  current: 1,
  pageSize: 8,
  total: 0,
  pages: 0,
})

const selectedId = computed(() => String(props.modelValue ?? '').trim())

const displayText = computed(() => {
  if (!selectedId.value) {
    return props.placeholder
  }
  if (selectedTitle.value) {
    return `#${selectedId.value} ${selectedTitle.value}`
  }
  return `#${selectedId.value}`
})

const hasSelected = computed(() => selectedId.value.length > 0)

watch(selectedId, (value) => {
  if (!value) {
    selectedTitle.value = ''
    return
  }
  const matched = records.value.find((item) => String(item.id) === value)
  if (matched?.title) {
    selectedTitle.value = matched.title
  }
}, { immediate: true })

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '题目加载失败'
  }
  return error instanceof Error ? error.message : '题目加载失败'
}

function difficultyLabel(value: number | undefined) {
  if (value === 1) {
    return '入门'
  }
  if (value === 2) {
    return '简单'
  }
  if (value === 3) {
    return '中等'
  }
  if (value === 4) {
    return '困难'
  }
  if (value === 5) {
    return '挑战'
  }
  return '-'
}

async function loadProblems(current = pageState.current) {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getProblemPage({
      current,
      pageSize: pageState.pageSize,
      title: keyword.value.trim() || undefined,
    })
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '题目加载失败')
    }
    records.value = Array.isArray(response.data.records) ? response.data.records : []
    pageState.current = Number(response.data.current || current)
    pageState.total = Number(response.data.total || 0)
    pageState.pageSize = Number(response.data.size || pageState.pageSize)
    pageState.pages = Number(response.data.pages || 0)
    const matched = records.value.find((item) => String(item.id) === selectedId.value)
    if (matched?.title) {
      selectedTitle.value = matched.title
    }
  } catch (error) {
    records.value = []
    pageState.total = 0
    pageState.pages = 0
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function openPicker() {
  if (props.disabled) {
    return
  }
  modalOpen.value = true
  pageState.current = 1
  void loadProblems(1)
}

function closePicker() {
  if (loading.value) {
    return
  }
  modalOpen.value = false
}

function clearSelected() {
  if (props.disabled) {
    return
  }
  selectedTitle.value = ''
  emit('update:modelValue', '')
}

function pickProblem(row: ProblemVO) {
  const id = String(row.id || '').trim()
  if (!id) {
    return
  }
  selectedTitle.value = row.title || ''
  emit('update:modelValue', id)
  modalOpen.value = false
}

function handleSearch() {
  pageState.current = 1
  void loadProblems(1)
}

function handleReset() {
  keyword.value = ''
  pageState.current = 1
  void loadProblems(1)
}

function handlePageChange(nextPage: number) {
  pageState.current = nextPage
  void loadProblems(nextPage)
}

function handlePageSizeChange(nextSize: number) {
  pageState.pageSize = nextSize
  pageState.current = 1
  void loadProblems(1)
}
</script>

<template>
  <div class="problem-picker">
    <button
      type="button"
      class="problem-picker__trigger"
      :disabled="disabled"
      :title="displayText"
      @click="openPicker"
    >
      <span class="problem-picker__text" :class="{ 'is-placeholder': !hasSelected }">
        {{ displayText }}
      </span>
      <span class="problem-picker__action">选择</span>
    </button>

    <button
      v-if="hasSelected"
      type="button"
      class="problem-picker__clear"
      :disabled="disabled"
      title="清除题目筛选"
      @click="clearSelected"
    >
      清除
    </button>
  </div>

  <OjModal
    v-model="modalOpen"
    title="选择题目"
    :close-on-overlay="!loading"
    :close-on-esc="!loading"
    :show-close="!loading"
    max-width="58rem"
    @close="closePicker"
  >
    <div class="space-y-3">
      <form class="problem-picker__toolbar" @submit.prevent="handleSearch">
        <OjInput
          v-model="keyword"
          clearable
          placeholder="搜索题目标题"
          @keyup.enter="handleSearch"
        />
        <OjButton tone="info" size="small" native-type="submit" :disabled="loading">查询</OjButton>
        <OjButton tone="secondary" size="small" :disabled="loading" @click="handleReset">重置</OjButton>
      </form>

      <div
        v-if="errorMessage"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      >
        {{ errorMessage }}
      </div>

      <el-table
        :data="records"
        row-key="id"
        stripe
        height="320"
        table-layout="fixed"
        v-loading="loading"
      >
        <el-table-column label="#" width="64" align="center">
          <template #default="{ $index }">
            {{ (pageState.current - 1) * pageState.pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="题目ID" width="180" align="center">
          <template #default="{ row }">
            #{{ row.id }}
          </template>
        </el-table-column>

        <el-table-column label="题目标题" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.title }}
          </template>
        </el-table-column>

        <el-table-column label="难度" width="100" align="center">
          <template #default="{ row }">
            {{ difficultyLabel(row.difficulty) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <OjButton tone="info" size="small" @click="pickProblem(row)">选择</OjButton>
          </template>
        </el-table-column>
      </el-table>

      <OjPagination
        :current="pageState.current"
        :page-size="pageState.pageSize"
        :total="pageState.total"
        :pages="pageState.pages"
        :page-sizes="[8, 10, 20]"
        @current-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </OjModal>
</template>

<style scoped>
.problem-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.problem-picker__trigger {
  flex: 1;
  min-width: 0;
  min-height: 36px;
  border-radius: 10px;
  border: 1px solid rgb(226 232 240 / 1);
  background: rgb(255 255 255 / 1);
  color: rgb(15 23 42 / 1);
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.problem-picker__trigger:hover {
  border-color: color-mix(in srgb, var(--oj-primary) 45%, transparent);
}

.problem-picker__trigger:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--oj-primary) 54%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--oj-primary) 15%, transparent);
}

.problem-picker__trigger:disabled {
  cursor: not-allowed;
  opacity: 0.66;
}

.problem-picker__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 13px;
}

.problem-picker__text.is-placeholder {
  color: rgb(100 116 139 / 1);
}

.problem-picker__action {
  flex-shrink: 0;
  font-size: 12px;
  color: rgb(51 65 85 / 1);
}

.problem-picker__clear {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: rgb(100 116 139 / 1);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.problem-picker__clear:hover {
  color: rgb(220 38 38 / 1);
}

.problem-picker__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
}

:root[data-theme='dark'] .problem-picker__trigger {
  border-color: rgb(148 163 184 / 0.24);
  background: rgb(18 21 31 / 0.9);
  color: rgb(226 232 240 / 1);
}

:root[data-theme='dark'] .problem-picker__text.is-placeholder {
  color: rgb(148 163 184 / 1);
}

:root[data-theme='dark'] .problem-picker__action {
  color: rgb(148 163 184 / 1);
}

:root[data-theme='dark'] .problem-picker__clear {
  color: rgb(148 163 184 / 1);
}

:root[data-theme='dark'] .problem-picker__clear:hover {
  color: rgb(252 165 165 / 1);
}
</style>
