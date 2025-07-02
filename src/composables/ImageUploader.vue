<template>
  <van-uploader :after-read="onUpload" />
</template>

<script setup>
import { useImageStore } from '@/stores/imageStore'
import { db } from '@/utils/db'

const store = useImageStore()

const onUpload = async (file) => {
  const base64 = await toBase64(file.file)
  const data = { name: file.file.name, base64 }
  const id = await db.addImage(data)
  store.addImage({ id, ...data })
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
