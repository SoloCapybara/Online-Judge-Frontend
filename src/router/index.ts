import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: { title: '控制台' },
      },
      {
        path: 'problems',
        name: 'problems',
        component: () => import('../views/ProblemsView.vue'),
        meta: { title: '题库' },
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
        path: 'status',
        name: 'status',
        component: () => import('../views/StatusView.vue'),
        meta: { title: '评测状态' },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('../views/AdminView.vue'),
        meta: { title: '管理台' },
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
  const token = localStorage.getItem('oj-token')

  if (to.path !== '/login' && !token) {
    return '/login'
  }

  if (to.path === '/login' && token) {
    return '/'
  }

  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? '在线评测系统'} | OJ`
})

export default router
