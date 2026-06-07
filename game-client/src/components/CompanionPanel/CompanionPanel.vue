<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="top-bar">
        <h2><Icon icon="mdi:account-group" /> 伙伴</h2>
        <button class="close-btn" @click="$emit('close')"><Icon icon="mdi:close" /></button>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'stats' }]" @click="activeTab = 'stats'">
          <Icon icon="mdi:chart-line" /> 属性
        </button>
        <button :class="['tab', { active: activeTab === 'skills' }]" @click="activeTab = 'skills'">
          <Icon icon="mdi:book-open" /> 技能
        </button>
        <button :class="['tab', { active: activeTab === 'talent' }]" @click="activeTab = 'talent'">
          <Icon icon="mdi:star-circle" /> 天赋
        </button>
      </div>

      <div class="tab-content">
        <!-- 属性页（默认第一页） -->
       <!-- 属性页（默认第一页） -->
<div v-if="activeTab === 'stats'" class="stats-content">
  <div class="companion-header">
    <div class="companion-avatar">
      <Icon :icon="currentCompanion?.icon || 'mdi:account-heart'" class="avatar-icon" />
    </div>
    <div class="companion-info">
      <div class="companion-name">{{ currentCompanion?.name || '未选择' }}</div>
      <div class="progress-row">
        <div class="exp-area">
          <span class="progress-label">Lv.{{ currentCompanion?.level || 1 }}</span>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: expPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ currentCompanion?.exp || 0 }}/{{ nextExp }}</span>
        </div>
        <div class="affection-area">
          <Icon icon="mdi:heart" class="affection-icon" />
          <div class="progress-bar-bg">
            <div class="progress-bar-fill affection" :style="{ width: affectionPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ affectionTitle }}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="switch-section">
    <button class="pixel-btn small" @click="showSwitch = !showSwitch">
      <Icon icon="mdi:swap-horizontal" /> 切换伙伴
    </button>
    <div v-if="showSwitch" class="companion-switch-list">
      <div v-for="comp in companionList" :key="comp.id" class="switch-item"
           :class="{ active: activeCompanionId === comp.id }" @click="selectCompanion(comp.id)">
        <Icon :icon="comp.icon || 'mdi:account'" />
        <span>{{ comp.name }}</span>
        <span class="switch-level">Lv.{{ comp.level }}</span>
      </div>
    </div>
  </div>

  <!-- 基础属性 -->
  <div class="section">
    <h3><Icon icon="mdi:shield-account" /> 基础属性</h3>
    <div class="stat-list">
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:heart" /> 生命</span><span>{{ companionStats.hp }}</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:water" /> 魔法</span><span>{{ companionStats.mp }}</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:sword-cross" /> 攻击</span><span>{{ companionStats.atk }}</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:shield" /> 防御</span><span>{{ companionStats.def }}</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:speedometer" /> 速度</span><span>{{ companionStats.speed }}</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:shoe-print" /> 闪避率</span><span>{{ Math.floor(companionStats.dodge || 0) }}%</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:alert-circle" /> 暴击率</span><span>{{ companionStats.critRate }}%</span></div>
      <div class="stat-item"><span class="stat-label"><Icon icon="mdi:flash-circle" /> 暴伤</span><span>{{ companionStats.critDmg }}%</span></div>
    </div>
  </div>

  <!-- 战斗详情（可折叠，含好感度加成、真实伤害、元素伤害） -->
  <div class="section">
    <h3 class="collapsible-header" @click="showCombatDetail = !showCombatDetail">
      <Icon icon="mdi:creation" /> 战斗详情
      <Icon :icon="showCombatDetail ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="collapse-icon" />
    </h3>
    <div v-if="showCombatDetail" class="stat-list">
     

      <!-- 真实伤害 -->
      <div class="stat-item">
        <span class="stat-label"><Icon icon="mdi:sword" /> 真实伤害</span>
        <span class="stat-value">{{ companionStats.trueDmg || 0 }}</span>
      </div>

      <!-- 分隔横线 -->
      <div class="stat-divider"></div>

      <!-- 元素伤害 -->
      <div v-for="elem in elements" :key="elem.key" class="stat-item">
        <span class="stat-label"><Icon :icon="elem.icon" /> {{ elem.name }}</span>
        <span class="stat-value">{{ companionStats[elem.key] || 0 }}%</span>
      </div>



            <!-- 分隔横线 -->
      <div class="stat-divider"></div>
 <!-- 好感度加成 -->
      <div class="stat-item"><span class="stat-label">攻击力加成</span><span class="bonus-value">+{{ affectionBonus.atk }}</span></div>
      <div class="stat-item"><span class="stat-label">防御力加成</span><span class="bonus-value">+{{ affectionBonus.def }}</span></div>
      <div class="stat-item"><span class="stat-label">生命值加成</span><span class="bonus-value">+{{ affectionBonus.hp }}</span></div>
      <div class="stat-item"><span class="stat-label">速度加成</span><span class="bonus-value">+{{ affectionBonus.speed }}</span></div>

    </div>
  </div>
</div>
        <!-- 技能页 -->
        <div v-if="activeTab === 'skills'">
          <SkillPanel v-if="currentCompanion" mode="companion" :companion="currentCompanion" />
          <div v-else class="empty">请先选择伙伴</div>
        </div>

        <!-- 天赋页 -->
        <div v-if="activeTab === 'talent'">
          <div v-if="!currentCompanion" class="empty">请先选择伙伴</div>
          <TalentGrid v-else :key="currentCompanion?.id" :nodes="companionTalentNodes" :skill-points="companionTalentPoints" @allocate="onCompanionTalentAllocate" />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./CompanionPanel.js"></script>
<style src="./CompanionPanel.css" scoped></style>