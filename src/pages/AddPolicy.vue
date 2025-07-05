<template>
  <div class="add-policy">
    <van-nav-bar
      title="添加新保单"
      fixed
      safe-area-inset-top
      left-arrow
      @click-left="onBack"
    />

    <van-form
      @submit="onSubmit"
      ref="formRef"
      :validate-first="false"
      class="form"
      :readonly="readonly"
    >
      <van-cell-group>
        <!-- 投保人 -->
        <van-field
          v-model="form.policyHolder"
          name="policyHolder"
          label="投保人"
          is-link
          :readonly="readonly"
          placeholder="请选择投保人"
          @click="!readonly && (showPolicyHolderPicker = true)"
          required
          :rules="[{ required: true, message: '请选择投保人' }]"
        />
        <van-popup v-model:show="showPolicyHolderPicker" position="bottom">
          <van-picker
            :columns="memberOptions"
            @confirm="onSelectPolicyHolder"
            @cancel="showPolicyHolderPicker = false"
          />
        </van-popup>
        <!-- 被保人 -->
        <van-field
          v-model="form.insured"
          name="insured"
          label="被保人"
          is-link
          :readonly="readonly"
          placeholder="请选择被保人"
          @click="!readonly && (showInsuredPicker = true)"
          required
          :rules="[{ required: true, message: '请选择被保人' }]"
        />
        <van-popup v-model:show="showInsuredPicker" position="bottom">
          <van-picker
            :columns="memberOptions"
            @confirm="onSelectInsured"
            @cancel="showInsuredPicker = false"
          />
        </van-popup>
        <!-- 保单名称 -->
        <van-field
          v-model="form.name"
          name="name"
          label="保险名称"
          :readonly="readonly"
          placeholder="请输入保险名称"
          required
          :rules="[{ required: true, message: '请输入保险名称' }]"
        />
        <!-- 保险公司 -->
        <van-field
          v-model="form.company"
          name="company"
          label="保险公司"
          :readonly="readonly"
          placeholder="请输入保险公司"
          required
          :rules="[{ required: true, message: '请输入保险公司' }]"
        />
        <!-- 险种 -->
        <van-field
          v-model="form.policyType"
          name="policyType"
          label="险种"
          is-link
          :readonly="readonly"
          placeholder="请选择险种"
          @click="!readonly && (showTypePicker = true)"
          required
          :rules="[{ required: true, message: '请选择险种' }]"
        />
        <van-popup v-model:show="showTypePicker" position="bottom">
          <van-picker
            :columns="policyTypeOptions"
            @confirm="onSelectPolicyType"
            @cancel="showTypePicker = false"
          />
        </van-popup>
        <!-- 保额 -->
        <van-field
          v-model.number="form.amount"
          name="amount"
          label="保额 (万元)"
          type="number"
          :readonly="readonly"
          placeholder="请输入保额"
          required
          :rules="[{ required: true, message: '请输入保额' }]"
        />
        <!-- 保费 -->
        <van-field
          v-model.number="form.premium"
          name="premium"
          label="保费 (元)"
          type="number"
          :readonly="readonly"
          placeholder="请输入保费"
          required
          :rules="[{ required: true, message: '请输入保费' }]"
        />
        <!-- 保障开始日期 -->
        <MyDatePicker
          v-model="form.coverageStart"
          label="保障开始日期"
          :required="true"
          placeholder="请选择开始日期"
          :min-date="new Date(2000, 0, 1)"
          :max-date="new Date(2100, 11, 31)"
          :readonly="readonly"
        />
        <!-- 保障结束日期 -->
        <MyDatePicker
          v-model="form.coverageEnd"
          label="保障结束日期"
          :required="true"
          placeholder="请选择结束日期"
          :min-date="new Date(2000, 0, 1)"
          :max-date="new Date(2100, 11, 31)"
          :readonly="readonly"
        />
        <van-field
          :model-value="getStatusLabel(form.status)"
          name="status"
          label="保单状态"
          readonly
          placeholder=""
          input-align="left"
        />
        <!-- 保证续保 -->
        <van-field label="保证续保" required>
          <template #input>
            <van-radio-group v-model="form.renewable" direction="horizontal" :disabled="readonly">
              <van-radio :name="true">是</van-radio>
              <van-radio :name="false">否</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>
      <!-- <div class="upload-section">
        <div class="upload-label">电子保单附件</div>
        <van-uploader
          :after-read="onAttachmentUpload"
          :max-count="1"
          accept="application/pdf,image/*"
          show-upload
          :file-list="attachmentList"
          :disabled="readonly"
        />
      </div>
      <div class="upload-section">
        <div class="upload-label">健康告知截图</div>
        <van-uploader
          :after-read="onHealthUpload"
          :max-count="1"
          accept="image/*"
          show-upload
          :file-list="healthList"
          :disabled="readonly"
        />
      </div> -->
      <van-button v-if="!readonly" round block type="primary" native-type="submit" class="submit-btn"
        >保存保单</van-button
      >
    </van-form>
    <!-- 只读模式下底部操作栏 -->
    <div v-if="readonly" class="sticky-footer">
      <div class="sticky-btn-row">
        <van-button type="primary" block @click="onEdit" class="sticky-btn">编辑</van-button>
        <van-button type="danger" block @click="onDelete" class="sticky-btn">删除</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { showToast } from 'vant'
