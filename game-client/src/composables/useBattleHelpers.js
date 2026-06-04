import { Icon } from '@iconify/vue' // 仅用于类型推断

export function getElementIcon(element) {
  const map = { fire: 'mdi:fire', water: 'mdi:water', thunder: 'mdi:lightning-bolt', wind: 'mdi:weather-windy', grass: 'mdi:leaf', ice: 'mdi:snowflake', holy: 'mdi:brightness-7', dark: 'mdi:moon-waning-crescent', rock: 'mdi:terrain', steel: 'mdi:cube-outline' }
  return map[element] || 'mdi:help-circle'
}
export function getElementLabel(element) {
  const map = { fire: '火', water: '水', thunder: '雷', wind: '风', grass: '草', ice: '冰', holy: '圣', dark: '暗', rock: '岩', steel: '钢' }
  return map[element] || element
}
export function getElementColor(element) {
  const map = { fire: '#e74c3c', water: '#3498db', thunder: '#f1c40f', wind: '#2ecc71', grass: '#27ae60', ice: '#81ecec', holy: '#ffeaa7', dark: '#6c5ce7', rock: '#brown', steel: '#bdc3c7' }
  return map[element] || '#888'
}

export function getEffectIcon(type) {
  const map = {
    dot: 'mdi:skull-crossbones', hot: 'mdi:heart-plus', atkUp: 'mdi:sword-cross', defUp: 'mdi:shield-star',
    spdUp: 'mdi:run-fast', atkDown: 'pepicons-print:sword-off', defDown: 'mdi:shield-off', spdDown: 'mdi:walk',
    shield: 'mdi:shield', stun: 'mdi:lightning-bolt', silence: 'mdi:microphone-off', reflect: 'mdi:mirror',
    freeze: 'mdi:snowflake', bleed: 'mdi:blood-bag', weak: 'mdi:emoticon-cry', regen: 'mdi:heart-circle',
    taunt: 'mdi:account-voice', lifestealBuff: 'mdi:blood-saver', critRateUp: 'noto:heart-on-fire',
    dragonMark: 'simple-icons:redragon', shadowMark: 'line-md:moon', holyMark: 'mdi:star-shooting'
  }
  return map[type] || 'mdi:circle-small'
}

export function getEffectTooltip(effect, maxHp) {
  let desc = ''
  switch (effect.type) {
    case 'dot': desc = `每回合损失 ${Math.floor(effect.value * Math.pow(2, (effect.stacks || 1) - 1))} 点生命 (${effect.stacks || 1}层)`; break
    case 'bleed': desc = `每回合损失 ${Math.floor(maxHp * effect.value)} 点生命`; break
    case 'freeze': desc = '冻结中'; break
    case 'stun': desc = '眩晕中'; break
    case 'shield': desc = `护盾 ${effect.value}`; break
    case 'regen': desc = `每回合恢复 ${Math.floor(maxHp * effect.value)} 点生命`; break
    case 'atkUp': case 'defUp': case 'spdUp': case 'critUp': desc = `提升 ${Math.floor(effect.value * 100)}%`; break
    case 'atkDown': case 'defDown': case 'spdDown': case 'critDown': desc = `降低 ${Math.floor(-effect.value * 100)}%`; break
    default: desc = effect.type
  }
  return `${effect.type}：${desc}，剩余 ${effect.duration} 回合`
}

// 印记置顶排序（确保 dragonMark, shadowMark, holyMark 在最前）
export function getSortedEffects(enemy) {
  if (!enemy?.effects) return []
  const marks = ['dragonMark', 'shadowMark', 'holyMark']
  return [...enemy.effects].sort((a, b) => {
    const aIs = marks.includes(a.type)
    const bIs = marks.includes(b.type)
    if (aIs && !bIs) return -1
    if (!aIs && bIs) return 1
    return 0
  })
}

// 伤害数字分级样式
export function getDamageClass(damage, isCrit, isTrue, isShadowTrue) {
  if (damage >= 1000000) return 'dmg-type-mega'
  if (isCrit) return 'dmg-type-crit'
  if (isShadowTrue) return 'dmg-type-shadowTrue'
  if (isTrue) return 'dmg-type-trueDmg'
  return 'dmg-type-normal'
}