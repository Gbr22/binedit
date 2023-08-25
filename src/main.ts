import './assets/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import { initShortCuts } from './shortCuts'

createApp(App).mount('#app')

initShortCuts();