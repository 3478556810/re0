export async function loadContentPacks() {
  
  const manifest = {
    packs: ['default', 'dlc'],
    files: [
       // 怪物分片
      'monsters/bosses.json',
      'monsters/_weak.json',
      'monsters/_normal.json',
      'monsters/_strong.json',
      'monsters/_special.json',
      // 技能分属性文件
      'skills/_neutral.json',
      'skills/_fire.json',
      'skills/_water.json',
      'skills/_thunder.json',
      'skills/_wind.json',
      'skills/_ice.json',
      'skills/_rock.json',
      'skills/_grass.json',
      'skills/_steel.json',
      'skills/_holy.json',
      'skills/_dark.json',
      'skills/_poison.json',
      'forgeRecipes.json',
      'materials.json',
      'dungeons.json',
      'storyScript.json',
      'tokenShop.json',
      'characters.json'
    ]
  }

  const config = {
    monsterTemplates: [],
    skillPool: [],
    forgeRecipes: [],
    materialDefinitions: [],
    dungeonConfigs: {},
    storyScript: {},
    tokenShopItems: [],
    materialPrices: {},
    characters: {}
  }

  for (const pack of manifest.packs) {
    for (const file of manifest.files) {
      const url = `/data/${pack}/${file}`
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const data = await res.json()

        // 统一处理所有 skills/ 开头的文件
        if (file.startsWith('skills/')) {
          if (!config.skillPool) config.skillPool = []
          config.skillPool.push(...data)
          continue
        }

        // 统一处理所有 monsters/ 开头的文件
        if (file.startsWith('monsters/')) {
          if (!config.monsterTemplates) config.monsterTemplates = []
          // 对于每个怪物，若已存在同 id 则覆盖（方便 dlc 更新），否则追加
          for (const mob of data) {
            const idx = config.monsterTemplates.findIndex(m => m.id === mob.id)
            if (idx !== -1) {
              config.monsterTemplates[idx] = mob
            } else {
              config.monsterTemplates.push(mob)
            }
          }
          continue
        }

        // 其他文件保持不变
        switch (file) {
          case 'forgeRecipes.json':
            config.forgeRecipes = data
            break
          case 'materials.json':
            config.materialDefinitions = data
            break
          case 'dungeons.json':
            config.dungeonConfigs = data
            break
          case 'storyScript.json':
            config.storyScript = data
            break
          case 'tokenShop.json':
            config.tokenShopItems = data
            break
          case 'characters.json':
            config.characters = data
            break
        }
      } catch (e) {
        console.warn(`加载 ${url} 失败`, e)
      }
    }
  }

  return config
}