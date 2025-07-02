<template>
  <div class="policy-detail">
    <van-nav-bar
      title="保单详情"
      fixed
      safe-area-inset-top
      left-arrow
      @click-left="onBack"
    />

    <van-cell-group inset>
      <!-- 基本信息 -->
      <van-cell title="保单名称" :value="policy.name" />
      <van-cell title="保险公司" :value="policy.company" />
      <van-cell title="成员" :value="policy.member" />
    </van-cell-group>

    <van-cell-group inset class="section">
      <van-cell title="保费" :value="policy.premium + ' 元'" />
      <van-cell title="保额" :value="policy.amount + ' 万元'" />
      <van-cell title="缴费周期" :value="policy.paymentCycle" />
    </van-cell-group>

    <!-- 附件展示 -->
    <van-cell-group inset class="section">
      <template v-if="attachments.length">
        <van-cell title="附件" is-link @click="onOpenAttachment" />
      </template>
      <template v-else>
        <van-cell title="附件" value="无" />
      </template>
    </van-cell-group>

    <!-- 保障摘要 -->
    <van-cell-group inset class="section">
      <van-cell title="保障责任" :value="policy.coverage" />
      <van-cell title="免赔额" :value="policy.deductible" />
    </van-cell-group>

    <!-- 重要时间 -->
    <van-cell-group inset class="section">
      <van-cell title="等待期" :value="policy.waitingPeriod" />
      <van-cell title="续保时间" :value="policy.renewalDate" />
    </van-cell-group>

    <!-- 底部操作 -->
    <div class="action-buttons safe-area-bottom">
      <van-button
        type="primary"
        block
        round
        class="btn-edit"
        @click="onEdit"
      >
        编辑
      </van-button>
      <van-button
        type="danger"
        block
        round
        class="btn-delete"
        @click="onDelete"
      >
        删除
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const policy = ref({
  name: '车险A',
  company: '平安保险',
  member: '爸爸',
  premium: 1200,
  amount: 50,
  paymentCycle: '年缴',
  coverage: '车辆损失险、第三者责任险、盗抢险',
  deductible: '500 元',
  waitingPeriod: '30 天',
  renewalDate: '2024-12-31'
})

const attachments = ref([
  { id: 1, type: 'pdf', name: '保单合同.pdf', url: '#' },
  { id: 2, type: 'image', name: '保单截图1.png', url: '#' }
])

function onBack() {
  history.back()
}

function onEdit() {
  alert('编辑保单功能')
}

function onDelete() {
  alert('删除保单功能')
}

function onOpenAttachment() {
  alert('打开附件列表/预览')
}
</script>

<style scoped>
.policy-detail {
  padding: 50px 12px 90px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.section {
  margin-top: 16px;
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: #fff;
  box-shadow: 0 -1px 6px rgb(0 0 0 / 0.1);
  display: flex;
  gap: 12px;
}

.btn-edit {
  flex: 1;
}

.btn-delete {
  flex: 1;
}
</style>
