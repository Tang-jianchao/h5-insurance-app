
import { defineStore } from 'pinia'
import { db } from '@/utils/db'

export const useImageStore = defineStore('image', {
  state: () => ({
    images: [] // { id, name, base64 }
  }),
  actions: {
    async fetchImages() {
      this.images = await db.getAllImages()
    },
    setImages(list) {
      this.images = list
    },
    async addImage(item) {
      await db.addImage(item)
      await this.fetchImages()
    },
    async updateImage(item) {
      await db.updateImage(item)
      await this.fetchImages()
    },
    async deleteImage(id) {
      await db.deleteImage(id)
      await this.fetchImages()
    }
  }
})
