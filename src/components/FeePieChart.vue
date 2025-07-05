<template>
  <div class="fee-pie-chart chart-bg">
    <div :id="chartId" class="chart"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  height: {
    type: [String, Number],
    default: 180
  }
})

const chartId = `fee-pie-chart-${Math.random().toString(36).slice(2)}`
let chartInstance = null

const renderChart = () => {
  if (!props.data || !Array.isArray(props.data)) return
  if (!chartInstance) {
    chartInstance = echarts.init(document.getElementById(chartId))
  }
  chartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `${params.percent}%`;
      }
    },
    legend: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 12 },
      padding: [20, 0, 0, 0] // 上右下左，向上留20px间距
    },
    series: [
      {
        name: '保费',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'], // 向上移，给legend留空间
        data: props.data,
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 12
        },
        labelLine: {
          length: 10,
          length2: 8
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  })
  chartInstance.resize()
}

onMounted(() => {
  renderChart()
})

watch(() => props.data, () => {
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
.fee-pie-chart {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgb(0 0 0 / 0.1);
  padding: 0;
}
.fee-pie-chart .chart {
  width: 100%;
  height: 180px;
  min-height: 120px;
}
</style>