import MyDatePicker from '@/components/MyDatePicker.vue'
import { onMounted } from 'vue'
import { usePolicyStore } from '@/stores/policyStore'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { POLICY_TYPES, POLICY_STATUS_OPTIONS } from '@/utils/constant'

const formRef = ref(null)

// 保单状态映射
function getStatusLabel(code) {
  const opt = POLICY_STATUS_OPTIONS.find(opt => String(opt.code) === String(code))
  return opt ? opt.label : ''
}

const showTypePicker = ref(false)
const policyTypeOptions = POLICY_TYPES.map(opt => ({ text: opt.label, value: opt.code }))

const demoData = {
  name: '车险A',
  company: '平安保险',
  policyHolder: 'Jason',
  insuredMemberId: 1751463211963,
  insured: 'Jason',
  policyType: '车险',
  amount: 50,
  premium: 1200,
  coverageStart: '2024-01-01',
  coverageEnd: '2025-01-01',
  renewable: true,
  attachmentBase64: '',
  healthBase64: ''
}
const form = reactive({
  ...demoData,
  status: '' // 保单状态字段，存储code
})
import { watch } from 'vue'
// 计算保单状态（返回code）
function calcPolicyStatus(start, end) {
  if (!start || !end) return ''
  const now = new Date()
  const s = new Date(start)
  const e = new Date(end)
  if (now < s) return 2 // 待生效
  if (now > e) return 3 // 已过期
  return 1 // 生效中
}

// 监听保障日期变化，自动推算保单状态（存code）
watch(
  () => [form.coverageStart, form.coverageEnd],
  ([start, end]) => {
    form.status = calcPolicyStatus(start, end)
  },
  { immediate: true }
)


const route = useRoute()
const router = useRouter()
const policyStore = usePolicyStore()
const readonly = ref(false)

const showPolicyHolderPicker = ref(false)
const showInsuredPicker = ref(false)
const memberOptions = ref([])
onMounted(async () => {
  // 从db获取家庭成员
  const members = await import('@/stores/memberStore').then(m => m.useMemberStore().members)
  memberOptions.value = members.map(m => ({ text: m.name, value: m.name, id: m.id }))

  if (route.query && Object.keys(route.query).length > 0) {
    readonly.value = !!route.query.readonly
    Object.keys(form).forEach(key => {
      if (route.query[key] !== undefined) {
        if (key === 'renewable') {
          form[key] = route.query[key] === 'true' || route.query[key] === true
        } else {
          form[key] = route.query[key]
        }
      }
    })
    // 兼容 coveragePeriod 字符串（优先使用 coverageStart/coverageEnd）
    if (!form.coverageStart && route.query.coveragePeriod) {
      const arr = String(route.query.coveragePeriod).split(' 至 ')
      form.coverageStart = arr[0] || ''
      form.coverageEnd = arr[1] || ''
    }
    if (route.query.id) form.id = Number(route.query.id)
  }
})

