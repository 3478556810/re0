<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <h2><Icon icon="mdi:bank" /> 银行</h2>

      <!-- 当前存款 / 贷款状态 -->
      <div v-if="store.facilities.bank.deposit > 0" class="info-card">
        <p><Icon icon="mdi:cash-lock" /> 存款 {{ store.facilities.bank.deposit }} G</p>
        <p>到期日：第 {{ store.facilities.bank.maturityDay }} 天</p>
        <p>日利率：{{ (store.facilities.bank.dailyRate * 100).toFixed(2) }}%</p>
        <p class="matured" v-if="matured">已到期！可取出本息。</p>
        <button class="pixel-btn" @click="confirmWithdraw">
          {{ matured ? '取出 (含利息)' : '提前取出 (无利息)' }}
        </button>
      </div>
      <div v-else-if="store.facilities.bank.loan > 0" class="info-card">
        <p><Icon icon="mdi:credit-card" /> 贷款 {{ store.facilities.bank.loan }} G</p>
        <p>到期日：第 {{ store.facilities.bank.maturityDay }} 天</p>
        <p>日利率：{{ (store.facilities.bank.dailyRate * 100).toFixed(2) }}%</p>
        <p>需还款：{{ store.facilities.bank.loanRepay || repayAmount }} G</p>
        <button class="pixel-btn" @click="confirmRepay" :disabled="store.player.gold < (store.facilities.bank.loanRepay || repayAmount)">
          还款
        </button>
      </div>
      <div v-else class="info-card empty-state">
        <Icon icon="mdi:bank-outline" class="empty-icon" />
        <p>暂无存款或贷款</p>
      </div>

      <!-- 操作切换 -->
      <div class="tab-switch">
        <button class="pixel-btn small" :class="{ active: mode === 'deposit' }" @click="mode = 'deposit'">
          <Icon icon="mdi:cash-plus" /> 存款
        </button>
        <button class="pixel-btn small" :class="{ active: mode === 'loan' }" @click="mode = 'loan'">
          <Icon icon="mdi:credit-card-plus" /> 贷款
        </button>
      </div>

      <!-- 存款表单 -->
      <div v-if="mode === 'deposit'" class="form">
        <div class="input-row">
          <label>金额</label>
          <input v-model.number="depAmount" type="number" min="1" class="pixel-input" />
        </div>
        <div class="input-row">
          <label>天数</label>
          <select v-model.number="depDays" class="pixel-input">
            <option :value="7">7天</option>
            <option :value="30">30天</option>
            <option :value="90">90天</option>
          </select>
        </div>
        <div class="rate-display">
          日利率：{{ (depDailyRate * 100).toFixed(2) }}% | 
          到期本息：{{ depositMaturityAmount }} G
        </div>
        <button class="pixel-btn primary" @click="confirmDeposit" :disabled="!canDeposit">
          <Icon icon="mdi:lock" /> 存入
        </button>
      </div>

      <!-- 贷款表单 -->
      <div v-if="mode === 'loan'" class="form">
        <div class="input-row">
          <label>金额</label>
          <input v-model.number="loanAmount" type="number" min="1" :max="maxLoan" class="pixel-input" />
        </div>
        <div class="max-loan">最大可贷 {{ maxLoan }} G（基于冒险者等级）</div>
        <div class="rate-display">
          日利率：{{ (loanDailyRate * 100).toFixed(2) }}% | 
          贷款天数：{{ loanDays }}天 |
          到期需还：{{ loanRepayAmount }} G
        </div>
        <button class="pixel-btn primary" @click="confirmLoan" :disabled="!canLoan">
          <Icon icon="mdi:credit-card-check" /> 贷款
        </button>
      </div>

      <button class="pixel-btn close-btn" @click="$emit('close')">
        <Icon icon="mdi:close" /> 离开
      </button>

      <!-- 确认弹窗 -->
      <div v-if="showConfirm" class="confirm-overlay" @click.self="showConfirm = false">
        <div class="confirm-box pixel-panel">
          <p>{{ confirmMsg }}</p>
          <div class="confirm-actions">
            <button class="pixel-btn small" @click="execAction">确认</button>
            <button class="pixel-btn small" @click="showConfirm = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameStore } from '../store/gameStore'

const store = useGameStore()
const emit = defineEmits(['close'])

const mode = ref('deposit')
const depAmount = ref(1000)
const depDays = ref(30)
const loanAmount = ref(1000)
const loanDays = 30
const showConfirm = ref(false)
const confirmMsg = ref('')
const pendingAction = ref(null)

// 存款日利率（大幅提高）
const depDailyRate = computed(() => {
  if (depDays.value <= 7) return 0.015    // 1.5%
  if (depDays.value <= 30) return 0.02    // 2.0%
  return 0.025                            // 2.5%
})

const depositMaturityAmount = computed(() => {
  const rate = depDailyRate.value * depDays.value
  return Math.floor(depAmount.value * (1 + rate))
})

const canDeposit = computed(() => {
  return depAmount.value > 0 && store.player.gold >= depAmount.value && store.facilities.bank.deposit === 0 && store.facilities.bank.loan === 0
})

