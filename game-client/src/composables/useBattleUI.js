import { reactive } from 'vue'
import { getElementMultiplier } from '../combat/damageCalculator'

export function useBattleUI() {
  // 浮动消息
  const floatingMessage = reactive({ visible: false, text: '', type: 'info' })

  let messageTimeout = null

  // ★ 非阻塞版 showMessage：立即返回，不等待用户点击
  function showMessage(text, duration = 5000) {
    // 跳过治疗/护盾等冗余消息
    const skipKeywords = [
      '恢复了', 'HP', '护盾', '防御力提升了', '流血', '持续伤害'
    ]
    if (skipKeywords.some(keyword => text.includes(keyword))) {
      return  // 静默跳过，不显示
    }

    // 自动判断消息类型
    let type = 'info'
    if (text.includes('(暴击)')) type = 'crit'
    else if (text.includes('效果拔群') || text.includes('效果不理想')) type = 'special'
    else if (text.includes('提升') || text.includes('恢复') || text.includes('护盾')) type = 'buff'
    else if (text.includes('损失') || text.includes('中毒') || text.includes('流血') || text.includes('眩晕') || text.includes('冻结')) type = 'debuff'
    else if (text.includes('造成') || text.includes('伤害')) type = 'dmg'

    // 清除之前的定时器，避免重叠
    if (messageTimeout) clearTimeout(messageTimeout)

    // 更新消息内容
    floatingMessage.text = text
    floatingMessage.type = type
    floatingMessage.visible = true

    // 定时消失
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

  // 效果气泡
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

  // 技能预览
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

  function destroyUI() {
    if (messageTimeout) clearTimeout(messageTimeout)
    effectBubble.visible = false
    skillPreview.visible = false
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
    destroyUI,
  }
}