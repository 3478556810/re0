// 从 public/data/ 加载配置包，返回合并后的配置对象
export async function loadContentPacks() {
  // 默认清单：default 和 dlc 两个包，包含以下配置文件
  const manifest = {
    packs: ['default', 'dlc'],
    files: [
      'monsters.json',
      'skills.json',
      'forgeRecipes.json',
      'materials.json',
      'dungeons.json',
      'storyScript.json',
      'tokenShop.json'
    ]
  }

  // 最终配置容器
  const config = {
    monsterTemplates: [],
    skillPool: [],
    forgeRecipes: [],
    materialDefinitions: [],
    dungeonConfigs: {},
    storyScript: {},
    tokenShopItems: [],
    materialPrices: {}
  }

  // 依次加载 default 和 dlc（后者覆盖前者）
  for (const pack of manifest.packs) {
    for (const file of manifest.files) {
      const url = `/data/${pack}/${file}`
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const data = await res.json()

        // 根据文件名合并到 config 对应字段
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
          // 材料价格暂时用代码默认值，也可扩展
        }
      } catch (e) {
        console.warn(`加载 ${url} 失败`, e)
      }
    }
  }

  return config
}