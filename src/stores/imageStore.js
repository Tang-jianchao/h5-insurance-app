import { defineStore } from 'pinia'

export const useImageStore = defineStore('image', {
  state: () => ({
    images: [] // { id, name, base64 }
  }),
  actions: {
    setImages(list) {
      this.images = list
    },
    addImage(item) {
      this.images.unshift(item)
    }
  }
})
