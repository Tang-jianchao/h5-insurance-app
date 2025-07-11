<template>
  <div class="home">
    <van-nav-bar title="家庭保单总览" fixed safe-area-inset-top />

    <!-- 重要提醒 NoticeBar 顶部展示，无标题 -->
    <div class="reminders-top" v-if="reminders.length > 0">
      <van-notice-bar left-icon="volume-o" :scrollable="false">
      <van-swipe
        vertical
        class="notice-swipe"
        :autoplay="3000"
        :touchable="false"
        :show-indicators="false"
      >
        <van-swipe-item v-for="reminder in reminders" class="reminder-swipe-item">
          <span class="reminder-text">{{ reminder.title + '，' + reminder.desc }}</span>
        </van-swipe-item>
      </van-swipe>
    </van-notice-bar>
    </div>

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
              :src="member.avatar || defaultAvatar"
              width="40"
              height="40"
              round
              fit="cover"
              class="member-avatar"
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
      <div class="chart-title chart-title-fee flex-row-between">
        <span>保费分布（元）</span>
        <span class="chart-title-total highlight-green">总保费：{{ totalFee }} 元</span>
      </div>
      <FeePieChart :data="feePieData" />
      <div class="chart-title chart-title-amount flex-row-between">
        <span>保额分布（万元）</span>
        <span class="chart-title-total highlight-green">总保额：{{ totalAmount }} 万元</span>
      </div>
      <BaseBarChart :data="barChartData" :chartConfig="barChartConfig" chart-id="chart-amount" />

    </section>


    <!-- 底部浮动操作按钮组 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="onActionSelect"
      cancel-text="取消"
      close-on-click-action
    />
    <div class="fab-container">
      <van-button
        type="primary"
        icon="like"
        class="fab-btn"
        @click="showActionSheet = true"
        round
      />
    </div>

    
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import * as echarts from 'echarts'
import FeePieChart from '@/components/FeePieChart.vue'
import BaseBarChart from '@/components/BaseBarChart.vue'
import { useRouter } from 'vue-router'
import { useMemberStore } from '@/stores/memberStore'
import { usePolicyStore } from '@/stores/policyStore'
import { useSettingStore } from '@/stores/settingStore'
import { importData } from '@/utils/importData'
import { showToast } from 'vant'
import defaultAvatar from '@/assets/default-avatar.png'

const router = useRouter()
const barChartData = ref([])
const barChartConfig = ref({})
const memberStore = useMemberStore()
const policyStore = usePolicyStore()
const settingStore = useSettingStore()
const { members } = storeToRefs(memberStore)
const { policies } = storeToRefs(policyStore)

// 总保费使用 computed 计算属性
const totalFee = computed(() => {
  return policies.value.reduce((sum, p) => sum + (Number(p.premium) || 0), 0)
})

// 总保额
const totalAmount = computed(() => {
  return policies.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
})

// 保单状态统计和重要提醒整合
const stats = computed(() => {
  const now = new Date()
  const { waiting, expiry } = settingStore.getReminderDays()
  let total = policies.value.length
  let active = 0
  let expiring = 0
  let remindersArr = []
  policies.value.forEach(p => {
    // 生效中
    if (p.coverageEnd) {
      const end = new Date(p.coverageEnd)
      if (now < end) active++
      const diff = (end - now) / (1000 * 60 * 60 * 24)
      if (diff > 0 && diff <= expiry) {
        expiring++
        remindersArr.push({
          id: 'expiring-' + p.id,
          title: `${p.insured}的${p.policyName || p.policyType || '保单'}即将到期`,
          desc: `距离到期还有${Math.ceil(diff)}天`,
          icon: 'warning-o',
          color: '#FF5722'
        })
      }
    }
    // 等待期即将结束
    if (p.waitingEnd) {
      const wend = new Date(p.waitingEnd)
      const wdiff = (wend - now) / (1000 * 60 * 60 * 24)
      if (wdiff > 0 && wdiff <= waiting) {
        remindersArr.push({
          id: 'waiting-' + p.id,
          title: `${p.insured}的${p.policyName || p.policyType || '保单'}等待期即将结束`,
          desc: `等待期将于${Math.ceil(wdiff)}天后结束`,
          icon: 'clock-o',
          color: '#FF9800'
        })
      }
    }
  })
  return { total, active, expiring, reminders: remindersArr }
})
// 饼图数据响应式
const feePieData = ref([])

// 底部浮动操作按钮相关
const showActionSheet = ref(false)
const actionSheetActions = [
  // { name: '添加保单', icon: 'plus', key: 'add' },
  { name: '测试数据', icon: 'notes-o', key: 'test' },
  { name: '导入数据', icon: 'logistics', key: 'import' }, // 物流/导入
  { name: '备份', icon: 'records', key: 'backup' } // 记录/备份
]
function onActionSelect(action) {
  showActionSheet.value = false
  switch (action.key) {
    case 'add':
      onAddPolicy()
      break
    case 'test':
      onImportTestData()
      break
    case 'import':
      onImport()
      break
    case 'backup':
      onBackup()
      break
  }
}

