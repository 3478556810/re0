import { reactive ,ref} from 'vue'
import { getElementMultiplier } from '../combat/damageCalculator'

export function useBattleUI() {
  // 浮动消息
  const floatingMessage = reactive({ visible: false, text: '', type: 'info' })
  let messageTimeout = null

  // ★ 非阻塞版 showMessage
  function showMessage(text, duration = 5000) {
    const skipKeywords = ['恢复了', 'HP', '护盾', '防御力提升了', '流血', '持续伤害']
    if (skipKeywords.some(keyword => text.includes(keyword))) return

    let type = 'info'
    if (text.includes('(暴击)')) type = 'crit'
    else if (text.includes('触发元素反应')) type = 'special'   // ★ 新增
    else if (text.includes('效果拔群') || text.includes('效果不理想')) type = 'special'
    else if (text.includes('提升') || text.includes('恢复') || text.includes('护盾')) type = 'buff'
    else if (text.includes('损失') || text.includes('中毒') || text.includes('流血') || text.includes('眩晕') || text.includes('冻结')) type = 'debuff'
    else if (text.includes('造成') || text.includes('伤害')) type = 'dmg'

    if (messageTimeout) clearTimeout(messageTimeout)
    floatingMessage.text = text
    floatingMessage.type = type
    floatingMessage.visible = true
    messageTimeout = setTimeout(() => {
      floatingMessage.visible = false
      messageTimeout = null
    }, duration)
  }

  function skipMessage() {
    if (messageTimeout) clearTimeout(messageTimeout)
    floatingMessage.visible = false
    messageTimeout = null
  }

  // 效果气泡（原有）
  const effectBubble = reactive({ visible: false, text: '', x: 0, y: 0 })
  function showEffectBubble(eff, maxHp, event, getEffectTooltip) {
    const text = getEffectTooltip(eff, maxHp)
    effectBubble.text = text
    effectBubble.visible = true
    const touch = event.touches ? event.touches[0] : event
    effectBubble.x = touch.clientX + 10
    effectBubble.y = touch.clientY - 40
  }
  function hideEffectBubbleOnOutsideClick(e) {
    if (!effectBubble.visible) return
    if (e.target.closest('.effect-badge')) return
    effectBubble.visible = false
  }

  // 技能预览（原有）
  const skillPreview = reactive({ visible: false, x: 0, y: 0, name: '', desc: '', dmg: '', mul: '1.0' })
  function showSkillPreview(skill, event, store, enemies, currentTargetIndex) {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return
    const target = enemies.value[currentTargetIndex.value]
    if (!target) return

    const skillLevel = store.player.skills[skill.id]?.level || 1
    const scaling = skill.levelScaling || { baseMul: 0 }
    const currentMul = (skill.baseMul || 0) + (skillLevel - 1) * (scaling.baseMul || 0)
    const atk = store.playerStats?.attack || 10
    const def = target.def || 0
    const elementMult = getElementMultiplier(skill.element, target.element)
    const rawDmg = Math.floor(atk * currentMul * elementMult)
    const estimatedDmg = Math.max(1, rawDmg - Math.floor(def * 0.5))

    skillPreview.visible = true
    skillPreview.name = skill.name
    skillPreview.desc = skill.desc || '无额外效果'
    skillPreview.dmg = `${estimatedDmg}`
    skillPreview.mul = elementMult.toFixed(1)

    const rect = event.target.getBoundingClientRect()
    skillPreview.x = rect.left + rect.width / 2 - 60
    skillPreview.y = rect.top - 70
  }
  function hideSkillPreview() {
    skillPreview.visible = false
  }

  // ========== 新增：元素反应特效（包括湮灭） ==========
  // 反应配置：文本、文字颜色、光晕颜色、特效类型（用于不同动画）
  const reactionConfig = {
    蒸发:   { text: '蒸发',   textColor: '#ffa500', glowColor: '#ff8c00', effectClass: 'fire-glow' },
    超载:   { text: '超载',   textColor: '#ff4444', glowColor: '#ff0000', effectClass: 'explosion' },
    感电:   { text: '感电',   textColor: '#33ccff', glowColor: '#00aaff', effectClass: 'lightning' },
    湮灭:   { text: '湮灭',   textColor: '#aa66ff', glowColor: '#9933ff', effectClass: 'void' },
  }

  function showReaction(reactionType, x, y, duration = 800) {
    const config = reactionConfig[reactionType] || reactionConfig.湮灭
    if (!config) return

    // 1. 创建浮动文字
    const textDiv = document.createElement('div')
    textDiv.innerText = config.text
    textDiv.className = 'reaction-float-text'
    Object.assign(textDiv.style, {
      position: 'fixed',
      left: x + 'px',
      top: y + 'px',
      color: config.textColor,
      fontSize: '24px',
      fontWeight: 'bold',
      fontFamily: "'Press Start 2P', cursive",
      textShadow: '2px 2px 0 #000',
      pointerEvents: 'none',
      zIndex: 1000,
      transform: 'translate(-50%, -50%)',
      animation: 'reactionFloat 0.6s ease-out forwards',
      whiteSpace: 'nowrap'
    })
    document.body.appendChild(textDiv)
    setTimeout(() => textDiv.remove(), duration)

    // 2. 创建光晕特效（圆形扩散）
    const glow = document.createElement('div')
    glow.className = 'reaction-glow'
    Object.assign(glow.style, {
      position: 'fixed',
      left: x + 'px',
      top: y + 'px',
      width: '0px',
      height: '0px',
      borderRadius: '50%',
      backgroundColor: config.glowColor,
      pointerEvents: 'none',
      zIndex: 999,
      transform: 'translate(-50%, -50%)',
      animation: 'reactionGlow 0.5s ease-out forwards'
    })
    document.body.appendChild(glow)
    setTimeout(() => glow.remove(), duration)

    // 3. 额外粒子特效（仅湮灭增加暗紫色粒子）
    if (reactionType === '湮灭') {
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div')
        particle.className = 'reaction-particle'
        const angle = Math.random() * Math.PI * 2
        const rad = 40 + Math.random() * 60
        const tx = Math.cos(angle) * rad
        const ty = Math.sin(angle) * rad
        Object.assign(particle.style, {
          position: 'fixed',
          left: x + 'px',
          top: y + 'px',
          width: '6px',
          height: '6px',
          background: '#aa66ff',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1001,
          transform: 'translate(-50%, -50%)',
          animation: `particleFly 0.6s ease-out forwards`,
          '--tx': tx + 'px',
          '--ty': ty + 'px'
        })
        document.body.appendChild(particle)
        setTimeout(() => particle.remove(), 600)
      }
    }
  }

  // 注入必要的 CSS 动画（一次性执行，避免重复）
  if (!document.querySelector('#reaction-animations')) {
    const style = document.createElement('style')
    style.id = 'reaction-animations'
    style.textContent = `
      @keyframes reactionFloat {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
        70% { opacity: 1; transform: translate(-50%, -80px) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -100px) scale(1); }
      }
      @keyframes reactionGlow {
        0% { width: 0px; height: 0px; opacity: 0.8; }
        100% { width: 120px; height: 120px; opacity: 0; }
      }
      @keyframes particleFly {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  function destroyUI() {
    if (messageTimeout) clearTimeout(messageTimeout)
    effectBubble.visible = false
    skillPreview.visible = false
    // 可选：移除动态添加的动画样式，但保留不影响下次使用
  }

  return {
    floatingMessage,
    showMessage,
    skipMessage,
    effectBubble,
    showEffectBubble,
    hideEffectBubbleOnOutsideClick,
    skillPreview,
    showSkillPreview,
    hideSkillPreview,
    showReaction,   // 新增导出
    destroyUI,
  }
}