import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('../views/DashboardView.vue') },
    { path: '/rentals', component: () => import('../views/RentalListView.vue') },
    { path: '/rentals/new', component: () => import('../views/RentalFormView.vue') },
    { path: '/rentals/:id', component: () => import('../views/RentalFormView.vue') },
    { path: '/freights', component: () => import('../views/FreightListView.vue') },
    { path: '/freights/new', component: () => import('../views/FreightFormView.vue') },
    { path: '/freights/:id', component: () => import('../views/FreightFormView.vue') },
    { path: '/inventory', redirect: '/admin' },
    { path: '/admin', component: () => import('../views/InventoryMgmtView.vue') },
    { path: '/summary', component: () => import('../views/SummaryView.vue') },
  ],
})

export default router
