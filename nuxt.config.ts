import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // เลี่ยงชนกับแอปอื่นบนเครื่องที่ใช้ port 3000 (เช่น docker ของโปรเจกต์อื่น)
  devServer: { port: 3007 },
  modules: [
    'nuxt-auth-utils',
    '@nuxt/eslint'
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['vue'],
    },
  },
  build: {
    transpile: ['@lucide/vue'],
  },
})
