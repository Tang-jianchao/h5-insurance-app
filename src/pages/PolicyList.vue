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

    <!-- 筛选项：下拉选择 -->
    <div class="filter-selects">
      <van-dropdown-menu>
        <van-dropdown-item
          v-model="filter.memberId"
          :options="memberOptions"
          title="成员"
          @change="onFilterChange('memberId', $event)"
        />
        <van-dropdown-item
          v-model="filter.type"
          :options="typeOptions"
          title="险种"
          @change="onFilterChange('type', $event)"
        />
        <van-dropdown-item
          v-model="filter.status"
          :options="statusOptions"
          title="状态"
          @change="onFilterChange('status', $event)"
        />
      </van-dropdown-menu>
    </div>

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
            <van-tag
              v-if="policy.policyType"
              :style="{ color: getPolicyTypeColor(policy.policyType), borderColor: getPolicyTypeColor(policy.policyType) }"
              plain round class="type-tag"
            >
              {{ policy.policyType }}
            </van-tag>
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
import { usePolicyStore } from '@/stores/policyStore'
import { useMemberStore } from '@/stores/memberStore'
import { showConfirmDialog, showToast } from 'vant'
import { POLICY_STATUS_OPTIONS, POLICY_TYPES, POLICY_TYPE_COLORS } from '@/utils/constant'


const router = useRouter()
const route = useRoute()

const searchText = ref('')



const filter = ref({
  memberId: '',
  type: '',
  status: ''
})
// 险种名转code
function getPolicyTypeCode(typeName) {
  const found = POLICY_TYPES.find(t => t.label === typeName)
  return found ? found.code : undefined
}
// // 险种code转色彩
function getPolicyTypeColor(typeName) {
  const code = getPolicyTypeCode(typeName)
  const found = POLICY_TYPE_COLORS.find(c => c.policyTypeCode === code)
  return found ? found.color : '#1989fa'
}

// vant 下拉选项格式
const memberOptions = computed(() => [
  { text: '全部成员', value: '' },
  ...members.value.map(m => ({ text: m.name, value: String(m.id) }))
])
const typeOptions = computed(() => [
  { text: '全部险种', value: '' },
  ...policyTypes.value.map(t => ({ text: t, value: t }))
])
const statusOptions = computed(() => [
  { text: '全部状态', value: '' },
  ...policyStatuses.map(s => ({ text: s.label, value: s.code }))
])

const memberStore = useMemberStore()
const { members } = storeToRefs(memberStore)
import { storeToRefs } from 'pinia'
const policyStore = usePolicyStore()
const { policies } = storeToRefs(policyStore)
const policyTypes = ref([])
const policyStatuses = POLICY_STATUS_OPTIONS

onMounted(async () => {
  // 获取成员（从store）
  await memberStore.fetchMembers()
  // 获取保单（从store）
  await policyStore.fetchPolicies()
  // 险种去重
  policyTypes.value = [...new Set(policies.value.map(p => p.policyType).filter(Boolean))]
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
  filter.value[field] = val
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
    await policyStore.deletePolicy(policy.id)
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
.filter-selects {
  margin: 10px 0 8px 0;
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
.type-tag {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  padding: 0 10px;
  height: 22px;
  line-height: 20px;
  border-radius: 12px;
}
</style>
