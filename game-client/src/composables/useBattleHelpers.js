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
  // 优先匹配元素图标（火、水、雷、风、草、冰、圣、暗、岩、钢、毒）
  const elementIcons = {
    fire: 'mdi:fire',
    water: 'mdi:water',
    thunder: 'mdi:lightning-bolt',
    wind: 'mdi:weather-windy',
    grass: 'mdi:leaf',
    ice: 'mdi:snowflake',
    holy: 'mdi:brightness-7',
    dark: 'mdi:moon-waning-crescent',
    rock: 'mdi:terrain',
    steel: 'mdi:cube-outline',
    poison: 'mdi:skull-crossbones'
  }
  if (elementIcons[type]) return elementIcons[type]

  // 扩展后的效果图标映射
  const map = {
    // 伤害/持续
    dot: 'mdi:skull-crossbones',
    bleed: 'mdi:blood-bag',
    burn: 'cuida:fire-outline',
    // 控制
    stun: 'mdi:lightning-bolt',
    freeze: 'mdi:snowflake',
    silence: 'mdi:comment-remove-outline',
    slow: 'mdi:tortoise',
    taunt: 'mdi:account-voice',
    // 防御/生存
    shield: 'mdi:shield',
    reflect: 'mdi:shield-refresh',
    dmgReduction: 'mdi:shield-half-full',   // 减伤
    // 治疗
    heal: 'mdi:heart-plus',
    regen: 'mdi:heart-circle',
    healingUp: 'mdi:heart-pulse',          // 治疗效果提升
    // 增益
    atkUp: 'mdi:sword',                    // 攻击力增加（改为更明显的剑图标）
    defUp: 'mdi:shield-star',
    spdUp: 'mdi:run-fast',
    critRateUp: 'fa:fire',
    critDmgUp: 'mdi:flash-circle',
    critUp: 'noto:heart-on-fire',          // 暴击通用
    maxHpUp: 'mdi:heart-box',              // 最大生命提升
    hpUp: 'mdi:heart-box',
    maxMpUp: 'mdi:water-plus',             // 最大魔力提升
    mpUp: 'mdi:water-plus',
    lifestealBuff: 'mdi:blood-saver',
    dodgeUp: 'mdi:shoe-sneaker',           // 闪避提升
    // 减益
    atkDown: 'mdi:sword-off',              // 修正图标名（原pepicons可能不可用）
    defDown: 'mdi:shield-off',
    spdDown: 'mdi:walk',
    // 印记
    dragonMark: 'simple-icons:redragon',
    shadowMark: 'line-md:moon',
    holyMark: 'mdi:star-shooting',
    // 通用
    buff: 'mdi:arrow-up-bold-circle-outline',
    debuff: 'mdi:arrow-down-bold-circle-outline',
    // 其他
  holyAnthem: 'heroicons:musical-note',   // 竖琴图标
    curse: 'mdi:candle',
  }
  return map[type] || 'mdi:circle-small'
}

export function getEffectTooltip(effect, maxHp) {
  let desc = ''
  switch (effect.type) {
case 'holyAnthem': {
  const atk = effect.atkPercent || 0;
  const cdmg = effect.critDmgPercent || 0;
  desc = `攻击+${atk}%，暴伤+${cdmg}%`;
  break;
}
    case 'burn': {
      const atk = effect.casterAttack || 50;
      const dmg = Math.floor(atk * (effect.value || 0.2) * (effect.stacks || 1));
      desc = `灼烧 · ${effect.stacks || 1}层 · 每回合损失 ${dmg} 点生命`;
      break;
    }
    case 'dot': 
      desc = `中毒 · ${effect.stacks || 1}层 · 每回合损失 ${Math.floor((effect.value || 0) * 100)}% 最大生命`; 
      break;
    case 'bleed': 
      desc = `流血 · 每回合损失 ${Math.floor(maxHp * (effect.value || 0.05))} 点生命`; 
      break;
    case 'freeze': 
      desc = '冻结 · 无法行动'; 
      break;
    case 'stun': 
      desc = '眩晕 · 无法行动'; 
      break;
    case 'shield': 
      desc = `护盾 · ${Math.floor(effect.value)} 点`; 
      break;
    case 'regen': 
      desc = `再生 · 每回合恢复 ${Math.floor(maxHp * effect.value)} 点生命`; 
      break;
    case 'atkUp': 
      desc = `攻击力提升 ${Math.floor(effect.value * 100)}%`; 
      break;
    case 'defUp': 
      desc = `防御力提升 ${Math.floor(effect.value * 100)}%`; 
      break;
    case 'spdUp': 
      desc = `速度提升 ${Math.floor(effect.value * 100)}%`; 
      break;
    case 'critUp': 
      desc = `暴击率提升 ${Math.floor(effect.value * 100)}%`; 
      break;
    case 'atkDown': 
      desc = `攻击力降低 ${Math.floor(-effect.value * 100)}%`; 
      break;
    case 'defDown': 
      desc = `防御力降低 ${Math.floor(-effect.value * 100)}%`; 
      break;
    case 'spdDown': 
      desc = `速度降低 ${Math.floor(-effect.value * 100)}%`; 
      break;
    case 'critDown': 
      desc = `暴击率降低 ${Math.floor(-effect.value * 100)}%`; 
      break;
    case 'holyMark': 
      desc = `光之烙印 · 受到伤害增加 ${Math.floor(effect.value * 100)}%`; 
      break;
    case 'dragonMark': 
      desc = `龙焰印记 · 受到伤害增加 ${Math.floor(effect.value * 100)}% · ${effect.stacks || 1}层`; 
      break;
    case 'shadowMark': 
      desc = `暗蚀印记 · 百分比生命真伤 · ${effect.stacks || 1}层`; 
      break;
    case 'element_mark': 
      desc = getElementMarkTooltip(effect); 
      break;
    default: 
      desc = effect.type;
  }
  return `${desc} · 剩余 ${effect.duration} 回合`
}
/**
 * 效果排序：套装印记 → 元素印记 → buff → debuff → dot
 */
