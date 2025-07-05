import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    reminderDays: {
      waiting: 3,
      expiry: 7
    }
  }),
  actions: {
    setReminderDays({ waiting, expiry }) {
      if (typeof waiting === 'number') this.reminderDays.waiting = waiting
      if (typeof expiry === 'number') this.reminderDays.expiry = expiry
    },
    getReminderDays() {
      return { ...this.reminderDays }
    },
    resetReminderDays() {
      this.reminderDays = { waiting: 3, expiry: 7 }
    }
  }
})
