<template>
  <div class="ocr-camera-input">
    <div class="icon-wrapper" @click="onClick">
      <van-icon name="photograph" size="40" color="#1989fa" />
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      style="display: none"
      @change="onFileChange"
    />
    <div v-if="loading" class="ocr-loading">识别中...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'

const fileInput = ref(null)
const loading = ref(false)
const resultText = ref('')

function onClick() {
  showToast('请上传或拍摄图片进行识别')
  fileInput.value && fileInput.value.click()
}

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  loading.value = true
  resultText.value = ''
  try {
    // 使用腾讯云/百度/阿里等第三方OCR API，或本地Tesseract.js
    // 这里只做本地Tesseract.js演示
    const Tesseract = await import('tesseract.js')
    const { data } = await Tesseract.recognize(file, 'chi_sim+eng', {
      logger: m => console.log(m)
    })
    const text = data.text.trim()
    resultText.value = ''
    if (text) {
      // 直接打印识别结果
      // eslint-disable-next-line no-console
      console.log('OCR识别结果:', text)
    }
  } catch (err) {
    showToast('识别失败，请重试')
    resultText.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ocr-camera-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
}
.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f0f6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25,137,250,0.08);
}
.ocr-loading {
  color: #888;
  margin-top: 8px;
}
.ocr-result {
  margin-top: 8px;
  color: #333;
  font-size: 15px;
  word-break: break-all;
  background: #f7f8fa;
  padding: 8px 12px;
  border-radius: 8px;
}
</style>
