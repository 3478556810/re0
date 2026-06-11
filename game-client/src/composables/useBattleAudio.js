// 全局音频缓存
const audioCache = new Map()

export function preloadMonsterVoices(monsterIds) {
  monsterIds.forEach(monsterId => {
    ['attack', 'hit', 'defeat'].forEach(action => {
      const key = `${monsterId}_${action}`
      if (!audioCache.has(key)) {
        const audio = new Audio(`/sounds/${monsterId}/${action}.wav`)
        audio.preload = 'auto'
        audio.volume = 0.7
        audio.load()
        audioCache.set(key, audio)
      }
    })
  })
}

export function playCachedVoice(monsterId, action) {
  const key = `${monsterId}_${action}`
  let audio = audioCache.get(key)
  if (!audio) {
    audio = new Audio(`/sounds/${monsterId}/${action}.wav`)
    audio.volume = 0.7
    audioCache.set(key, audio)
  }
  audio.currentTime = 0
  audio.play().catch(() => {})
}