// 重要提醒直接用 stats.computed
const reminders = computed(() => stats.value.reminders)


// 图表初始化和成员数据加载
onMounted(async () => {
  // 从store获取成员和保单
  await memberStore.fetchMembers()
  await policyStore.fetchPolicies()
  // 图表数据处理
  const now = new Date()
  const policiesArr = policyStore.policies
  const categories = members.value.map(m => m.name)
  const policyTypes = [...new Set(policiesArr.map(p => p.policyType).filter(Boolean))]

  // 保费分布饼状图数据（以家庭成员为维度，过滤为0的数据）
  feePieData.value = categories.map(memberName => {
    const value = policiesArr
      .filter(p => p.insured === memberName)
      .reduce((sum, p) => sum + (Number(p.premium) || 0), 0)
    return {
      name: memberName,
      value
    }
  }).filter(item => item.value > 0)

  // 保额分布柱状图数据和配置（过滤所有成员都为0的险种）
  let rawAmountSeries = policyTypes.map(type => ({
    name: type,
    type: 'bar',
    stack: 'total',
    data: categories.map(memberName => {
      return policiesArr
        .filter(p => p.insured === memberName && p.policyType === type)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    })
  }))
  // 只保留有至少一个成员保额大于0的险种
  const amountSeries = rawAmountSeries.filter(series => series.data.some(val => val > 0))

  const yAxisOpt = {
    type: 'value',
    axisLabel: {
      show: true,
      formatter: function (value, idx) {
        try {
          const axis = this && this.axis ? this.axis : (typeof idx === 'object' && idx.axis ? idx.axis : undefined);
          if (axis && axis.scale) {
            const min = axis.scale._extent[0];
            const max = axis.scale._extent[1];
            if (value === min || value === max) return value;
          }
        } catch (e) { }
        return '';
      }
    },
    splitNumber: 2
  }

  const addTotalLabel = (seriesArr) => {
    return seriesArr.map((s, idx) => {
      if (idx !== seriesArr.length - 1) {
        return { ...s, label: { show: false } }
      }
      return {
        ...s,
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          color: '#333',
          formatter: function (params) {
            const total = seriesArr.reduce((sum, ser) => sum + (ser.data[params.dataIndex] || 0), 0)
            return total > 0 ? total : ''
          }
        }
      }
    })
  }

  barChartData.value = amountSeries.map(s => s.data)
  barChartConfig.value = {
    title: { text: '', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        // params: 数组，每个系列在该类目下的数据
        let name = params[0]?.axisValueLabel || params[0]?.name || ''
        let lines = [`<div style='font-weight:600;margin-bottom:2px;'>${name}</div>`]
        params.forEach(item => {
          // item.seriesName: 险种，item.value: 保额
          if (item.value > 0) {
            lines.push(`<span style='display:inline-block;margin-right:6px;width:10px;height:10px;border-radius:50%;background:${item.color}'></span>`
              + `${item.seriesName}：<b style='color:#333'>${item.value}</b> 万元`)
          }
        })
        return lines.join('<br/>')
      }
    },
    legend: { data: policyTypes, bottom: 0 },
    xAxis: { type: 'category', data: categories },
    yAxis: yAxisOpt,
    series: addTotalLabel(amountSeries)
  }
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

// 导入测试数据（需将 test.json 放到 public 目录下，打包后通过 /test.json 访问）
async function onImportTestData() {
  try {
    const res = await fetch('/test.json')
    if (!res.ok) throw new Error('无法加载测试数据文件')
    // 大文件异步流式加载
    const json = await res.json()
    await importData(json)
  } catch (e) {
    alert('导入测试数据失败：' + (e.message || e))
  }
}
function onBackup() {
  showToast('备份操作')
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

.chart-title {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  margin-bottom: 8px;
}
.chart-title-fee {
  margin-bottom: 8px;
}
.flex-row-between {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.chart-title-amount {
  margin: 18px 0 8px 0;
}
.chart-title-total {
  font-weight: 400;
  font-size: 13px;
  color: #888;
  margin-left: 8px;
}

.highlight-green {
  color: #07c160 !important;
  font-weight: 600;
  background: #eaffea;
  border-radius: 4px;
  padding: 2px 8px;
  margin-left: 8px;
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

/* 浮动操作按钮样式 */
.fab-container {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 200;
  pointer-events: auto;
}
.fab-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1989fa 60%, #07c160 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(25,137,250,0.18);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  padding: 0;
  transition: box-shadow 0.2s;
}
.fab-btn:active {
  box-shadow: 0 2px 8px rgba(25,137,250,0.12);
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
.member-avatar {
  margin-right: 12px;
}
.remind-notice {
  margin-bottom: 8px;
}

/* 重要提醒 swipe item 垂直居中样式 */
.reminder-swipe-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  min-height: 40px;
  width: 100%;
  box-sizing: border-box;
}
.reminder-text {
  font-size: 15px;
  color: #ff5722;
  font-weight: 500;
  text-align: center;
  width: 100%;
  line-height: 1.4;
}
  .notice-swipe {
    height: 40px;
    line-height: 40px;
  }

</style>

