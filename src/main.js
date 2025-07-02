import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './router'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(createPinia())

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    // 每次路由跳转都滚动到顶部
    return { top: 0 }
  }
})

app.use(router)

app.mount('#app')