export function getSortedEffects(target) {
  if (!target?.effects) return []
  
  const marks = ['dragonMark', 'shadowMark', 'holyMark']  // 套装印记
  const elementMarks = ['element_mark']                     // 元素印记
  
  return [...target.effects].sort((a, b) => {
    // 套装印记优先
    const aIsSet = marks.includes(a.type)
    const bIsSet = marks.includes(b.type)
    if (aIsSet && !bIsSet) return -1
    if (!aIsSet && bIsSet) return 1
    
    // 元素印记次之
    const aIsEle = elementMarks.includes(a.type)
    const bIsEle = elementMarks.includes(b.type)
    if (aIsEle && !bIsEle) return -1
    if (!aIsEle && bIsEle) return 1
    
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


/**
 * 获取元素印记对应的动画类名（基于元素颜色）
 */
export function getElementMarkClass(eff) {
  if (eff.type !== 'element_mark') return ''
  
  const colorMap = {
    fire: 'element-mark-fire',
    water: 'element-mark-water',
    thunder: 'element-mark-thunder',
    wind: 'element-mark-wind',
    grass: 'element-mark-grass',
    ice: 'element-mark-ice',
    holy: 'element-mark-holy',
    dark: 'element-mark-dark',
    rock: 'element-mark-rock',
    steel: 'element-mark-steel',
    poison: 'element-mark-poison'
  }
  
  return colorMap[eff.element] || 'element-mark-default'
}

/**
 * 获取元素印记的提示文字
 */
export function getElementMarkTooltip(eff) {
  if (eff.type !== 'element_mark') return ''
  
  const labelMap = {
    fire: '火', water: '水', thunder: '雷', wind: '风',
    grass: '草', ice: '冰', holy: '圣', dark: '暗',
    rock: '岩', steel: '钢', poison: '毒'
  }
  
  const label = labelMap[eff.element] || eff.element
  return `元素印记·${label}`
}

export function getEffectDisplayName(type) {
  const map = {
    atkUp: '攻击力', defUp: '防御力', spdUp: '速度',
    atkDown: '攻击力', defDown: '防御力', spdDown: '速度',
    critRateUp: '暴击率', critDmgUp: '暴击伤害',
    maxHpUp: '最大生命', dodgeUp: '闪避率',
    shield: '护盾', regen: '再生', dot: '中毒', bleed: '流血',
    stun: '眩晕', freeze: '冻结', silence: '沉默',
    reflect: '反伤', lifestealBuff: '吸血强化',
    weak: '虚弱', taunt: '嘲讽',
    holyMark: '光之烙印', dragonMark: '龙焰印记', shadowMark: '暗蚀印记',
    element_mark: '元素印记',  holyAnthem: '神圣赞美诗'
  }
  return map[type] || type
}

export function getEffectDisplayValue(eff, maxHp) {
if (eff.type === 'holyAnthem') {
  const atk = eff.atkPercent || 0;
  const cdmg = eff.critDmgPercent || 0;
  return `+${atk}% ATK / +${cdmg}% CDMG`;
}
if (eff.type === 'burn') {
  const atk = eff.casterAttack || 50;
  const dmg = Math.floor(atk * (eff.value || 0.2) * (eff.stacks || 1));
  return dmg + ' 点/回合';
}

  if (eff.type === 'shield') {
    return Math.floor(eff.value) + ' 点'
  }
  if (['stun','freeze','silence'].includes(eff.type)) {
    return '控制'
  }
if (eff.type === 'dot') {
    if (eff.isPercentHp) {
        // 中毒：基于最大生命值百分比
        const pct = (eff.value || 0.015) * (eff.stacks || 1)
        const dmg = Math.floor((maxHp || 100) * pct)
        return dmg + ' 点/回合'
    } else {
        // 灼烧：基于攻击力的固定伤害（显示百分比）
        return Math.floor((eff.value || 0) * 100) + '% /回合'
    }
}
  if (eff.type === 'bleed') {
    const dmg = Math.floor((maxHp || 100) * (eff.value || 0.05))
    return dmg + ' 点/回合'
  }
  const val = eff.value || 0
  const percent = Math.abs(val * 100).toFixed(0)
  const sign = val >= 0 ? '+' : ''
  return sign + percent + '%'
}