import { createApp } from 'vue'
import App from './App.vue'

// No router, deliberately: ADR-0003's Explicitation records it as a stated
// assumption. A Wordle is one screen, and vue-router on a static host also
// drags in the 404-fallback trick — complexity bought for nothing here.
createApp(App).mount('#app')
