<template>
  <div class="settings-page">
    <van-nav-bar
      title="设置"
      fixed
      safe-area-inset-top
      left-arrow
      @click-left="onBack"
    />

    <!-- 数据导出模块 -->
    <van-cell-group title="📦 数据导出备份" inset>
      <van-cell title="导出为 JSON" is-link @click="exportJson" />
      <van-cell title="导出为 PDF" is-link @click="exportPdf" />
    </van-cell-group>

    <!-- 提醒设置 -->
    <van-cell-group title="🔔 提醒设置" inset>
      <van-field
        v-model.number="reminderDays.waiting"
        label="等待期提醒（天）"
        type="digit"
        placeholder="例如 3"
      />
      <van-field
        v-model.number="reminderDays.expiry"
        label="到期前提醒（天）"
        type="digit"
        placeholder="例如 7"
      />
      <van-button type="primary" round block class="mt-2" @click="saveReminderSettings">
        保存提醒设置
      </van-button>
    </van-cell-group>

    <!-- 加密保护 -->
    <!-- <van-cell-group title="🔐 数据加密保护" inset>
      <van-field
        v-model="pinCode"
        label="设置访问密码"
        type="password"
        placeholder="4~6位数字"
        maxlength="6"
        @blur="savePin"
      />
      <div class="desc">设置后，访问本页面或导出数据时需输入密码</div>
    </van-cell-group> -->

    <!-- 清除数据 -->
    <van-cell-group title="🌐 数据清除" inset>
      <van-cell
        title="清空全部数据"
        is-link
        class="danger-cell"
        @click="confirmClearData"
      />
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { useMemberStore } from '@/stores/memberStore'
import { usePolicyStore } from '@/stores/policyStore'
import { useImageStore } from '@/stores/imageStore'
import { useSettingStore } from '@/stores/settingStore'
import { storeToRefs } from 'pinia'
// import { importData } from '@/utils/importData'

// 提醒设置
import { computed } from 'vue'
const settingStore = useSettingStore()
const reminderDays = computed({
  get: () => settingStore.reminderDays,
  set: (val) => {
    settingStore.reminderDays = val
  }
})

// 加密保护
const pinCode = ref(localStorage.getItem('pinCode') || '')

// 导出 JSON
async function exportJson() {
  // 从store获取所有数据，若store未加载则先fetch
  const memberStore = useMemberStore()
  const policyStore = usePolicyStore()
  const imageStore = useImageStore()
  const { members } = storeToRefs(memberStore)
  const { policies } = storeToRefs(policyStore)
  const { images } = storeToRefs(imageStore)
  if (!members.value.length) await memberStore.fetchMembers()
  if (!policies.value.length) await policyStore.fetchPolicies()
  if (!images.value.length) await imageStore.fetchImages()
  const data = JSON.stringify({ members: members.value, policies: policies.value, images: images.value }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '保险数据备份.json'
  a.click()
  URL.revokeObjectURL(url)
  showToast('已导出 JSON')
}

// 模拟 PDF 导出
function exportPdf() {
  showToast('模拟导出 PDF（可集成 jsPDF）')
  // 实际可以用 jsPDF 实现内容渲染为 PDF 下载
}

// 保存提醒设置
function saveReminderSettings() {
  settingStore.setReminderDays({
    waiting: reminderDays.value.waiting,
    expiry: reminderDays.value.expiry
  })
  showToast('提醒设置已保存')
}

// 保存密码
function savePin() {
  if (pinCode.value && /^\d{4,6}$/.test(pinCode.value)) {
    localStorage.setItem('pinCode', pinCode.value)
    showToast('密码已设置')
  } else {
    showToast('请输入 4~6 位数字密码')
    pinCode.value = ''
  }
}

// 清空数据
function confirmClearData() {
  showConfirmDialog({
    title: '危险操作',
    message: '确定要清除所有本地数据？此操作不可恢复。'
  }).then(() => {
    localStorage.clear()
    showToast('数据已清除')
    location.reload()
  })
}

// 返回上级页面
function onBack() {
  history.back()
}
</script>

<style scoped>
.settings-page {
  padding: 50px 12px 80px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}
.danger-cell {
  color: red;
}
.mt-2 {
  margin-top: 12px;
}
.desc {
  font-size: 12px;
  color: #888;
  padding: 0 16px 12px;
}
</style>
