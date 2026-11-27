<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Chart from 'chart.js/auto'

// Höjdprofilen för en tur: höjd över havet för varje mätpunkt, i den ordning de spelades in.
const props = defineProps<{ labels: string[]; elevations: (number | null)[] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => {
  if (!canvas.value) return
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Höjd (m)',
          data: props.elevations,
          borderColor: '#2f855a',
          backgroundColor: 'rgba(47, 133, 90, 0.15)',
          fill: true,
          pointRadius: 0,
          tension: 0.3,
          spanGaps: true,
        },
      ],
    },
    options: { animation: false, plugins: { legend: { display: false } } },
  })
})

onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <canvas ref="canvas" aria-label="Höjdprofil för turen" role="img"></canvas>
</template>
