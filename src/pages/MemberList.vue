<template>
  <div class="member-list">
    <van-nav-bar title="家庭成员管理" fixed safe-area-inset-top />

    <div class="card-list">
      <template v-if="members.length > 0">
        <van-swipe-cell v-for="member in members" :key="member.id" class="modern-card">
          <template #left>
            <van-button square type="primary" icon="edit" class="swipe-btn edit-btn" @click.stop="editMember(member)" />
          </template>
          <template #right>
            <van-button square type="danger" icon="delete" class="swipe-btn delete-btn"
              @click.stop="onDeleteMember(member)" />
          </template>
          <div class="card-content" @click="editMember(member)">
            <div class="card-header">
              <div class="card-title">{{ member.name }}</div>
              <van-tag plain round type="primary" @click.stop="viewPolicies(member.id)">
                保单：{{ member.policyCount }}
              </van-tag>
            </div>
            <div class="card-desc">{{ member.relation }} / {{ member.gender }} / {{ member.birth }}</div>
          </div>
        </van-swipe-cell>
      </template>
      <template v-else>
        <van-empty description="暂无成员" />
      </template>
    </div>

    <van-button icon="plus" type="primary" round class="add-btn-float" @click="showAddMember" />

    <!-- 添加/编辑成员弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" round closeable>
      <div class="form-popup">
        <van-form @submit="onSubmit">
          <van-field v-model="form.name" label="姓名" placeholder="请输入姓名" required />
          <van-field v-model="form.gender" is-link readonly name="picker" label="性别" placeholder="请选择性别"
            @click="showGenderPicker = true" />
          <van-popup v-model:show="showGenderPicker" destroy-on-close position="bottom">
            <van-picker :columns="genderOptions" :model-value="genderPickerValue" @confirm="onSelectGender"
              @cancel="showGenderPicker = false" />
          </van-popup>
          <MyDatePicker v-model="form.birth" label="出生日期" :required="true" :min-date="minDate" :max-date="maxDate"
            :columns-type="['year', 'month', 'day']" />
          <van-field v-model="form.relation" is-link readonly name="relationPicker" label="关系" placeholder="请选择关系"
            @click="showRelationPicker = true" required />
          <van-popup v-model:show="showRelationPicker" destroy-on-close position="bottom">
            <van-picker :columns="relationOptions" :model-value="relationPickerValue" @confirm="onSelectRelation"
              @cancel="showRelationPicker = false" />
          </van-popup>

          <van-button type="primary" round block native-type="submit" class="form-submit">
            {{ form.id ? '保存修改' : '添加成员' }}
          </van-button>
        </van-form>
      </div>
    </van-popup>

    <!-- 性别选择 -->
    <van-popup v-model:show="showGenderPicker" position="bottom">
      <van-picker :columns="genderOptions" @confirm="onSelectGender" @cancel="showGenderPicker = false" />
    </van-popup>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { GENDER_OPTIONS, RELATION_OPTIONS } from '@/utils/constant'
import { db } from '@/utils/db'
import { useRouter } from 'vue-router'

import MyDatePicker from '@/components/MyDatePicker.vue'
const datePickerValue = ref([])
const router = useRouter()

const members = ref([])
const policies = ref([])
const genderPickerValue = ref([])
const relationPickerValue = ref([])

const showAdd = ref(false)
const editingId = ref(null)
const showGenderPicker = ref(false)
const showRelationPicker = ref(false)

const genderOptions = GENDER_OPTIONS.map(opt => ({ text: opt.label, value: opt.code }))
const relationOptions = RELATION_OPTIONS.map(opt => ({ text: opt.label, value: opt.code }))

const form = ref(resetForm())

function resetForm() {
  return {
    id: null,
    name: '',
    gender: '',
    birth: '',
    relation: ''
  }
}

function viewPolicies(memberId) {
  //跳转到保单页面 并设置merberId为当前成员
  router.push(`/policy-list?memberId=${memberId}`)
}

function showAddMember() {
  editingId.value = null
  form.value = resetForm()
  datePickerValue.value = []
  console.log('打开弹窗')
  showAdd.value = true
}

