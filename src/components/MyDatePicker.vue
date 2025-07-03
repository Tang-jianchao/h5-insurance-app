<template>
  <div>
    <van-field
      v-model="displayValue"
      :label="label"
      is-link
      :readonly="true"
      :placeholder="placeholder"
      @click="!readonly && (showPicker = true)"
      :required="required"
    />
    <van-popup v-model:show="showPicker" position="bottom">
      <van-date-picker
        v-model="innerValue"
        :title="title"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onConfirm"
        @cancel="showPicker = false"
        :columns-type="columnsType"
        :formatter="formatter"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: '出生日期'
  },
  title: {
    type: String,
    default: '选择日期'
  },
  placeholder: {
    type: String,
    default: '请选择日期'
  },
  minDate: {
    type: Date,
    default: () => new Date(1960, 1, 1)
  },
  maxDate: {
    type: Date,
    default: () => new Date()
  },
  columnsType: {
    type: Array,
    default: () => ['year', 'month', 'day']
  },
  required: {
    type: Boolean,
    default: false
  },
  formatter: {
    type: Function,
    default: (type, option) => {
      if (type === 'year') option.text += '年'
      if (type === 'month') option.text += '月'
      if (type === 'day') option.text += '日'
      return option
    }
  },
  readonly: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])

const showPicker = ref(false)
const innerValue = ref([])

// 初始化 innerValue
watch(
  () => props.modelValue,
  (val) => {
    if (val && typeof val === 'string') {
      innerValue.value = val.split('-')
    } else {
      innerValue.value = []
    }
  },
  { immediate: true }
)

const displayValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    // 禁止直接编辑
  }
})

function onConfirm(value) {
  let result = ''
  if (Array.isArray(value.selectedValues)) {
    result = value.selectedValues.join('-')
    innerValue.value = value.selectedValues
  } else if (Array.isArray(value)) {
    result = value.join('-')
    innerValue.value = value
  } else if (typeof value === 'string') {
    result = value
    innerValue.value = value.split('-')
  }
  emit('update:modelValue', result)
  showPicker.value = false
}
</script>
