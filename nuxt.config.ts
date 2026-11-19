import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const ignoredDirs = [
  'AppData',
  'Application Data',
  'Contacts',
  'Cookies',
  'Desktop',
  'Documents',
  'Downloads',
  'Favorites',
  'Links',
  'Local Settings',
  'Music',
  'My Documents',
  'NetHood',
  'OneDrive',
  'Pictures',
  'PrintHood',
  'Recent',
  'Saved Games',
  'Searches',
  'SendTo',
  'Start Menu',
  'Templates',
  'Videos',
  '.bun',
  '.cache',
  '.chromium-browser-snapshots',
  '.claude',
  '.config',
  '.copilot',
  '.data',
  '.docker',
  '.local',
  '.ms-ad',
  '.ssh',
  '.vscode',
  '.vscode-shared',
  'go',
  'go-install',
  'include',
  'Lib',
  'libs',
  'Scripts',
  'tcl',
]

const ignoredGlobs = ignoredDirs.map((dir) => `**/${dir}/**`)

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || '',
  },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  ignore: ignoredGlobs,
  app: {
    head: {
      title: 'CycleFuel — cycle-aware nutrition',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'CycleFuel helps you understand your nutritional needs through every phase of your menstrual cycle.',
        },
        { name: 'theme-color', content: '#FFFBF7' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap',
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  vite: {
    server: {
      watch: {
        ignored: ignoredGlobs,
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
})