async function onDeleteMember(member) {
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除成员「${member.name}」吗？删除后无法恢复。`
  }).then(async () => {
    await db.deleteMember(member.id)
    members.value = members.value.filter((m) => m.id !== member.id)
    showToast('已删除')
  })
}

function onCardClick(member) {
  // 可扩展为成员详情弹窗或页面
  showToast(`成员：${member.name}`)
}

function editMember(member) {
  editingId.value = member.id
  form.value = { ...member }
  // 进入编辑时同步 datePickerValue
  if (member.birth && typeof member.birth === 'string') {
    datePickerValue.value = member.birth.split('-')
  } else {
    datePickerValue.value = []
  }
  showAdd.value = true
}

async function onSubmit() {
  if (!form.value.name || !form.value.gender || !form.value.birth || !form.value.relation) {
    showToast('请填写完整信息')
    return
  }

  if (editingId.value) {
    // 编辑
    const index = members.value.findIndex((m) => m.id === editingId.value)
    if (index !== -1) {
      const updated = { ...form.value, id: editingId.value }
      await db.updateMember(updated)
      // 重新统计保单数量
      const count = policies.value.filter(p => p.insured === updated.name).length
      members.value[index] = { ...updated, policyCount: count }
    }
  } else {
    // 新增
    const newMember = {
      ...form.value,
      id: Date.now()
    }
    await db.addMember(newMember)
    // 重新统计保单数量
    const count = policies.value.filter(p => p.insured === newMember.name).length
    members.value.push({ ...newMember, policyCount: count })
  }

  showAdd.value = false
  form.value = resetForm()
  editingId.value = null
  showToast('保存成功')
}

// 页面加载时从db获取成员和保单列表，并统计每个成员的保单数量
onMounted(async () => {
  const [allMembers, allPolicies] = await Promise.all([
    db.getAllMembers(),
    db.getAllPolicies()
  ])
  policies.value = allPolicies
  // 统计每个成员的保单数量（被保人名字匹配）
  members.value = allMembers.map(member => {
    const count = allPolicies.filter(p => p.insured === member.name).length
    return { ...member, policyCount: count }
  })
})

function onSelectGender({ selectedValues, selectedOptions }) {
  genderPickerValue.value = selectedValues
  form.value.gender = selectedOptions[0]?.text
  showGenderPicker.value = false
}

function onSelectRelation({ selectedValues, selectedOptions }) {
  relationPickerValue.value = selectedValues
  form.value.relation = selectedOptions[0]?.text
  showRelationPicker.value = false
}


// DatePicker相关逻辑
const minDate = new Date(1960, 1, 1)
const maxDate = new Date()

function getGenderLabel(code) {
  const opt = genderOptions.find(opt => opt.value === code)
  return opt ? opt.text : ''
}
</script>

<style scoped>
.member-list {
  padding: 50px 12px 80px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.card-list {
  margin-top: 12px;
  background: #f7f8fa;
  border-radius: 14px;
  padding: 8px 0 4px 0;
}

.styled-card {
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(25, 137, 250, 0.10), 0 1.5px 6px 0 rgba(0, 0, 0, 0.06);
  border: 1.5px solid #e3eaf5;
  background: #fff;
  transition: box-shadow 0.2s, background 0.2s;
}

.styled-card:nth-child(odd) {
  background: #f4f8ff;
}

.styled-card:hover {
  box-shadow: 0 8px 24px 0 rgba(25, 137, 250, 0.18), 0 2px 8px 0 rgba(0, 0, 0, 0.10);
  background: #e6f0ff;
}

.icon-btn {
  font-size: 18px;
  margin-left: 12px;
  color: #1989fa;
  cursor: pointer;
}

.icon-btn.delete {
  color: #ee0a24;
}

.add-btn-float {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  box-shadow: 0 3px 8px rgba(25, 137, 250, 0.18);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.form-popup {
  padding: 16px;
}

.form-submit {
  margin-top: 20px;
}
.modern-card {
  margin-bottom: 14px;
  border-radius: 14px;
  box-shadow: 0 4px 16px 0 rgba(25,137,250,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.06);
  background: #fff;
  overflow: hidden;
  transition: box-shadow 0.2s, background 0.2s;
}
.modern-card .card-content {
  padding: 18px 20px 14px 20px;
  cursor: pointer;
}
.modern-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.modern-card .card-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
}
.modern-card .card-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.swipe-btn {
  height: 100%;
  border-radius: 0;
  font-size: 18px;
}
.edit-btn {
  background: #1989fa;
  color: #fff;
  border: none;
}
.delete-btn {
  background: #ee0a24;
  color: #fff;
  border: none;
}
</style>
