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
    },

    /**
     * 检查是否存在相同被保人和保险类型的保单
     * @param {string} policyHolder 被保人姓名
     * @param {string} policyType 保险类型（名称）
     * @returns {boolean}
     */
    checkSamePolicy(insured, policyType) {
      return this.policies.some(p => p.insured === insured && p.policyType === policyType)
    }
  }
})
