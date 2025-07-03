<template>
  <div class="policy-list">
    <van-nav-bar title="保单列表" fixed safe-area-inset-top />

    <!-- 搜索框 -->
    <van-search
      v-model="searchText"
      placeholder="搜索保单名称/被保人"
      shape="round"
      clearable
      @search="onSearch"
      @clear="onClearSearch"
      class="search-box"
    />

    <!-- 筛选项 -->
    <van-tabs v-model="activeTab" swipeable>
      <van-tab title="成员">
        <van-tag
          v-for="member in members"
          :key="member.id"
          :type="filter.memberId == member.id ? 'primary' : 'default'"
          class="filter-tag"
          @click="onFilterChange('memberId', member.id)"
          :round="true"
          plain
        >
          {{ member.name }}
        </van-tag>
      </van-tab>

      <van-tab title="险种">
        <van-tag
          v-for="type in policyTypes"
          :key="type"
          :type="filter.type === type ? 'primary' : 'default'"
          class="filter-tag"
          @click="onFilterChange('type', type)"
          :round="true"
          plain
        >
          {{ type }}
        </van-tag>
      </van-tab>

      <van-tab title="状态">
        <van-tag
          v-for="status in policyStatuses"
          :key="status"
          :type="filter.status === status ? 'primary' : 'default'"
          class="filter-tag"
          @click="onFilterChange('status', status)"
          :round="true"
          plain
        >
          {{ status }}
        </van-tag>
      </van-tab>
    </van-tabs>

    <!-- 保单卡片列表 -->

    <div class="cards">
      <van-swipe-cell
        v-for="policy in filteredPolicies"
        :key="policy.id"
        class="modern-card"
      >
        <template #left>
          <van-button square type="primary" icon="edit" class="swipe-btn edit-btn" @click.stop="onEditPolicy(policy)" />
        </template>
        <template #right>
          <van-button square type="danger" icon="delete" class="swipe-btn delete-btn" @click.stop="onDeletePolicy(policy)" />
        </template>
        <div class="card-content" @click="onCardClick(policy)">
          <div class="card-header">
            <div class="card-title">{{ policy.name }}</div>
            <van-tag v-if="policy.renewable === true" color="#07c160" plain round>保证续保</van-tag>
          </div>
          <div class="card-desc">投保人：{{ policy.policyHolder }} | 被保人：{{ policy.insured }} | 险种：{{ policy.policyType }}</div>
          <div class="card-footer">
            <span>保额: {{ policy.amount }} 万元</span>
            <span>起止: {{ policy.coveragePeriod }}</span>
          </div>
        </div>
      </van-swipe-cell>
      <div v-if="filteredPolicies.length === 0" class="empty-tip">
        无符合条件的保单
      </div>
    </div>

    <!-- 添加保单按钮 -->
    <van-button
      icon="plus"
      type="primary"
      circle
      class="add-btn"
      @click="onAddPolicy"
    />
  </div>
</template>

<script setup>

import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db } from '@/utils/db'
import { showConfirmDialog, showToast } from 'vant'


const router = useRouter()
const route = useRoute()

const searchText = ref('')
const activeTab = ref('成员')

const filter = ref({
  memberId: '',
  type: '',
  status: ''
})

const members = ref([])
const policyTypes = ref([])
const policyStatuses = ['生效中', '待生效', '已过期']
const policies = ref([])

onMounted(async () => {
  // 获取成员
  members.value = await db.getAllMembers()
  // 获取保单
  const allPolicies = await db.getAllPolicies()
  policies.value = allPolicies
  // 险种去重
  policyTypes.value = [...new Set(allPolicies.map(p => p.policyType).filter(Boolean))]
  // 进入页面时从参数获取 memberId
  if (route.query.memberId) {
    filter.value.memberId = String(route.query.memberId)
  }
})

// 过滤规则
const filteredPolicies = computed(() => {
  return policies.value.filter((p) => {
    const matchSearch =
      !searchText.value ||
      p.name?.includes(searchText.value) ||
      p.insured?.includes(searchText.value)
    const matchMember = !filter.value.memberId || String(p.insuredMemberId) === String(filter.value.memberId)
    const matchType = !filter.value.type || p.policyType === filter.value.type
    // 状态字段可根据实际业务调整
    const matchStatus = !filter.value.status || p.status === filter.value.status
    return matchSearch && matchMember && matchType && matchStatus
  })
})

function onFilterChange(field, val) {
  if (field === 'memberId') {
    filter.value.memberId = filter.value.memberId === val ? '' : val
  } else {
    filter.value[field] = filter.value[field] === val ? '' : val
  }
}

function onSearch() {
  // 搜索触发，computed 会自动响应，无需额外逻辑
}

function onClearSearch() {
  searchText.value = ''
}

function onAddPolicy() {
  router.push('/add')
}


function onCardClick(policy) {
  // 跳转到新增保单页并传递保单详情，进入只读模式
  router.push({
    path: '/add',
    query: { ...policy, readonly: '1' }
  })
}

function onEditPolicy(policy) {
  // 跳转到编辑保单页
  router.push({
    path: '/add',
    query: { ...policy, readonly: '0' }
  })
}

function onDeletePolicy(policy) {
    showConfirmDialog({
    title: '确认删除',
    message: `确定要删除保单「${policy.name}」吗？删除后无法恢复。`
  }).then(async () => {
    await db.deletePolicy(policy.id)
     policies.value = policies.value.filter(p => p.id !== policy.id)
    showToast('已删除')
  })
}

function footerContent(policy) {
  return `保额: ${policy.amount} 万元 | 起止: ${policy.coveragePeriod}`
}
</script>

<style scoped>
.policy-list {
  padding: 50px 12px 80px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}
.search-box {
  margin: 12px 0;
}
.filter-tag {
  margin: 4px 8px 8px 0;
  cursor: pointer;
}
.cards {
  margin-top: 0;
  background: #f7f8fa;
  border-radius: 14px;
  padding: 8px 0 4px 0;
}
.cards:not(:first-child) {
  margin-top: 12px;
}
.modern-card {
  margin-bottom: 14px;
  border-radius: 14px;
  box-shadow: 0 4px 16px 0 rgba(25,137,250,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.06);
  background: #fff;
  overflow: hidden;
  transition: box-shadow 0.2s, background 0.2s;
}
.modern-card .card-content {
  padding: 18px 20px 14px 20px;
  cursor: pointer;
}
.modern-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.modern-card .card-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
}
.modern-card .card-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.modern-card .card-footer {
  font-size: 13px;
  color: #999;
  display: flex;
  justify-content: space-between;
}
.swipe-btn {
  height: 100%;
  border-radius: 0;
  font-size: 18px;
}
.edit-btn {
  background: #1989fa;
  color: #fff;
  border: none;
}
.delete-btn {
  background: #ee0a24;
  color: #fff;
  border: none;
}
.empty-tip {
  text-align: center;
  color: #999;
  margin: 40px 0;
  font-size: 14px;
}
.add-btn {
  position: fixed;
  right: 16px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #1989fa;
  color: #fff;
  border: none;
}
</style>
