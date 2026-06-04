import { reactive, computed } from 'vue'

export function useWorld() {
  const world = reactive({
    currentBiome: 'town', playerX: 5, playerY: 4,
    day: 1, gameTime: 360, timeLimit: 365,
    respawnPoint: { biome: 'town', x: 5, y: 4 }
  })

  const weather = reactive({
    type: 'clear', intensity: 0, nextChangeHour: 0
  })

  // 季节
  function getSeason(day) {
    const d = day % 365
    if (d < 90) return 'spring'
    if (d < 180) return 'summer'
    if (d < 270) return 'autumn'
    return 'winter'
  }

  const seasonWeatherProb = {
    spring: { clear: 0.4, cloudy: 0.3, rain: 0.25, snow: 0.05 },
    summer: { clear: 0.35, cloudy: 0.2, rain: 0.4, snow: 0.05 },
    autumn: { clear: 0.3, cloudy: 0.3, rain: 0.3, snow: 0.1 },
    winter: { clear: 0.2, cloudy: 0.25, rain: 0.15, snow: 0.4 }
  }

  const terrainWeatherMod = {
    mountain: { snow: 0.15, rain: 0.1 },
    forest: { rain: 0.1 },
    plain: {}, town: {}
  }

  function rollWeather() {
    const season = getSeason(world.day)
    const probs = { ...seasonWeatherProb[season] }
    const terrain = world.currentBiome || 'plain'
    const mod = terrainWeatherMod[terrain] || {}
    for (const [key, val] of Object.entries(mod)) {
      if (probs[key] !== undefined) probs[key] = Math.min(1, probs[key] + val)
    }
    const rand = Math.random()
    let cumulative = 0
    for (const [type, prob] of Object.entries(probs)) {
      cumulative += prob
      if (rand <= cumulative) {
        weather.type = type
        weather.intensity = 0.3 + Math.random() * 0.7
        break
      }
    }
    weather.nextChangeHour = Math.floor(world.gameTime / 60) + 1
  }

  rollWeather()

  const weatherModifiers = computed(() => {
    const mods = { fire: 1.0, water: 1.0, thunder: 1.0, wind: 1.0, grass: 1.0, ice: 1.0, holy: 1.0, dark: 1.0, steel: 1.0, rock: 1.0 }
    if (!weather || weather.type === 'clear') return mods
    if (weather.type === 'rain') { mods.fire = 0.8; mods.water = 1.2; mods.thunder = 1.15; mods.grass = 1.1 }
    else if (weather.type === 'snow') { mods.ice = 1.2; mods.fire = 0.85; mods.water = 0.9; mods.wind = 1.1 }
    else if (weather.type === 'cloudy') { mods.fire = 0.9; mods.dark = 1.1; mods.holy = 0.9 }
    return mods
  })

function moveTo(biome, x, y) {
  world.currentBiome = biome;
  world.playerX = x;
  world.playerY = y;
}

  function respawn() {
    const p = world.respawnPoint
    world.currentBiome = p.biome; world.playerX = p.x; world.playerY = p.y
  }

  function setRespawnPoint(biome, x, y) {
    world.respawnPoint = { biome, x, y }
  }

  function advanceTime(minutes, facilities) {
    // 股票市场（如果保留）
    if (facilities && facilities.stocks && world.gameTime >= 540 && world.gameTime < 930) {
      facilities.stocks.forEach(s => {
        const volatility = 0.005
        const change = s.price * (Math.random() * volatility * 2 - volatility)
        s.price = Math.max(5, Math.round(s.price + change))
        if (!s.history) s.history = []
        s.history.push(s.price)
        if (s.history.length > 200) s.history.shift()
      })
    }
    world.gameTime += minutes
    const currentHour = Math.floor(world.gameTime / 60)
    if (currentHour >= weather.nextChangeHour) rollWeather()
    if (world.gameTime >= 1440) {
      world.gameTime -= 1440
      world.day++
      rollWeather()
    }
  }

  return { world, weather, weatherModifiers, moveTo, respawn: () => {
  // 移动回重生点
  worldModule.moveTo(worldModule.world.respawnPoint.biome, worldModule.world.respawnPoint.x, worldModule.world.respawnPoint.y);
  // 恢复满血满蓝
  playerModule.player.hp = playerModule.player.maxHp;
  playerModule.player.mp = playerModule.player.maxMp;
  save();
}, setRespawnPoint, advanceTime }
}