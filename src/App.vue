<template>
  <div class="app">
    <router-view />

    <van-tabbar v-if="showTabbar" v-model="active" route>
      <van-tabbar-item to="/" icon="wap-home">首页</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingStore } from '@/stores/settingStore'

const active = ref('/')
const route = useRoute()
const showTabbarList = ['/policy-list', '/', '/member-list','/profile']
const showTabbar = computed(() => showTabbarList.includes(route.path))

// 初始化设置
onMounted(() => {
  useSettingStore().loadSetting()
})

// 同步 TabBar 选中状态
watch(
  () => route.path,
  (path) => {
    active.value = path
  },
  { immediate: true }
)
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #f7f8fa;
}
.app {
  min-height: 100%;
  padding-bottom: 50px; /* 给 TabBar 留空间 */
  box-sizing: border-box;
}
</style>
