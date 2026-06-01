export async function loadContentPacks() {
  const manifest = {
    packs: ['default', 'dlc'],
    files: [
      'monsters.json',
      'skills.json',
      'forgeRecipes.json',
      'materials.json',
      'dungeons.json',
      'storyScript.json',
      'tokenShop.json',
      'characters.json'           // ← 添加角色文件
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
    characters: {}                // ← 添加角色容器
  }

  for (const pack of manifest.packs) {
    for (const file of manifest.files) {
      const url = `/data/${pack}/${file}`
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const data = await res.json()

        switch (file) {
          case 'monsters.json':
            config.monsterTemplates = data
            break
          case 'skills.json':
            config.skillPool = data
            break
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
          case 'characters.json':            // ← 处理角色文件
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