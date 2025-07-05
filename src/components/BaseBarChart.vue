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
  // 过滤series中全为0的数据（险种）和x轴全为0的成员
  let rawSeries = (props.chartConfig.series || []).map((s, idx) => ({
    ...s,
    data: props.data[idx] || s.data || []
  }))
  // 过滤所有成员都为0的险种
  let filteredSeries = rawSeries.filter(s => s.data.some(val => val > 0))
  // 过滤所有险种都为0的成员（x轴）
  let xAxis = props.chartConfig.xAxis || {}
  let xData = xAxis.data || []
  // 计算每个成员在所有series下的总和
  let memberTotals = xData.map((_, i) => filteredSeries.reduce((sum, s) => sum + (s.data[i] || 0), 0))
  let validIndexes = memberTotals.map((total, i) => total > 0 ? i : -1).filter(i => i !== -1)
  // 新的x轴和series数据
  let newXData = validIndexes.map(i => xData[i])
  filteredSeries = filteredSeries.map(s => ({ ...s, data: validIndexes.map(i => s.data[i]) }))
  // 若无有效数据，避免渲染空坐标系导致报错
  if (filteredSeries.length === 0 || newXData.length === 0) {
    chartInstance.clear()
    return
  }
  const option = {
    ...props.chartConfig,
    xAxis: { ...xAxis, data: newXData },
    series: filteredSeries
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
