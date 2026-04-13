import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { UserRole } from '../stores/user'
import { finishRouteProgress, startRouteProgress } from '../composables/useRouteProgress'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: { title: '首页', affix: true },
      },
      {
        path: 'problems',
        name: 'problems',
        component: () => import('../views/ProblemsView.vue'),
        meta: { title: '题库' },
      },
      {
        path: 'problems/create',
        name: 'problem-create',
        component: () => import('../views/ProblemEditView.vue'),
        meta: { title: '创建题目', roles: ['teacher', 'admin'] satisfies UserRole[] },
      },
      {
        path: 'problems/:id/edit',
        name: 'problem-edit',
        component: () => import('../views/ProblemEditView.vue'),
        meta: { title: '编辑题目', roles: ['teacher', 'admin'] satisfies UserRole[] },
      },
      {
        path: 'problems/:id',
        name: 'problem-detail',
        component: () => import('../views/ProblemDetailView.vue'),
        meta: { title: '题目详情' },
      },
      {
        path: 'contests',
        name: 'contests',
        component: () => import('../views/ContestsView.vue'),
        meta: { title: '比赛' },
      },
      {
        path: 'contests/:id',
        name: 'contest-detail',
        component: () => import('../views/ContestDetailView.vue'),
        meta: { title: '比赛详情' },
      },
      {
        path: 'status',
        name: 'status',
        component: () => import('../views/StatusView.vue'),
        meta: { title: '评测状态' },
      },
      {
        path: 'submissions',
        name: 'submissions',
        component: () => import('../views/SubmissionsView.vue'),
        meta: { title: '提交记录' },
      },
      {
        path: 'rank',
        name: 'rank',
        component: () => import('../views/RankView.vue'),
        meta: { title: '排行榜' },
      },
      {
        path: 'user-center',
        name: 'user-center',
        component: () => import('../views/UserCenterView.vue'),
        meta: { title: '用户中心' },
      },
      {
        path: 'discuss',
        name: 'discuss',
        component: () => import('../views/DiscussView.vue'),
        meta: { title: '讨论区' },
      },
      {
        path: 'help',
        name: 'help',
        component: () => import('../views/HelpView.vue'),
        meta: { title: '帮助 / FAQ' },
      },
      {
        path: 'teacher',
        name: 'teacher',
        component: () => import('../views/TeacherView.vue'),
        meta: { title: '教师工作台', roles: ['teacher'] satisfies UserRole[] },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('../views/AdminView.vue'),
        meta: { title: '管理台', roles: ['admin'] satisfies UserRole[] },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  startRouteProgress()

  const token = localStorage.getItem('oj-token')
  const role = localStorage.getItem('oj-role') as UserRole | null
  const isPublicRoute = to.path === '/' || to.path === '/login'

  if (!isPublicRoute && !token) {
    return '/login'
  }

  if (to.path === '/login' && token) {
    return '/'
  }

  const roles = to.meta.roles as UserRole[] | undefined
  if (roles && role && !roles.includes(role)) {
    if (role === 'admin') {
      return '/admin'
    }
    if (role === 'teacher') {
      return '/teacher'
    }
    return '/'
  }

  return true
})

router.afterEach((to) => {
  finishRouteProgress()
  document.title = `${to.meta.title ?? '在线评测系统'} | OJ`
})

router.onError(() => {
  finishRouteProgress()
})

export default router
