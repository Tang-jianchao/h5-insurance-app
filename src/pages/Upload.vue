<template>
  <div>
    <h2>上传图片</h2>
    <van-uploader :after-read="onUpload" />
  </div>
</template>

<script setup>
import { useImageStore } from '@/stores/imageStore'


const store = useImageStore()

const onUpload = async (file) => {
  const base64 = await toBase64(file.file)
  const data = { name: file.file.name, base64 }
  await store.addImage(data)
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>