function onSelectPolicyHolder({ selectedValues, selectedOptions }) {
  form.policyHolder = selectedOptions[0]?.text
  showPolicyHolderPicker.value = false
}
function onSelectInsured({ selectedValues, selectedOptions }) {
  form.insured = selectedOptions[0]?.text
  // 保存被保人的 memberId
  form.insuredMemberId = selectedOptions[0]?.id
  showInsuredPicker.value = false
}

const attachmentList = ref([])
const healthList = ref([])

function onAttachmentUpload(file) {
  fileToBase64(file.file).then((base64) => {
    form.attachmentBase64 = base64
  })
  attachmentList.value = [file]
}

function onHealthUpload(file) {
  fileToBase64(file.file).then((base64) => {
    form.healthBase64 = base64
  })
  healthList.value = [file]
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function onSelectPolicyType({ selectedValues, selectedOptions }) {
  form.policyType = selectedOptions[0]?.text
  showTypePicker.value = false
}

function onSubmit() {
  formRef.value
    .validate()
    .then(async () => {
      if (!form.coverageStart || !form.coverageEnd) {
        showToast('请选择保障起止日期')
        return
      }
      if (form.renewable === null) {
        showToast('请选择是否保证续保')
        return
      }
      // store存储，保留原始 coverageStart/coverageEnd
      const policyData = {
        id: form.id || Date.now(),
        name: form.name,
        company: form.company,
        amount: form.amount,
        premium: form.premium,
        coverageStart: form.coverageStart,
        coverageEnd: form.coverageEnd,
        coveragePeriod: `${form.coverageStart} 至 ${form.coverageEnd}`,
        policyHolder: form.policyHolder,
        insured: form.insured,
        insuredMemberId: form.insuredMemberId || null,
        policyType: form.policyType,
        renewable: form.renewable,
        status: form.status, // 存储code
        attachmentBase64: form.attachmentBase64,
        healthBase64: form.healthBase64
      }
      if (form.id) {
        await policyStore.updatePolicy(policyData)
      } else {
        await policyStore.addPolicy(policyData)
      }
      showToast('保单保存成功')
      onBack()
    })
    .catch(() => {
      showToast('请完善表单信息')
    })
}

function onBack() {
  history.back()
}
function onEdit() {
  readonly.value = false
}
function onDelete() {
  const id = Number(form.id || route.query.id)
  if (!id) {
    showToast('缺少保单ID，无法删除')
    return
  }
  policyStore.deletePolicy(id).then(() => {
    showToast('保单已删除')
    setTimeout(() => {
      router.replace('/policy-list')
    }, 600)
  })
}
</script>

<style scoped>
.add-policy {
  padding: 50px 12px 80px;
  background: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}
.form {
  margin-top: 16px;
}
.van-cell-group--inset {
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(25,137,250,0.08);
  background: #fff;
  margin-bottom: 0;
  padding: 0 2px;
}
.van-field {
  border-radius: 8px;
  margin-bottom: 2px;
}
.upload-section {
  margin: 16px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(25,137,250,0.06);
  padding: 12px 16px 8px 16px;
}
.upload-label {
  font-weight: 600;
  margin-bottom: 8px;
}
.checkbox-group {
  margin: 12px 0 0 8px;
}
.submit-btn {
  margin-top: 24px;
  font-size: 16px;
  height: 48px;
}
.sticky-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
.sticky-btn-row {
  display: flex;
  width: 100%;
}
.sticky-btn {
  flex: 1 1 0%;
  border-radius: 0;
  margin: 0;
  height: 48px;
  font-size: 16px;
}
</style>
