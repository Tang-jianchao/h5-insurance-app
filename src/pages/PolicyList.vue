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
          :type="filter.member === member.id ? 'primary' : 'default'"
          class="filter-tag"
          @click="onFilterChange('member', member.id)"
          :round="true"
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
        >
          {{ status }}
        </van-tag>
      </van-tab>
    </van-tabs>

    <!-- 保单卡片列表 -->
    <div class="cards">
      <van-card
        v-for="policy in filteredPolicies"
        :key="policy.id"
        :title="policy.name"
        :desc="`投保人：${policy.policyHolder} | 被保人：${policy.insured} | 险种：${policy.policyType}`"
        class="policy-card"
        :footer="footerContent(policy)"
        @click="onCardClick(policy)"
      >
        <template #tags>
          <van-tag
            v-if="policy.renewable === true"
            color="#07c160"
            plain
            round
            style="margin-right: 4px"
            >保证续保</van-tag
          >
        </template>
        <template #footer>
          <div class="footer-info">
            <span>保额: {{ policy.amount }} 万元</span>
            <span>起止: {{ policy.coveragePeriod }}</span>
          </div>
        </template>
      </van-card>

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

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/utils/db'

const router = useRouter()

const searchText = ref('')
const activeTab = ref('成员')

const filter = ref({
  member: '',
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
  const allPolicies = JSON.parse(localStorage.getItem('policies') || '[]')
  policies.value = allPolicies
  // 险种去重
  policyTypes.value = [...new Set(allPolicies.map(p => p.policyType).filter(Boolean))]
})

// 过滤规则
const filteredPolicies = computed(() => {
  return policies.value.filter((p) => {
    const matchSearch =
      !searchText.value ||
      p.name?.includes(searchText.value) ||
      p.insured?.includes(searchText.value)
    const matchMember = !filter.value.member || p.insured === filter.value.member
    const matchType = !filter.value.type || p.policyType === filter.value.type
    // 状态字段可根据实际业务调整
    const matchStatus = !filter.value.status || p.status === filter.value.status
    return matchSearch && matchMember && matchType && matchStatus
  })
})

function onFilterChange(field, val) {
  if (filter.value[field] === val) {
    filter.value[field] = ''
  } else {
    filter.value[field] = val
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
  margin-top: 12px;
  background: #f7f8fa;
  border-radius: 14px;
  padding: 8px 0 4px 0;
}
.policy-card {
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(25,137,250,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.06);
  border: 1.5px solid #e3eaf5;
  background: #fff;
  transition: box-shadow 0.2s, background 0.2s;
}
.policy-card:nth-child(odd) {
  background: #f4f8ff;
}
.policy-card:hover {
  box-shadow: 0 8px 24px 0 rgba(25,137,250,0.18), 0 2px 8px 0 rgba(0,0,0,0.10);
  background: #e6f0ff;
}
.footer-info {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
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
