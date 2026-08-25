<template>
  <main class="bio-view">
    <header class="bio-topbar">
      <div class="bio-brand"><span class="bio-mark"><Icon icon="mdi:dna" width="20" /></span><span>RESCENE <b>BIO</b></span><em>Beta</em></div>
      <div class="bio-status"><i></i> 可视化引擎已就绪</div>
    </header>

    <section class="bio-hero">
      <div>
        <p class="eyebrow">LIFE SCIENCE VISUAL LAB</p>
        <h1>把生命科学，变成<br><span>可探索的模型。</span></h1>
        <p class="hero-copy">用自然语言构建细胞、仿生囊泡与生命过程的可视化讲解场景。</p>
      </div>
      <div class="hero-orbit" aria-hidden="true"><span class="orbit-node n1"></span><span class="orbit-node n2"></span><span class="orbit-node n3"></span><Icon icon="mdi:atom" width="76" /></div>
    </section>

    <section class="studio-shell">
      <aside class="model-library">
        <div class="side-label">模型库</div>
        <button v-for="item in presets" :key="item.id" class="preset" :class="{ active: active.id === item.id }" @click="choosePreset(item)">
          <span class="preset-icon"><Icon :icon="item.icon" width="20" /></span><span><b>{{ item.name }}</b><small>{{ item.type }}</small></span>
        </button>
        <div class="side-divider"></div>
        <p class="side-label">快速开始</p>
        <button class="new-scene" @click="prompt = ''"><Icon icon="mdi:plus" width="17" /> 新建空白场景</button>
      </aside>

      <section class="viewport-panel">
        <div class="viewport-head"><div><span>{{ active.type }} · REALTIME WEBGL</span><h2>{{ active.name }}</h2></div><div class="view-actions"><button title="重置视角" @click="resetView"><Icon icon="mdi:backup-restore" width="17" /></button><button title="全屏查看" @click="isExpanded = !isExpanded"><Icon :icon="isExpanded ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" width="17" /></button></div></div>
        <div class="viewport" :class="{ expanded: isExpanded }">
          <div ref="canvasHost" class="webgl-host"></div>
          <div class="model-tag tag-virus"><i></i> {{ active.tag }}</div><div class="model-tag tag-cell"><i></i> 真核细胞 · 3D</div>
          <div class="view-hint"><Icon icon="mdi:gesture-swipe" width="16" /> 拖动旋转 · 滚轮缩放 · 右键平移</div>
        </div>
        <div class="timeline"><button class="play" @click="playing = !playing"><Icon :icon="playing ? 'mdi:pause' : 'mdi:play'" width="18" /></button><div class="track"><span :style="{ width: (playing ? 62 : 18) + '%' }"></span><i :style="{ left: (playing ? 62 : 18) + '%' }"></i></div><span>{{ playing ? '00:12' : '00:04' }} / 00:19</span><button class="speed" @click="speed = speed === '1×' ? '2×' : '1×'">{{ speed }}</button></div>
        <input v-model.number="rotation" class="rotation" type="range" min="-55" max="55" aria-label="调整默认观察角度" />
      </section>

      <aside class="inspector">
        <div class="side-label">场景说明</div>
        <h3>{{ active.name }}</h3><p>{{ active.description }}</p>
        <div class="stage-list"><button v-for="(stage, index) in stages" :key="stage.title" :class="{ selected: stageIndex === index }" @click="stageIndex = index"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><b>{{ stage.title }}</b><small>{{ stage.detail }}</small></div><Icon v-if="stageIndex === index" icon="mdi:check-circle" width="18" /></button></div>
        <div class="accuracy"><Icon icon="mdi:information-outline" width="17" /><span>教学级可视化，不用于科研诊断或分子动力学推演。</span></div>
      </aside>
    </section>

    <section class="prompt-bar">
      <span class="prompt-icon"><Icon icon="mdi:sparkles" width="19" /></span><input v-model="prompt" @keydown.enter="createScene" placeholder="例如：突出仿生囊泡与细胞膜接触的瞬间" /><button :disabled="!prompt.trim()" @click="createScene">生成场景 <Icon icon="mdi:arrow-up" width="17" /></button>
    </section>
    <p v-if="notice" class="notice"><Icon icon="mdi:check-circle-outline" width="16" />{{ notice }}</p>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const presets = [
  { id: 'vesicle', name: '仿生囊泡进入细胞', type: '过程模型', icon: 'mdi:circle-outline', tag: 'BIO VESICLE', description: '观察一个中性仿生囊泡靠近细胞膜、发生接触并进入细胞的基础可视化过程。' },
  { id: 'cell', name: '动物细胞剖面', type: '结构模型', icon: 'mdi:circle-slice-8', tag: 'ANIMAL CELL', description: '从细胞膜、细胞核到线粒体，逐层理解真核细胞的组织结构。' },
  { id: 'immune', name: '免疫细胞识别', type: '过程模型', icon: 'mdi:shield-bug-outline', tag: 'T CELL', description: '观察免疫细胞如何识别异常信号并启动应答。' }
]
const active = ref(presets[0]); const rotation = ref(0); const playing = ref(false); const speed = ref('1×'); const isExpanded = ref(false); const prompt = ref(''); const notice = ref(''); const stageIndex = ref(0); const canvasHost = ref(null)
let renderer, scene, camera, controls, cellRoot, carrier, frame, resizeObserver, clock
const stages = computed(() => active.value.id === 'vesicle' ? [
  { title: '靠近细胞膜', detail: '囊泡在细胞外环境中移动' }, { title: '表面接触', detail: '观察膜表面的接触区域' }, { title: '内吞过程', detail: '囊泡被细胞膜包裹进入' }, { title: '细胞内运输', detail: '追踪囊泡的示意路径' }
] : [{ title: '定位结构', detail: '进入可视化视图' }, { title: '放大观察', detail: '查看关键组成' }, { title: '讲解导出', detail: '生成教学叙事' }])
function choosePreset(item) { active.value = item; stageIndex.value = 0; playing.value = false; notice.value = ''; applyPreset(item.id) }
function createScene() { notice.value = `已将「${prompt.value.trim()}」加入当前 ${active.value.name} 场景。`; playing.value = true; prompt.value = '' }
function resetView() { controls?.reset(); rotation.value = 0 }