// 贷款日利率（更高）
const loanDailyRate = 0.035 // 3.5%/天

const maxLoan = computed(() => {
  const level = store.player.level
  if (level <= 5) return 500
  if (level <= 10) return 2000
  if (level <= 20) return 5000
  return 10000
})

const loanRepayAmount = computed(() => {
  const rate = loanDailyRate * loanDays
  return Math.floor(loanAmount.value * (1 + rate))
})

const canLoan = computed(() => {
  return loanAmount.value > 0 && loanAmount.value <= maxLoan.value && store.facilities.bank.deposit === 0 && store.facilities.bank.loan === 0
})

const matured = computed(() => {
  const bank = store.facilities.bank
  return bank.maturityDay && store.world.day >= bank.maturityDay
})

const repayAmount = computed(() => {
  const bank = store.facilities.bank
  if (!bank.loan) return 0
  // 直接使用存储的还款金额
  return bank.loanRepay || (bank.loan * (1 + bank.dailyRate * 30))
})

function confirmDeposit() {
  if (!canDeposit.value) return
  confirmMsg.value = `存入 ${depAmount.value} G，${depDays.value} 天后获得 ${depositMaturityAmount.value} G（日利率 ${(depDailyRate.value*100).toFixed(2)}%），确认？`
  pendingAction.value = 'deposit'
  showConfirm.value = true
}

function confirmLoan() {
  if (!canLoan.value) return
  confirmMsg.value = `贷款 ${loanAmount.value} G，${loanDays} 天后需还 ${loanRepayAmount.value} G（日利率 ${(loanDailyRate*100).toFixed(2)}%），确认？`
  pendingAction.value = 'loan'
  showConfirm.value = true
}

function confirmWithdraw() {
  const bank = store.facilities.bank
  const amount = matured.value ? depositMaturityAmount.value : bank.deposit
  confirmMsg.value = `取出 ${amount} G，确认？`
  pendingAction.value = 'withdraw'
  showConfirm.value = true
}

function confirmRepay() {
  confirmMsg.value = `还款 ${repayAmount.value} G，确认？`
  pendingAction.value = 'repay'
  showConfirm.value = true
}

function execAction() {
  const bank = store.facilities.bank
  switch (pendingAction.value) {
    case 'deposit':
      store.player.gold -= depAmount.value
      bank.deposit = depAmount.value
      bank.maturityDay = store.world.day + depDays.value
      bank.dailyRate = depDailyRate.value
      bank.loan = 0
      bank.loanRepay = 0
      break
    case 'loan':
      store.player.gold += loanAmount.value
      bank.loan = loanAmount.value
      bank.maturityDay = store.world.day + loanDays
      bank.dailyRate = loanDailyRate
      bank.loanRepay = loanRepayAmount.value
      bank.deposit = 0
      break
    case 'withdraw':
      const withdrawAmount = matured.value ? depositMaturityAmount.value : bank.deposit
      store.player.gold += withdrawAmount
      bank.deposit = 0
      bank.maturityDay = null
      bank.dailyRate = null
      break
    case 'repay':
      store.player.gold -= repayAmount.value
      bank.loan = 0
      bank.maturityDay = null
      bank.dailyRate = null
      bank.loanRepay = 0
      break
  }
  store.save()
  showConfirm.value = false
}
</script>

<style scoped>
/* 保持与之前完全相同的样式，此处略，确保不拥挤 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 200; }
.panel { width: 480px; max-width: 90vw; max-height: 90vh; background: rgba(15,25,45,0.9); backdrop-filter: blur(20px); border: 2px solid #b89a6a; border-radius: 24px; padding: 24px; color: #ffd; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
.info-card { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; font-size: 10px; display: flex; flex-direction: column; gap: 8px; }
.empty-state { text-align: center; opacity: 0.7; padding: 20px; }
.empty-icon { font-size: 36px; margin-bottom: 8px; }
.matured { color: #4caf50; font-weight: bold; }
.tab-switch { display: flex; gap: 10px; justify-content: center; }
.tab-switch .pixel-btn.active { background: rgba(255,215,0,0.2); }
.form { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.input-row { display: flex; align-items: center; gap: 10px; }
.input-row label { font-size: 10px; width: 60px; }
.pixel-input { background: #1a2a3a; border: 1px solid #b89a6a; color: #ffd; padding: 6px 10px; font-family: 'Press Start 2P'; font-size: 10px; width: 120px; }
select.pixel-input { width: 130px; }
.max-loan { font-size: 8px; opacity: 0.8; }
.rate-display { font-size: 8px; background: rgba(255,215,0,0.1); padding: 6px 10px; border-radius: 8px; }
.pixel-btn.primary { background: rgba(255,215,0,0.15); }
.close-btn { width: 100%; }
.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 400; }
.confirm-box { background: rgba(15,25,45,0.95); padding: 20px; border-radius: 16px; text-align: center; font-size: 11px; }
.confirm-actions { display: flex; justify-content: center; gap: 15px; margin-top: 15px; }
</style>