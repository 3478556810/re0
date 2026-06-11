import { playCachedVoice } from '@/composables/useBattleAudio'
export const playVoice = (monsterId, action) => playCachedVoice(monsterId, action)