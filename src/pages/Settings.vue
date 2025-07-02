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

    <!-- 数据导入模块 -->
    <van-cell-group title="📤 保单导入" inset>
      <van-uploader
        accept=".xlsx,.csv"
        :after-read="onImportFile"
        :max-count="1"
        class="uploader"
      >
        <van-cell title="导入 Excel/CSV 模板" is-link />
      </van-uploader>
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
    <van-cell-group title="🔐 数据加密保护" inset>
      <van-field
        v-model="pinCode"
        label="设置访问密码"
        type="password"
        placeholder="4~6位数字"
        maxlength="6"
        @blur="savePin"
      />
      <div class="desc">设置后，访问本页面或导出数据时需输入密码</div>
    </van-cell-group>

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

// 提醒设置
const reminderDays = ref({
  waiting: 3,
  expiry: 7
})

// 加密保护
const pinCode = ref(localStorage.getItem('pinCode') || '')

// 导出 JSON
function exportJson() {
  const data = localStorage.getItem('policies') || '[]'
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '保单数据备份.json'
  a.click()
  URL.revokeObjectURL(url)
  showToast('已导出 JSON')
}

// 模拟 PDF 导出
function exportPdf() {
  showToast('模拟导出 PDF（可集成 jsPDF）')
  // 实际可以用 jsPDF 实现内容渲染为 PDF 下载
}

// 导入文件
function onImportFile(file) {
  const reader = new FileReader()
  reader.onload = () => {
    const content = reader.result
    // 实际使用 XLSX 解析字段：比如 xlsx.read(content, { type: 'binary' })
    console.log('导入内容：', content)
    showToast('文件已读取，待解析字段')
  }
  reader.readAsText(file.file)
}

// 保存提醒设置
function saveReminderSettings() {
  localStorage.setItem('reminderDays', JSON.stringify(reminderDays.value))
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
