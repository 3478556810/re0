<template>
  <div class="force-graph" ref="container">
    <svg ref="svg" :width="width" :height="height"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  agents: { type: Array, default: () => [] },
})
const emit = defineEmits(['preview'])
const container = ref(null)
const svg = ref(null)
const width = ref(800)
const height = ref(600)

const roleColor = { writer:'#f59e0b', researcher:'#3b82f6', coder:'#8b5cf6', designer:'#ec4899', publisher:'#ef4444', promoter:'#14b8a6' }
const roleIcon = { writer:'ph:pen-nib-bold', researcher:'mdi:microscope', coder:'mdi:code-tags', designer:'mdi:palette', publisher:'mdi:bullhorn', promoter:'mdi:megaphone' }
const workflow = ['researcher','writer','designer','coder','promoter','publisher']

onMounted(() => {
  // 等 DOM 布局完成 + v-show 可见后再渲染
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const r = container.value?.getBoundingClientRect()
      if (r && r.width > 100) { width.value = r.width; height.value = r.height }
      else { width.value = container.value?.clientWidth || 700; height.value = 450 }
      if (props.agents.length) render()
    })
  })
  // 监听容器尺寸变化
  if (typeof ResizeObserver !== 'undefined' && container.value) {
    const ro = new ResizeObserver(() => {
      const r = container.value?.getBoundingClientRect()
      if (r && r.width > 100) {
        width.value = r.width; height.value = r.height
        if (props.agents.length) render()
      }
    })
    ro.observe(container.value)
  }
})
watch(() => props.agents.length, (n) => {
  if (n > 0) {
    const r = container.value?.getBoundingClientRect()
    if (r && r.width > 100) { width.value = r.width; height.value = r.height }
    else { width.value = container.value?.clientWidth || 700; height.value = 450 }
    render()
  }
})

function isBusy(a) {
  const log = a.recentLog || ''
  return /🧠|⚙️|🔬|💻|🎨|📡|📣|调研|学习|写|精读|项目|任务/.test(log) && !/失败|未完成|熔断|429/.test(log)
}
function doingText(a) {
  const log = a.recentLog || ''
  const lines = log.split('\n').filter(Boolean)
  const last = lines[lines.length-1] || ''
  if (/失败|熔断|429|未完成|限流/.test(last)) return '⚡ 充电中'
  return last.replace(/^\[[^\]]*\]\s*/,'').replace(/·[^·]*$/,'').trim() || '待命中'
}

function render() {
  const el = svg.value
  if (!el) return
  const w = width.value, h = height.value
  const svgEl = d3.select(el).attr('width',w).attr('height',h).html('')
  
  // 节点：每个 agent 一个
  const nodes = props.agents.map((a, i) => ({ ...a, id: a.name, index: i }))
  // 连线：按工作流顺序 + 同部门相邻
  const links = []
  const byRole = {}
  for (const a of nodes) {
    if (!byRole[a.role]) byRole[a.role] = []
    byRole[a.role].push(a)
  }
  // 工作流上下游
  for (let i = 0; i < workflow.length - 1; i++) {
    const from = byRole[workflow[i]] || []
    const to = byRole[workflow[i+1]] || []
    if (from.length && to.length) {
      links.push({ source: from[0].name, target: to[0].name, type: 'flow' })
    }
  }
  // 同部门相邻 agent 连线
  for (const role of Object.keys(byRole)) {
    const list = byRole[role]
    for (let i = 0; i < list.length - 1; i++) {
      links.push({ source: list[i].name, target: list[i+1].name, type: 'peer' })
    }
  }

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.name).distance(120))
    .force('charge', d3.forceManyBody().strength(-250))
    .force('center', d3.forceCenter(w/2, h/2))
    .force('collision', d3.forceCollide(35))

  const linkG = svgEl.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', d => d.type === 'flow' ? '#94a3b8' : '#e5e7eb')
    .attr('stroke-width', d => d.type === 'flow' ? 2.5 : 1)
    .attr('stroke-dasharray', d => d.type === 'flow' ? '6,3' : '')
    .attr('opacity', 0.6)

  const nodeG = svgEl.append('g').selectAll('g').data(nodes).join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
    )
    .on('mouseenter', function(e, d) {
      d3.select(this).select('circle').transition().attr('r', 28)
      tooltip.html(`<strong>${d.name}</strong><br>${doingText(d)}<br>${d.outputs||0} 产出`)
        .style('left', (e.offsetX + 15) + 'px').style('top', (e.offsetY - 10) + 'px')
        .style('opacity', 1)
    })
    .on('mouseleave', function() {
      d3.select(this).select('circle').transition().attr('r', 20)
      tooltip.style('opacity', 0)
    })
    .on('click', (e, d) => {
      if (d.files && d.files.length) emit('preview', d, d.files[0])
    })

  nodeG.append('circle')
    .attr('r', 20)
    .attr('fill', d => roleColor[d.role] || '#94a3b8')
    .attr('stroke', d => isBusy(d) ? '#22c55e' : '#fff')
    .attr('stroke-width', d => isBusy(d) ? 3 : 2)
    .style('filter', d => isBusy(d) ? 'drop-shadow(0 0 6px rgba(34,197,94,.4))' : '')

  nodeG.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#fff')
    .attr('font-size', '11px')
    .attr('font-weight', '700')
    .text(d => d.name.split('-')[0].slice(0, 2))

  nodeG.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '30')
    .attr('fill', '#334155')
    .attr('font-size', '10px')
    .text(d => d.name)

  // tooltip
  const tooltip = d3.select(container.value).append('div')
    .attr('class', 'ft-tooltip').style('position','absolute').style('opacity',0)
    .style('background','#fff').style('border','1px solid #e5e7eb').style('border-radius','10px')
    .style('padding','10px 14px').style('font-size','12px').style('color','#1e293b')
    .style('box-shadow','0 4px 16px rgba(0,0,0,.1)').style('pointer-events','none')
    .style('max-width','220px').style('z-index','1000')

  simulation.on('tick', () => {
    linkG.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
    nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
  })
}
</script>

<style scoped>
.force-graph { width: 100%; min-height: 500px; position: relative; background: #fafbfc; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
.force-graph :deep(.ft-tooltip) { pointer-events: none; }
</style>