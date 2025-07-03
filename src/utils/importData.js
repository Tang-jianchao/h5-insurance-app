import { db } from './db'
import { showToast } from 'vant'

/**
 * 通用JSON数据导入工具
 * @param {File|Object} fileOrContent - File对象或字符串/对象
 * @returns {Promise<void>}
 */
export async function importData(fileOrContent) {
  let json
  if (typeof window !== 'undefined' && fileOrContent instanceof File) {
    // 文件对象
    json = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result))
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = reject
      reader.readAsText(fileOrContent)
    })
  } else if (typeof fileOrContent === 'string') {
    json = JSON.parse(fileOrContent)
  } else if (typeof fileOrContent === 'object') {
    json = fileOrContent
  } else {
    showToast('导入失败：不支持的类型')
    return
  }
  try {
    if (Array.isArray(json.members)) {
      await db.clearMembers()
      for (const m of json.members) {
        await db.addMember(m)
      }
    }
    if (Array.isArray(json.policies)) {
      await db.clearPolicies()
      for (const p of json.policies) {
        await db.addPolicy(p)
      }
    }
    if (Array.isArray(json.images)) {
      await db.clearImages()
      for (const img of json.images) {
        await db.addImage(img)
      }
    }
    showToast('数据导入成功')
    setTimeout(() => {
      window.location.reload()
    }, 600)
  } catch (e) {
    showToast('导入失败：文件格式错误')
  }
}
