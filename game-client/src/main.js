import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import 'primevue/resources/themes/lara-dark-blue/theme.css'
import 'primevue/resources/primevue.css'
import 'primeicons/primeicons.css'
import 'uno.css'
const app = createApp(App)
app.use(createPinia())
app.mount('#app')