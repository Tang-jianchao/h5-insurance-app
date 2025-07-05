
import { defineStore } from 'pinia'
import { db } from '@/utils/db'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    reminderDays: {
      waiting: 3,
      expiry: 7
    },
    _loaded: false
  }),
  actions: {
    async loadSetting() {
      if (this._loaded) return
      const setting = await db.getSetting('reminderDays')
      if (setting && setting.value) {
        this.reminderDays = { ...this.reminderDays, ...setting.value }
      }
      this._loaded = true
    },
    async setReminderDays({ waiting, expiry }) {
      if (typeof waiting === 'number') this.reminderDays.waiting = waiting
      if (typeof expiry === 'number') this.reminderDays.expiry = expiry
      await db.setSetting('reminderDays', { ...this.reminderDays })
    },
    getReminderDays() {
      return { ...this.reminderDays }
    },
    async resetReminderDays() {
      this.reminderDays = { waiting: 3, expiry: 7 }
      await db.setSetting('reminderDays', { ...this.reminderDays })
    }
  }
})
