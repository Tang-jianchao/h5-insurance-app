import { defineStore } from 'pinia'
import { db } from '@/utils/db'

export const usePolicyStore = defineStore('policy', {
  state: () => ({
    policies: [] // { id, name, ... }
  }),
  actions: {
    async fetchPolicies() {
      this.policies = await db.getAllPolicies()
    },
    async addPolicy(policy) {
      await db.addPolicy(policy)
      await this.fetchPolicies()
    },
    async updatePolicy(policy) {
      await db.updatePolicy(policy)
      await this.fetchPolicies()
    },
    async deletePolicy(id) {
      await db.deletePolicy(id)
      await this.fetchPolicies()
    },
    setPolicies(list) {
      this.policies = list
    }
  }
})