function material(color, options = {}) { return new THREE.MeshPhysicalMaterial({ color, roughness: .42, metalness: .04, clearcoat: .18, ...options }) }
function addMitochondrion(root, position, rotationY) {
  const group = new THREE.Group(); group.position.fromArray(position); group.rotation.set(.6, rotationY, .3)
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .7, 8, 16), material('#db774b', { emissive: '#6e2719', emissiveIntensity: .25 }))
  group.add(body)
  for (let i = -2; i <= 2; i++) { const fold = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 6, 16, Math.PI * 1.35), material('#f6b46e')); fold.rotation.x = Math.PI / 2; fold.position.y = i * .15; group.add(fold) }
  root.add(group)
}
function addGolgi(root) { const group = new THREE.Group(); group.position.set(1.35,.28,.75); group.rotation.set(.4,-.7,.3); for (let i=0;i<5;i++) { const arc = new THREE.Mesh(new THREE.TorusGeometry(.38+i*.04,.035,8,30,Math.PI*1.25),material('#9a72d8',{emissive:'#372061',emissiveIntensity:.35})); arc.position.y=(i-2)*.1; group.add(arc) } root.add(group) }
function buildCell() {
  cellRoot = new THREE.Group(); scene.add(cellRoot)
  const membrane = new THREE.Mesh(new THREE.SphereGeometry(2.35, 64, 48), material('#55ceb8', { transparent:true, opacity:.20, transmission:.22, thickness:.4, side:THREE.DoubleSide }))
  membrane.scale.set(1.05,.88,.96); cellRoot.add(membrane)
  const cytoplasm = new THREE.Mesh(new THREE.SphereGeometry(2.2, 48, 36), material('#164e63', { transparent:true, opacity:.34, emissive:'#0a303a', emissiveIntensity:.6 }))
  cytoplasm.scale.set(1.05,.88,.96); cellRoot.add(cytoplasm)
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(.8, 40, 30), material('#4b9db8', { transparent:true, opacity:.82, emissive:'#103b65', emissiveIntensity:.5 }))
  nucleus.position.set(-.28,.05,.38); nucleus.scale.set(1,.86,.92); cellRoot.add(nucleus)
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 18), material('#9ce9e4',{emissive:'#56d8c8',emissiveIntensity:1.2})); nucleolus.position.set(-.5,.18,.92); cellRoot.add(nucleolus)
  addMitochondrion(cellRoot,[.85,.65,.25],.8); addMitochondrion(cellRoot,[-1.25,-.52,.6],-1.1); addMitochondrion(cellRoot,[.72,-.6,-.72],.2); addGolgi(cellRoot)
  const dots = new THREE.Group(); const dotGeo = new THREE.SphereGeometry(.035,8,8); const dotMat = material('#6be1c8',{emissive:'#23746e',emissiveIntensity:.65}); for(let i=0;i<150;i++){const r=Math.cbrt(Math.random())*1.9; const theta=Math.random()*Math.PI*2; const phi=Math.acos(2*Math.random()-1); const dot=new THREE.Mesh(dotGeo,dotMat); dot.position.set(r*Math.sin(phi)*Math.cos(theta)*1.05,r*Math.cos(phi)*.86,r*Math.sin(phi)*Math.sin(theta)*.96); dots.add(dot)} cellRoot.add(dots)
  carrier = new THREE.Group(); carrier.position.set(-4.2,.55,1.1); const shell = new THREE.Mesh(new THREE.SphereGeometry(.43,32,24),material('#e3cf81',{emissive:'#786226',emissiveIntensity:.34,clearcoat:.7})); carrier.add(shell); const core = new THREE.Mesh(new THREE.SphereGeometry(.22,24,18),material('#ee8890',{emissive:'#a42d49',emissiveIntensity:.65})); carrier.add(core); for(let i=0;i<11;i++){const pin=new THREE.Mesh(new THREE.CylinderGeometry(.022,.045,.2,8),material('#f7dd91')); pin.position.set(0,.43,0); pin.rotation.z=Math.PI/2; const holder=new THREE.Group(); holder.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI); holder.add(pin); carrier.add(holder)} scene.add(carrier)
}
function applyPreset(id) { if (!cellRoot) return; const palettes={vesicle:['#55ceb8','#e3cf81'],cell:['#5ca7da','#f1ad5a'],immune:['#6cbd93','#b779e5']}; const [cell, vessel]=palettes[id]||palettes.vesicle; cellRoot.children[0].material.color.set(cell); carrier.children[0].material.color.set(vessel); carrier.visible=id !== 'cell' }
function initWebGL() {
  if (!canvasHost.value) return
  scene = new THREE.Scene(); scene.background = new THREE.Color('#071b22'); scene.fog = new THREE.FogExp2('#071b22', .085)
  camera = new THREE.PerspectiveCamera(36,1,.1,100); camera.position.set(6.1,4.2,7.4)
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25; canvasHost.value.appendChild(renderer.domElement)
  controls = new OrbitControls(camera,renderer.domElement); controls.target.set(0,0,0); controls.enableDamping=true; controls.dampingFactor=.055; controls.minDistance=3.5; controls.maxDistance=13; controls.maxPolarAngle=Math.PI*.82; controls.saveState()
  scene.add(new THREE.HemisphereLight('#b9fff2','#061015',2.1)); const key=new THREE.DirectionalLight('#c9fff4',3.4); key.position.set(4,5,6); scene.add(key); const rim=new THREE.PointLight('#4bbdb9',6,13,2); rim.position.set(-4,1,-2); scene.add(rim); const warm=new THREE.PointLight('#ef9c74',2.6,9,2); warm.position.set(2,-3,3); scene.add(warm)
  buildCell(); applyPreset(active.value.id); clock=new THREE.Clock()
  resizeObserver=new ResizeObserver(()=>{const {clientWidth:w,clientHeight:h}=canvasHost.value;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}); resizeObserver.observe(canvasHost.value)
  const render=()=>{frame=requestAnimationFrame(render);const t=clock.getElapsedTime(); cellRoot.rotation.y=t*.075; if(carrier){const progress=playing.value?(Math.sin(t*(speed.value==='2×'?1.3:.65))*.5+.5):0; carrier.position.lerp(new THREE.Vector3(-4.2+progress*2.8,.55-progress*.35,1.1-progress*.55),.045); carrier.rotation.y+=.018} controls.update();renderer.render(scene,camera)}; render()
}
onMounted(initWebGL)
onBeforeUnmount(()=>{cancelAnimationFrame(frame);resizeObserver?.disconnect();controls?.dispose();renderer?.dispose();renderer?.domElement?.remove();scene?.traverse(obj=>{obj.geometry?.dispose?.();if(obj.material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose?.())}})})
watch(rotation,value=>{if(!controls||!camera)return;const radians=THREE.MathUtils.degToRad(value);camera.position.set(Math.sin(radians)*8,4.2,Math.cos(radians)*8);controls.update()})
</script>

