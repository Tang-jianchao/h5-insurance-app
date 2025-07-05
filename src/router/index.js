// src/router/index.js
import Home from '@/pages/Home.vue'
import Upload from '@/pages/Upload.vue'
import PolicyList from '@/pages/PolicyList.vue'
import AddPolicy from '@/pages/AddPolicy.vue'
import MemberList from '@/pages/MemberList.vue'
import Settings from '@/pages/Settings.vue'
import Profile from '@/pages/Profile.vue'

export default [
  { path: '/', component: Home },
  { path: '/upload', component: Upload },
  { path: '/policy-list', component: PolicyList },
  { path: '/add', component: AddPolicy },
  { path: '/member-list', component: MemberList },
  { path: '/settings', component: Settings },
  { path: '/profile', component: Profile },
]
