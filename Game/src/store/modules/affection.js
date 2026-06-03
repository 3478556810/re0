import { reactive } from 'vue'

export function useAffection() {
  const affection = reactive({})

  const affectionTitles = {
    freyja: [
      { min: 0, title: '冷淡的剑士' },
      { min: 10, title: '毒舌的同伴' },
      { min: 30, title: '只对你笑的人' },
      { min: 50, title: '约定的守护者' },
      { min: 80, title: '命运的伴侣' },
    ],
    ain: [
      { min: 0, title: '迷惘的冒险者' },
      { min: 10, title: '可靠的搭档' },
      { min: 30, title: '默契的战友' },
      { min: 50, title: '心灵的支柱' },
      { min: 80, title: '不可替代之人' },
    ]
  }

  function getAffectionLevel(charId) {
    const val = affection[charId] || 0
    if (val >= 80) return 5
    if (val >= 50) return 4
    if (val >= 30) return 3
    if (val >= 10) return 2
    return 1
  }

  function getAffectionTitle(charId) {
    const val = affection[charId] || 0
    const titles = affectionTitles[charId] || []
    let result = '？？？'
    for (const t of titles) {
      if (val >= t.min) result = t.title
    }
    return result
  }

  function applyAffection(changes, saveFn) {
    for (const [charId, delta] of Object.entries(changes)) {
      if (!affection[charId]) affection[charId] = 0
      affection[charId] = Math.max(0, Math.min(100, affection[charId] + delta))
    }
    if (saveFn) saveFn()
  }

  return { affection, getAffectionLevel, getAffectionTitle, applyAffection }
}