<style scoped>
.bio-view{min-height:100vh;padding:22px 72px 54px 26px;color:#e8f5f5;background:#07151a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;overflow:hidden}.bio-topbar,.bio-hero,.studio-shell,.prompt-bar,.notice{max-width:1320px;margin-left:auto;margin-right:auto}.bio-topbar{height:42px;display:flex;align-items:center;justify-content:space-between;color:#b9d0d1;font-size:12px;letter-spacing:.09em}.bio-brand{display:flex;align-items:center;gap:8px;font-weight:700}.bio-brand b{color:#69ead1}.bio-brand em{padding:3px 7px;border:1px solid #29585b;border-radius:20px;color:#6de0cb;font-size:9px;font-style:normal}.bio-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;color:#0b2225;background:#65dfcd}.bio-status{display:flex;align-items:center;gap:7px;color:#87a5a7;font-size:11px;letter-spacing:0}.bio-status i{width:7px;height:7px;border-radius:50%;background:#65e2a9;box-shadow:0 0 0 4px #65e2a920}.bio-hero{display:flex;align-items:center;justify-content:space-between;padding:34px 32px 27px}.eyebrow,.side-label{margin:0;color:#58cdbf;font-size:10px;font-weight:700;letter-spacing:.17em}.bio-hero h1{margin:10px 0;color:#ecfafa;font-size:clamp(30px,3.4vw,46px);line-height:1.16;letter-spacing:-.05em}.bio-hero h1 span{color:#61d9c4}.hero-copy{max-width:480px;margin:0;color:#91afb1;font-size:14px;line-height:1.7}.hero-orbit{position:relative;display:grid;place-items:center;width:176px;height:114px;color:#6ce5d0}.hero-orbit:before,.hero-orbit:after{content:"";position:absolute;width:160px;height:48px;border:1px solid #41a79c75;border-radius:50%;transform:rotate(23deg)}.hero-orbit:after{transform:rotate(-28deg)}.orbit-node{position:absolute;z-index:2;width:8px;height:8px;border-radius:50%;background:#7af5d9;box-shadow:0 0 13px #62e2ca}.n1{top:13px;left:39px}.n2{right:17px;bottom:22px}.n3{left:37px;bottom:17px}.studio-shell{display:grid;grid-template-columns:190px minmax(380px,1fr) 265px;min-height:497px;border:1px solid #1c4044;border-radius:18px;background:#0a1b20;box-shadow:0 24px 70px #0007;overflow:hidden}.model-library,.inspector{padding:20px 14px;background:#0a181d}.model-library{border-right:1px solid #19363a}.preset{display:flex;align-items:center;gap:9px;width:100%;margin-top:10px;padding:9px;border:1px solid transparent;border-radius:10px;color:#9dbabd;background:transparent;text-align:left;cursor:pointer;transition:.18s}.preset:hover{background:#10292d}.preset.active{border-color:#2a817b;background:#123438;color:#eafffb}.preset-icon{display:grid;place-items:center;width:31px;height:31px;border-radius:8px;color:#64e1cf;background:#1c4a4b}.preset b,.preset small{display:block}.preset b{font-size:12px}.preset small{margin-top:3px;color:#719395;font-size:10px}.side-divider{height:1px;margin:19px 0;border-top:1px solid #1a393d}.new-scene{display:flex;align-items:center;gap:5px;width:100%;margin-top:10px;padding:8px;border:1px dashed #2d6062;border-radius:8px;color:#80b5b2;background:transparent;font:inherit;font-size:11px;cursor:pointer}.viewport-panel{display:flex;min-width:0;flex-direction:column;padding:18px;background:radial-gradient(circle at 45% 30%,#123a3b,#0a1b20 68%)}.viewport-head{display:flex;justify-content:space-between;align-items:center}.viewport-head span{color:#5fc7ba;font-size:10px;letter-spacing:.12em}.viewport-head h2{margin:5px 0 14px;font-size:17px;letter-spacing:-.03em}.view-actions{display:flex;gap:6px}.view-actions button,.speed{display:grid;place-items:center;width:31px;height:31px;border:1px solid #2a5355;border-radius:8px;color:#a5cccc;background:#10292d;cursor:pointer}.viewport{position:relative;flex:1;min-height:340px;border:1px solid #2c6668;border-radius:12px;background:radial-gradient(ellipse at center,#174b4b 0,#092127 56%,#06161b 100%);overflow:hidden;perspective:700px;transition:.2s}.viewport.expanded{position:fixed;z-index:10020;inset:24px;min-height:auto}.grid-floor{position:absolute;width:180%;height:90%;bottom:-53%;left:-40%;background:linear-gradient(#59cdc927 1px,transparent 1px),linear-gradient(90deg,#59cdc927 1px,transparent 1px);background-size:28px 28px;transform:rotateX(65deg)}.cell-scene{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .35s ease}.cell-membrane,.cell-inner{position:absolute;top:50%;left:50%;border-radius:50%;transform:translate(-50%,-50%)}.cell-membrane{width:245px;height:220px;border:9px solid #46a99b55;background:#52beae18;box-shadow:0 0 45px #46d8c52b,inset 0 0 38px #4fd0c44d}.cell-inner{width:209px;height:184px;border:1px solid #75d6c15a;background:radial-gradient(circle at 38% 42%,#45c0a63c,#155a5a33 55%,transparent 70%)}.nucleus{position:absolute;top:47%;left:50%;width:83px;height:77px;border:2px solid #70e4d2a6;border-radius:49% 51% 45% 55%;background:radial-gradient(circle,#278f8f,#145d64);box-shadow:0 0 25px #4ed0bc70;transform:translate(-50%,-50%)}.nucleus:after{content:"";position:absolute;top:27px;left:31px;width:17px;height:17px;border-radius:50%;background:#8bf8dc;box-shadow:0 0 13px #8bf8dc}.mito{position:absolute;width:44px;height:20px;border:3px solid #f0b45c;border-radius:60% 40% 55% 45%;background:repeating-linear-gradient(75deg,#c8773c 0 3px,#f3bf6a 3px 6px);box-shadow:0 0 14px #ed9e5060}.m1{left:35%;top:37%;transform:rotate(26deg)}.m2{right:30%;bottom:35%;transform:rotate(-41deg)}.golgi{position:absolute;right:30%;top:30%;width:39px;height:25px;border-top:3px solid #a881db;border-radius:50%;box-shadow:0 7px 0 -2px #a881db,0 14px 0 -2px #a881db}.virus{position:absolute;left:21%;top:33%;width:66px;height:66px;transform-style:preserve-3d;transition:left 1.4s cubic-bezier(.2,.8,.2,1)}.virus.infecting{left:39%;top:42%}.capsid{position:absolute;inset:7px;border:2px solid #e3f4ff;border-radius:50%;background:radial-gradient(circle at 35% 30%,#c2f5ff,#4287a4 57%,#22506c);box-shadow:0 0 26px #b9efff}.virus-core{position:absolute;z-index:2;top:26px;left:26px;width:14px;height:14px;border-radius:50%;background:#f2de76}.spike{position:absolute;top:28px;left:30px;width:6px;height:14px;border-radius:6px;background:#f5c777;transform-origin:3px 5px;box-shadow:0 -4px 0 1px #d77875}.model-tag{position:absolute;padding:5px 8px;border:1px solid #65e3d36e;border-radius:6px;color:#d7ffff;background:#0b272bd9;font-size:10px}.model-tag i{display:inline-block;width:5px;height:5px;margin-right:4px;border-radius:50%;background:#76f2dc}.tag-virus{top:25%;left:12%}.tag-cell{right:9%;bottom:27%}.view-hint{position:absolute;bottom:10px;left:50%;display:flex;align-items:center;gap:5px;color:#85a8aa;font-size:10px;transform:translateX(-50%)}.axis{position:absolute;color:#a8cdcf;font:10px ui-monospace,monospace}.axis-x{bottom:13px;right:21px;color:#f39191}.axis-y{bottom:27px;right:21px;color:#8dd4a4}.axis-z{bottom:13px;right:37px;color:#8ab7ff}.timeline{display:flex;align-items:center;gap:10px;margin-top:13px;color:#789ea0;font-size:10px}.play{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;color:#082125;background:#6be2cc;cursor:pointer}.track{position:relative;flex:1;height:3px;border-radius:9px;background:#285154}.track span{display:block;height:100%;border-radius:9px;background:#68dfcc;transition:.5s}.track i{position:absolute;top:50%;width:9px;height:9px;border-radius:50%;background:#e4fffc;transform:translate(-50%,-50%);transition:.5s}.speed{width:34px;height:25px;font-size:10px}.rotation{width:100%;height:4px;margin-top:12px;accent-color:#63d9c6}.inspector{border-left:1px solid #19363a}.inspector h3{margin:9px 0 6px;color:#e4f6f5;font-size:15px}.inspector>p{margin:0 0 17px;color:#83a5a6;font-size:11px;line-height:1.7}.stage-list{display:grid;gap:5px}.stage-list button{display:flex;align-items:center;gap:8px;width:100%;padding:8px;border:1px solid transparent;border-radius:9px;color:#91afb1;background:transparent;text-align:left;cursor:pointer}.stage-list button:hover{background:#10282c}.stage-list button.selected{border-color:#28736f;background:#123539;color:#eafffb}.stage-list>button>span{color:#4fd1bd;font:10px ui-monospace,monospace}.stage-list div{flex:1}.stage-list b,.stage-list small{display:block}.stage-list b{font-size:11px}.stage-list small{margin-top:3px;color:#6e9294;font-size:9px}.stage-list svg{color:#65e0c8}.accuracy{display:flex;gap:7px;margin-top:18px;padding:9px;border:1px solid #21484b;border-radius:9px;color:#81a5a6;background:#0d252a;font-size:10px;line-height:1.55}.accuracy svg{flex:none;color:#67d8c6}.prompt-bar{display:flex;align-items:center;gap:10px;margin-top:17px;padding:8px 8px 8px 16px;border:1px solid #286063;border-radius:13px;background:#0c2328;box-shadow:0 10px 30px #0003}.prompt-icon{color:#70ead5}.prompt-bar input{flex:1;min-width:0;border:0;outline:0;color:#e8f8f7;background:transparent;font:inherit;font-size:13px}.prompt-bar input::placeholder{color:#628789}.prompt-bar button{display:flex;align-items:center;gap:7px;min-height:39px;padding:0 14px;border:0;border-radius:9px;color:#082225;background:#6de0cb;font:700 12px inherit;cursor:pointer}.prompt-bar button:disabled{opacity:.42;cursor:not-allowed}.notice{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;color:#6fe2cb;font-size:11px}@media(max-width:980px){.bio-view{padding:14px 18px 58px}.studio-shell{grid-template-columns:160px 1fr}.inspector{display:none}}@media(max-width:620px){.bio-hero{padding:24px 5px}.hero-orbit{display:none}.studio-shell{grid-template-columns:1fr}.model-library{display:flex;gap:5px;overflow:auto;border-right:0;border-bottom:1px solid #19363a}.side-label,.side-divider,.new-scene{display:none}.preset{min-width:130px;margin:0}.viewport{min-height:320px}.bio-topbar{padding-right:45px}}
.viewport{background:#071b22;perspective:none}.webgl-host{position:absolute;inset:0;touch-action:none}.webgl-host :deep(canvas){display:block;width:100%;height:100%;cursor:grab}.webgl-host :deep(canvas):active{cursor:grabbing}.model-tag,.view-hint{z-index:2;pointer-events:none}
</style>
