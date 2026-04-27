<script setup lang="ts">
import type { Component } from 'vue'

interface SidebarItem {
  key: string
  label: string
  icon: Component
}

interface SidebarSection {
  label: string
  items: SidebarItem[]
}

defineProps<{
  title: string
  subtitle: string
  activeKey: string
  sections: SidebarSection[]
  collapsed: boolean
  drawerOpen: boolean
}>()

const emit = defineEmits<{
  select: [key: string]
  toggleCollapse: []
}>()
</script>

<template>
  <aside
    class="oj-sidebar flex h-screen max-h-[100dvh] flex-col gap-3 overflow-hidden px-3 py-3.5"
    :class="{ 'is-collapsed': collapsed, 'is-open': drawerOpen }"
    aria-label="站点导航"
  >
    <div class="sidebar-brand-row flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        class="sidebar-brand-link flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left text-inherit no-underline lg:min-h-0"
        @click="emit('select', '/')"
      >
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 font-mono text-sm font-bold text-white shadow-lg shadow-violet-500/25">
          { }
        </div>
        <div class="brand-text flex min-w-0 flex-col leading-tight">
          <div class="truncate text-[0.95rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ title }}</div>
          <div class="truncate text-xs text-slate-500 dark:text-slate-400">{{ subtitle }}</div>
        </div>
      </button>

      <button
        type="button"
        class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-[#181c2a] dark:text-slate-300 dark:hover:bg-white/[0.06] lg:inline-flex"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? '展开侧栏' : '折叠侧栏'"
        @click="emit('toggleCollapse')"
      >
        <svg class="collapse-icon h-5 w-5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <div class="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-color:rgba(148,163,184,0.45)_transparent] [scrollbar-width:thin]">
      <section v-for="section in sections" :key="section.label" class="nav-section-wrap">
        <div class="nav-section-h px-3 pb-1 pt-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] leading-none text-slate-400">
          {{ section.label }}
        </div>
        <button
          v-for="item in section.items"
          :key="item.key"
          type="button"
          :title="collapsed ? item.label : ''"
          class="sidebar-nav-link flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition"
          :class="
            activeKey === item.key
              ? 'bg-violet-500/10 text-slate-900 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)] dark:text-slate-100'
              : 'text-slate-500 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100'
          "
          @click="emit('select', item.key)"
        >
          <el-icon class="h-5 w-5 shrink-0 opacity-90"><component :is="item.icon" /></el-icon>
          <span class="nav-label truncate">{{ item.label }}</span>
        </button>
      </section>
    </div>

  </aside>
</template>

<style scoped>
.oj-sidebar {
  position: sticky;
  top: 0;
  z-index: 35;
  background: var(--oj-sidebar-bg);
  border-right: 1px solid var(--oj-border);
  border-right-width: 1px;
  transform: translateZ(0);
  will-change: transform;
  contain: paint;
}

.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.35);
}

.nav-section-wrap + .nav-section-wrap {
  margin-top: 0.85rem;
}

.nav-section-wrap .sidebar-nav-link + .sidebar-nav-link {
  margin-top: 0.25rem;
}

.nav-section-h {
  transform: translateY(1px);
}

.sidebar-nav-link :deep(.el-icon) {
  font-size: 20px;
}

@media (min-width: 1024px) {
  .oj-sidebar.is-collapsed .nav-label,
  .oj-sidebar.is-collapsed .brand-text,
  .oj-sidebar.is-collapsed .nav-section-h,
  .oj-sidebar.is-collapsed .sidebar-footer-prose {
    display: none;
  }

  .oj-sidebar.is-collapsed .sidebar-brand-row {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .oj-sidebar.is-collapsed .sidebar-brand-link {
    flex: none;
    width: auto;
    min-width: 0;
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .oj-sidebar.is-collapsed .sidebar-nav-link {
    justify-content: center;
    min-height: 40px;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .oj-sidebar.is-collapsed .nav-section-wrap + .nav-section-wrap {
    margin-top: 0.25rem;
  }

  .oj-sidebar.is-collapsed .footer-btn-label {
    display: none;
  }

  .oj-sidebar.is-collapsed .sidebar-footer-btn {
    width: 100%;
    justify-content: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .oj-sidebar.is-collapsed .collapse-icon {
    transform: rotate(180deg);
  }
}

@media (max-width: 960px) {
  .oj-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    width: min(280px, 88vw);
    transform: translateX(calc(-100% - 12px));
    box-shadow: none;
    will-change: transform;
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .oj-sidebar.is-open {
    transform: translateX(0);
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.16);
  }
}

@media (prefers-reduced-motion: reduce) {
  .oj-sidebar {
    transition: none !important;
  }

  .collapse-icon {
    transition: none !important;
  }
}
</style>
