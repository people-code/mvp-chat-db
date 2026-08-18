// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  // DATABASE_URL, OLLAMA_BASE_URL, OLLAMA_MODEL, APP_DOMAIN are server-only secrets/config,
  // read directly from process.env at request time in server/ code (not here) so that
  // container env vars set at `docker run`/compose time take effect without a rebuild.
  // Nuxt's runtimeConfig only picks up NUXT_-prefixed env vars at runtime, which would
  // require renaming these away from the plan's plain names.
  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Asistente de agendamiento'
    }
  }
})
