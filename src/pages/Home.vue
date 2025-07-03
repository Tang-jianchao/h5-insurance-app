<template>
  <div class="home">
    <van-nav-bar title="家庭保单总览" fixed safe-area-inset-top />

    <!-- 家庭成员列表 -->
    <section class="section family-members">
      <div class="family-header">
        <h3>家庭成员</h3>
        <span class="policy-link" @click="goToMemberList">成员列表</span>
      </div>
      <van-list>
        <van-cell
          v-for="member in members"
          :key="member.id"
          :title="member.name"
          is-link
          @click="goToMember(member.id)"
        >
          <template #icon>
            <van-image
              :src="member.avatar"
              width="40"
              height="40"
              round
              fit="cover"
            />
          </template>
        </van-cell>
      </van-list>
    </section>

    <!-- 保单状态统计 -->
    <section class="section policy-stats">
      <div class="policy-header">
        <h3>保单状态</h3>
        <span class="policy-link" @click="goToPolicyList">保单列表</span>
      </div>
      <van-row gutter="16" justify="space-around">
        <van-col span="7" class="stat-card active">
          <div class="num">{{ stats.total }}</div>
          <div class="label">保单总数</div>
        </van-col>
        <van-col span="7" class="stat-card effect">
          <div class="num">{{ stats.active }}</div>
          <div class="label">生效中</div>
        </van-col>
        <van-col span="7" class="stat-card expiring">
          <div class="num">{{ stats.expiring }}</div>
          <div class="label">即将到期</div>
        </van-col>
      </van-row>
    </section>

    <!-- 保费与保额图表 -->
    <section class="section charts">
      <h3>保费与保额</h3>
      <div id="chart-fee" class="chart"></div>
      <div id="chart-amount" class="chart"></div>
    </section>

    <!-- 重要提醒 -->
    <section class="section reminders">
      <h3>重要提醒</h3>
      <van-list>
        <van-cell
          v-for="remind in reminders"
          :key="remind.id"
          :title="remind.title"
          :label="remind.desc"
          :icon="remind.icon"
          :style="{ color: remind.color }"
        />
        <div v-if="reminders.length === 0" class="empty-tip">暂无提醒</div>
      </van-list>
    </section>

    <!-- 快捷操作按钮 -->
    <section class="section quick-actions">
      <van-button
        type="primary"
        icon="plus"
        block
        round
        class="action-btn"
        @click="onAddPolicy"
      >
        添加保单
      </van-button>
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <van-button
          type="info"
          icon="notes-o"
          block
          round
          style="flex:1"
          @click="onImportTestData"
        >
          测试数据
        </van-button>
        <van-button
          type="info"
          icon="upload"
          block
          round
          style="flex:1"
          @click="onImport"
        >
          导入数据
        </van-button>
      </div>
      <van-button
        type="warning"
        icon="backup"
        block
        round
        class="action-btn"
        @click="onBackup"
      >
        备份
      </van-button>
    </section>

    
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { db } from '@/utils/db'
import { importData } from '@/utils/importData'

const router = useRouter()

const members = ref([])

const stats = ref({
  total: 0,
  active: 0,
  expiring: 0
})

const reminders = ref([
  {
    id: 'r1',
    title: '保单A即将到期',
    desc: '距离到期还有5天',
    icon: 'warning-o',
    color: '#FF5722'
  },
  {
    id: 'r2',
    title: '保单B等待期结束',
    desc: '等待期将于明天结束',
    icon: 'clock-o',
    color: '#FF9800'
  }
])


