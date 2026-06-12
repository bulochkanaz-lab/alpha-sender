import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      // Вказуємо, що ця сторінка потребує авторизації
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

// Той самий "охоронець" (Navigation Guard)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Якщо сторінка вимагає авторизації, а токена немає
  if (to.meta.requiresAuth && !authStore.token) {
    next('/login') // Відправляємо на логін
  } else if (to.path === '/login' && authStore.token) {
    next('/dashboard') // Якщо вже є токен, не даємо сидіти на сторінці логіну
  } else {
    next() // Всі інші випадки - пропускаємо
  }
})

export default router
