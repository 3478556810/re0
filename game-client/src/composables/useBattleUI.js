import { reactive } from 'vue'
import { getElementMultiplier } from '../combat/damageCalculator'

export function useBattleUI() {
  // 浮动消息
  // 初始化时增加 type 字段
const floatingMessage = reactive({ visible: false, text: '', type: 'info' })

// showMessage 增加第三个参数 type
// showMessage 增加第三个参数 type
function showMessage(text, duration = 5000) {
  // ========== 嘎掉所有治疗/护盾/增益类消息 ==========
  const skipKeywords = [
    '恢复了', 'HP', '护盾', '防御力提升了', '闪避率提升了',
    '再生', '净化', '保护', '提升了', '加强了'
  ]
  if (skipKeywords.some(keyword => text.includes(keyword))) {
    return Promise.resolve()  // 直接静默跳过
  }
  // =================================================

  // 自动根据文本内容判断消息类型
  let type = 'info';
  if (text.includes('(暴击)')) type = 'crit';
  else if (text.includes('效果拔群') || text.includes('效果不理想')) type = 'special';
  else if (text.includes('提升') || text.includes('恢复') || text.includes('护盾')) type = 'buff';
  else if (text.includes('损失') || text.includes('中毒') || text.includes('流血') || text.includes('眩晕') || text.includes('冻结')) type = 'debuff';
  else if (text.includes('造成') || text.includes('伤害')) type = 'dmg';

  return new Promise((resolve) => {
    if (messageTimeout) clearTimeout(messageTimeout);
    if (messageResolve) { messageResolve(); messageResolve = null; }

    floatingMessage.text = text;
    floatingMessage.type = type;          // 动态类型
    floatingMessage.visible = true;
    messageResolve = resolve;

    if (globalSkipHandler) document.removeEventListener('click', globalSkipHandler);
    globalSkipHandler = () => skipMessage();
    setTimeout(() => document.addEventListener('click', globalSkipHandler), 0);

    messageTimeout = setTimeout(() => {
      floatingMessage.visible = false;
      cleanupMessage();
      if (messageResolve) { messageResolve(); messageResolve = null; }
    }, duration);
  });
}

let messageTimeout = null
let messageResolve = null
let globalSkipHandler = null



  function skipMessage() {
    if (messageTimeout) clearTimeout(messageTimeout)
    if (messageResolve) {
      floatingMessage.visible = false
      cleanupMessage()
      messageResolve()
      messageResolve = null
    }
  }

  function cleanupMessage() {
    if (globalSkipHandler) {
      document.removeEventListener('click', globalSkipHandler)
      globalSkipHandler = null
    }
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
    cleanupMessage()
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