// 图表初始化和成员数据加载
onMounted(async () => {
  // 从db获取成员
  members.value = await db.getAllMembers()
  // 从db获取保单
  const policies = await db.getAllPolicies()
  const now = new Date()
  stats.value.total = policies.length
  stats.value.active = policies.filter(p => {
    // 只要当前日期小于 coverageEnd 即为生效中
    if (!p.coverageEnd) return false
    const end = new Date(p.coverageEnd)
    return now < end
  }).length
  stats.value.expiring = policies.filter(p => {
    if (!p.coverageEnd) return false
    const end = new Date(p.coverageEnd)
    const diff = (end - now) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 7
  }).length

  // 图表数据处理
  // 成员名列表
  const categories = members.value.map(m => m.name)
  // 险种列表（去重）
  const policyTypes = [...new Set(policies.map(p => p.policyType).filter(Boolean))]

  // 保费分布数据
  const feeSeries = policyTypes.map(type => ({
    name: type,
    type: 'bar',
    stack: 'total',
    data: categories.map(memberName => {
      // 该成员该险种的保费总和
      return policies
        .filter(p => p.insured === memberName && p.policyType === type)
        .reduce((sum, p) => sum + (Number(p.premium) || 0), 0)
    })
  }))

  // 保额分布数据
  const amountSeries = policyTypes.map(type => ({
    name: type,
    type: 'bar',
    stack: 'total',
    data: categories.map(memberName => {
      return policies
        .filter(p => p.insured === memberName && p.policyType === type)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    })
  }))

  // 图表初始化
  const feeChart = echarts.init(document.getElementById('chart-fee'))
  const amountChart = echarts.init(document.getElementById('chart-amount'))

  feeChart.setOption({
    title: { text: '保费分布（元）', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {},
    legend: { data: policyTypes, bottom: 0 },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: feeSeries
  })

  amountChart.setOption({
    title: { text: '保额分布（万元）', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {},
    legend: { data: policyTypes, bottom: 0 },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: amountSeries
  })
})

// 事件处理
function goToMember(id) {
  // 跳转到成员列表页面
  router.push('/member-list')
}
// 导入数据（原有逻辑）
function onImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      await importData(file)
    }
  }
  input.click()
}

// 导入测试数据
async function onImportTestData() {
  // 直接读取 /src/assets/test.json 并导入
  const res = await fetch('/src/assets/test.json')
  if (res.ok) {
    const json = await res.json()
    await importData(json)
  } else {
    alert('无法加载测试数据文件')
  }
}
function onBackup() {
  alert('备份操作')
}
function goToPolicyList() {
  // 跳转到保单列表页面
  // router.push('/policy-list')
  window.location.hash = '#/policy-list'
}
function onAddPolicy() {
  router.push('/add')
}
function goToMemberList() {
  router.push('/member-list')
}
</script>

<style scoped>
.home {
  padding: 50px 12px 90px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}
.section {
  margin-bottom: 20px;
}
.family-members h3,
.policy-stats h3,
.charts h3,
.reminders h3,
.quick-actions h3 {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
}
/* 统计卡片 */
.stat-card {
  background: #fff;
  padding: 12px 0;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 6px rgb(0 0 0 / 0.1);
  cursor: default;
}
.stat-card .num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.stat-card .label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
.stat-card.active {
  color: #1989fa;
}
.stat-card.effect {
  color: #07c160;
}
.stat-card.expiring {
  color: #ff4400;
}

/* 图表容器 */
.chart {
  height: 180px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgb(0 0 0 / 0.1);
}

/* 重要提醒样式 */
.reminders .van-cell {
  margin-bottom: 4px;
}
.empty-tip {
  color: #999;
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
}

/* 快捷操作按钮 */
.quick-actions .action-btn {
  margin-bottom: 12px;
}

/* tabbar样式 */
.tabbar-plus {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1989fa 60%, #07c160 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(25,137,250,0.18);
  margin-top: -18px; /* 调小突出高度，避免被遮挡 */
  border: 4px solid #fff;
  z-index: 10;
  position: relative;
}
.tabbar-create {
  padding: 0 !important;
  background: transparent !important;
  z-index: 10;
}
.van-tabbar {
  padding-bottom: 8px; /* 让内容不被遮挡 */
}

/* 家庭成员头部 */
.family-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.policy-link {
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
  margin-left: 12px;
  transition: text-decoration 0.2s;
}
.policy-link:hover {
  text-decoration: underline;
}

/* 保单状态头部 */
.policy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 家庭成员列表样式调整 */
.family-members .van-cell {
  align-items: center;
  min-height: 56px;
}
.family-members .van-cell__title {
  display: flex;
  align-items: center;
  min-height: 40px;
}
.family-members .van-cell__right-icon {
  align-items: center;
  display: flex;
}
</style>
