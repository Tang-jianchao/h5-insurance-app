<template>
  <div class="profile-page">
    <van-nav-bar title="个人中心" fixed safe-area-inset-top />

    <div class="user-header">
      <van-image
        round
        width="80"
        height="80"
        :src="avatarUrl"
        class="avatar"
      />
      <div class="user-info">
        <div class="user-name">{{ currentUser.name }}</div>
        <div class="user-role">{{ currentUser.relation }}</div>
      </div>
    </div>

    <van-cell-group title="功能导航" inset>
      <van-cell
        title="📦 我的保单"
        is-link
        @click="goToMyPolicies"
      />
      <van-cell
        title="📄 全部保单列表"
        is-link
        @click="goToAllPolicies"
      />
      <van-cell
        title="⚙️ 设置"
        is-link
        @click="goToSettings"
      />
    </van-cell-group>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

// 模拟当前用户
const currentUser = ref({
  id: 'me',
  name: '我自己',
  relation: '投保人'
})

const avatarUrl =
  'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const router = useRouter()

function goToMyPolicies() {
  // 携带过滤条件跳转到保单列表页
  router.push({
    path: '/policy-list',
    query: {
      memberId: currentUser.value.id
    }
  })
}

function goToAllPolicies() {
  router.push('/policy-list')
}

function goToSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.profile-page {
  padding: 50px 12px 80px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.user-header {
  display: flex;
  align-items: center;
  padding: 24px 12px 12px;
  background: white;
  border-radius: 12px;
  margin: 16px auto;
}

.avatar {
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info {
  margin-left: 16px;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
}

.user-role {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
</style>
