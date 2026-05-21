import { ref, computed, onMounted } from 'vue'

export function useReader() {
  const loading = ref(true)
  const error = ref('')
  const title = ref('')
  const fullText = ref('')
  const fontSize = ref(20)
  const bookmarks = ref([])

  const currentProgress = ref(0) // 0-100
  const isBookmarked = computed(() => bookmarks.value.includes(currentProgress.value))

  const changeFont = () => {
    const sizes = [16, 20, 24]
    const idx = sizes.indexOf(fontSize.value)
    fontSize.value = sizes[(idx + 1) % 3]
    saveProgress()
  }

  const toggleBookmark = () => {
    if (bookmarks.value.includes(currentProgress.value)) {
      bookmarks.value = bookmarks.value.filter(p => p !== currentProgress.value)
    } else {
      bookmarks.value.push(currentProgress.value)
    }
    saveProgress()
  }

  const STORAGE_KEY = 'reading-progress'
  const saveProgress = () => {
    const key = `${STORAGE_KEY}-${title.value}`
    localStorage.setItem(key, JSON.stringify({
      progress: currentProgress.value,
      fontSize: fontSize.value,
      bookmarks: bookmarks.value
    }))
  }

  const readingMode = ref('traditional') // 'traditional' | 'three-d'
  const toggleReadingMode = () => {
    readingMode.value = readingMode.value === 'traditional' ? 'three-d' : 'traditional'
    // 持久化
    localStorage.setItem('reading-mode', readingMode.value)
  }
  const restoreProgress = () => {
    const key = `${STORAGE_KEY}-${title.value}`
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        if (data.progress !== undefined) currentProgress.value = data.progress
        if (data.fontSize) fontSize.value = data.fontSize
        if (data.bookmarks) bookmarks.value = data.bookmarks
      } catch (e) { }
    }
  }



  onMounted (() => {const savedMode = localStorage.getItem('reading-mode')
if (savedMode) readingMode.value = savedMode
  })

  return {
    loading, error, title, fullText, fontSize, bookmarks,
    currentProgress, isBookmarked,readingMode,toggleReadingMode,
    changeFont, toggleBookmark,
    saveProgress, restoreProgress
  }
}