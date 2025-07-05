<template>
  <div :id="chartId" class="base-bar-chart" />
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  chartConfig: {
    type: Object,
    default: () => ({})
  },
  chartId: {
    type: String,
    default: () => `bar-chart-${Math.random().toString(36).slice(2)}`
  }
})

let chartInstance = null

const renderChart = () => {
  if (!props.data || !props.chartConfig) return
  const dom = document.getElementById(props.chartId)
  if (!dom) return
  if (!chartInstance) {
    chartInstance = echarts.init(dom)
  }
  const option = {
    ...props.chartConfig,
    series: (props.chartConfig.series || []).map((s, idx) => ({
      ...s,
      data: props.data[idx] || s.data || []
    }))
  }
  chartInstance.setOption(option)
}

onMounted(() => {
  setTimeout(renderChart, 0)
})

watch(() => [props.data, props.chartConfig], () => {
  renderChart()
}, { deep: true })

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.base-bar-chart {
  width: 100%;
  height: 180px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgb(0 0 0 / 0.1);
}
</style>
