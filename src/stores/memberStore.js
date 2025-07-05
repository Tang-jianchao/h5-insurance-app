import { defineStore } from 'pinia'
import { db } from '@/utils/db'

export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [] // { id, name, ... }
  }),
  actions: {
    async fetchMembers() {
      this.members = await db.getAllMembers()
    },
    async addMember(member) {
      await db.addMember(member)
      await this.fetchMembers()
    },
    async updateMember(member) {
      await db.updateMember(member)
      await this.fetchMembers()
    },
    async deleteMember(id) {
      await db.deleteMember(id)
      await this.fetchMembers()
    },
    setMembers(list) {
      this.members = list
    }
  }
})
