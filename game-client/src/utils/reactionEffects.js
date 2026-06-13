// 反应特效配置
const reactionConfig = {
  蒸发: { text: '蒸发', textColor: '#ffa500', glowColor: '#ff8c00' },
  超载: { text: '超载', textColor: '#ff4444', glowColor: '#ff0000' },
  感电: { text: '感电', textColor: '#33ccff', glowColor: '#00aaff' },
  湮灭: { text: '湮灭', textColor: '#aa66ff', glowColor: '#9933ff' },
}

/**
 * 播放元素反应特效（自动隐藏/恢复技能栏）
 * @param {string} reactionType - 反应中文名，如 '湮灭'
 * @param {number} x - 屏幕坐标 X
 * @param {number} y - 屏幕坐标 Y
 * @param {number} duration - 持续时间 ms
 */
export function showReaction(reactionType, x, y, duration = 800) {
  const config = reactionConfig[reactionType] || reactionConfig.湮灭
  if (!config) return

  // 1. 隐藏技能栏
  const skillBar = document.querySelector('.skill-flee-row')
  if (skillBar) skillBar.style.display = 'none'

  // 2. 创建浮动文字
  const textDiv = document.createElement('div')
  textDiv.innerText = config.text
  textDiv.style.cssText = `
    position:fixed; left:${x}px; top:${y}px; color:${config.textColor};
    font-size:24px; font-weight:bold; font-family:'Press Start 2P',cursive;
    text-shadow:2px 2px 0 #000; pointer-events:none; z-index:1000;
    transform:translate(-50%,-50%); animation:reactionFloat 0.6s ease-out forwards;
    white-space:nowrap;
  `
  document.body.appendChild(textDiv)

  // 3. 创建光晕
  const glow = document.createElement('div')
  glow.style.cssText = `
    position:fixed; left:${x}px; top:${y}px; width:0px; height:0px; border-radius:50%;
    background:${config.glowColor}; pointer-events:none; z-index:999;
    transform:translate(-50%,-50%); animation:reactionGlow 0.5s ease-out forwards;
  `
  document.body.appendChild(glow)

  // 4. 湮灭粒子
  const particles = []
  if (reactionType === '湮灭') {
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div')
      const angle = Math.random() * Math.PI * 2
      const rad = 40 + Math.random() * 60
      const tx = Math.cos(angle) * rad
      const ty = Math.sin(angle) * rad
      particle.style.cssText = `
        position:fixed; left:${x}px; top:${y}px; width:6px; height:6px;
        background:#aa66ff; border-radius:50%; pointer-events:none; z-index:1001;
        transform:translate(-50%,-50%); animation:particleFly 0.6s ease-out forwards;
        --tx:${tx}px; --ty:${ty}px;
      `
      document.body.appendChild(particle)
      particles.push(particle)
    }
  }

  // 5. 统一清理并恢复技能栏
  const cleanup = () => {
    textDiv.remove()
    glow.remove()
    particles.forEach(p => p.remove())
    // 恢复技能栏
    if (skillBar) skillBar.style.display = ''
  }
  setTimeout(cleanup, duration)
}

// 确保动画样式存在
if (!document.querySelector('#reaction-animations')) {
  const style = document.createElement('style')
  style.id = 'reaction-animations'
  style.textContent = `
    @keyframes reactionFloat {
      0% { opacity:1; transform:translate(-50%,-50%) scale(0.5); }
      70% { opacity:1; transform:translate(-50%,-80px) scale(1.2); }
      100% { opacity:0; transform:translate(-50%,-100px) scale(1); }
    }
    @keyframes reactionGlow {
      0% { width:0px; height:0px; opacity:0.8; }
      100% { width:120px; height:120px; opacity:0; }
    }
    @keyframes particleFly {
      0% { transform:translate(-50%,-50%) scale(1); opacity:0.8; }
      100% { transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity:0; }
    }
  `
  document.head.appendChild(style)
}