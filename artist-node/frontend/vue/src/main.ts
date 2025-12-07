import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Global CSS - base variables + theme overrides
import '@awake/css-core/base.css'
import '@awake/css-core/themes/dark.css'
import '@awake/css-core/themes/vapor.css'
import '@awake/css-core/themes/crt.css'
import '@awake/css-core/themes/minimal.css'

// Visual effects
import '@awake/css-core/effects/fx-crt-scanlines.css'
import '@awake/css-core/effects/fx-glow.css'
import '@awake/css-core/effects/fx-film-grain.css'
import '@awake/css-core/effects/fx-crt-chromatic-aberration.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
