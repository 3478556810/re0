// src/utils/elementUtils.js

export function getElementIcon(e) {
  const map = {
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
    poison: 'mdi:skull-crossbones'   // 或 mdi:biohazard
  }
  return map[e] || 'mdi:help-circle'
}

export function getElementLabel(e) {
  const map = {
    fire: '火', water: '水', thunder: '雷', wind: '风',
    grass: '草', ice: '冰', holy: '圣', dark: '暗',
    rock: '岩', steel: '钢',poison: '毒'
  }
  return map[e] || e
}

export function getElementColor(e) {
  const map = {
    fire: '#e74c3c', water: '#3498db', thunder: '#f1c40f',
    wind: '#2ecc71', grass: '#27ae60', ice: '#81ecec',
    holy: '#ffeaa7', dark: '#6c5ce7', rock: '#brown',
    steel: '#bdc3c7',poison: '#a020f0'   // 紫色
  }
  return map[e] || '#888'
}