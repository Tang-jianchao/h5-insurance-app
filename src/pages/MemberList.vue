<template>
  <div class="member-list">
    <van-nav-bar title="家庭成员管理" fixed safe-area-inset-top />

    <div class="card-list">
      <template v-if="members.length > 0">
        <van-card v-for="member in members" :key="member.id" :title="member.name"
          :desc="`${member.relation} / ${member.gender} / ${member.birth}`" class="member-card styled-card">
          <template #tags>
            <van-tag plain round type="primary" @click="viewPolicies(member.id)">
              保单：{{ member.policyCount }}
            </van-tag>
          </template>
          <template #num>
            <van-icon name="edit" @click="editMember(member)" class="icon-btn" />
            <van-icon name="delete" @click="deleteMember(member.id)" class="icon-btn delete" />
          </template>
        </van-card>
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
          <MyDatePicker
            v-model="form.birth"
            label="出生日期"
            :required="true"
            :min-date="minDate"
            :max-date="maxDate"
            :columns-type="['year', 'month', 'day']"
          />
          <van-field v-model="form.relation" is-link readonly name="relationPicker" label="关系" placeholder="请选择关系" @click="showRelationPicker = true" required />
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


    <!-- 出生日期选择（已用DatePicker替换） -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { GENDER_OPTIONS, RELATION_OPTIONS } from '@/utils/constant'
import { db } from '@/utils/db'
import MyDatePicker from '@/components/MyDatePicker.vue'
const columnsType = ['year', 'month', 'day'];
const datePickerValue = ref([])

const members = ref([])
const genderPickerValue = ref([])
const relationPickerValue = ref([])

const showAdd = ref(false)
const showGender = ref(false)
const showDate = ref(false)
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
  alert(`跳转查看成员 ${memberId} 名下保单`)
  // router.push(`/policies?memberId=${memberId}`)
}

function showAddMember() {
  editingId.value = null
  form.value = resetForm()
  datePickerValue.value = []
  console.log('打开弹窗')
  showAdd.value = true
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
      const updated = { ...form.value, id: editingId.value, policyCount: members.value[index].policyCount }
      await db.updateMember(updated)
      members.value[index] = updated
    }
  } else {
    // 新增
    const newMember = {
      ...form.value,
      id: Date.now(),
      policyCount: 0
    }
    await db.addMember(newMember)
    members.value.push(newMember)
  }

  showAdd.value = false
  form.value = resetForm()
  editingId.value = null
  showToast('保存成功')
}

async function deleteMember(id) {
  showConfirmDialog({
    title: '确认删除',
    message: '删除后无法恢复，是否继续？'
  }).then(async () => {
    await db.deleteMember(id)
    members.value = members.value.filter((m) => m.id !== id)
    showToast('已删除')
  })
}

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

// 页面加载时从db获取成员列表
onMounted(async () => {
  members.value = await db.getAllMembers()
})
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
</style>
