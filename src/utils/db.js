import { openDB } from 'idb'


const dbPromise = openDB('insurance-db', 4, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains('images')) {
      db.createObjectStore('images', { keyPath: 'id', autoIncrement: true })
    }
    if (!db.objectStoreNames.contains('members')) {
      db.createObjectStore('members', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('policies')) {
      db.createObjectStore('policies', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' })
    }
  }
})

export const db = {

  // images 表
  async addImage(data) {
    return (await dbPromise).add('images', data)
  },
  async getAllImages() {
    return (await dbPromise).getAll('images')
  },
  async clearImages() {
    return (await dbPromise).clear('images')
  },

  // members 表
  async addMember(member) {
    return (await dbPromise).add('members', member)
  },
  async getAllMembers() {
    return (await dbPromise).getAll('members')
  },
  async updateMember(member) {
    return (await dbPromise).put('members', member)
  },
  async deleteMember(id) {
    return (await dbPromise).delete('members', id)
  },
  async clearMembers() {
    return (await dbPromise).clear('members')
  },

  // policies 表
  async addPolicy(policy) {
    if (!('id' in policy)) {
      policy.id = Date.now()
    }
    return (await dbPromise).add('policies', policy)
  },
  async getAllPolicies() {
    return (await dbPromise).getAll('policies')
  },
  async updatePolicy(policy) {
    return (await dbPromise).put('policies', policy)
  },
  async deletePolicy(id) {
    return (await dbPromise).delete('policies', id)
  },
  async clearPolicies() {
    return (await dbPromise).clear('policies')
  },

  // settings 表
  async setSetting(key, value) {
    return (await dbPromise).put('settings', { key, value })
  },
  async getSetting(key) {
    return (await dbPromise).get('settings', key)
  },
  async getAllSettings() {
    return (await dbPromise).getAll('settings')
  },
  async deleteSetting(key) {
    return (await dbPromise).delete('settings', key)
  },
  async clearSettings() {
    return (await dbPromise).clear('settings')
  },
}
