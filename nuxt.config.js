export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Fun dPool',
    htmlAttrs: {
      lang: 'en',
    },
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ['~/assets/styles/main.scss'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/web3Modal.js', mode: 'client' },
    { src: '~/plugins/web3.js', mode: 'client' },
    { src: '~/plugins/nft-storage-client.js', mode: 'client' },
    { src: '~/plugins/nft-storage-file.js', mode: 'client' },
    { src: '~/plugins/vue-particles.js', mode: 'client' },
    { src: '~/plugins/typeit.js', mode: 'client' },
    // { src: '~/plugins/vuex-persist', mode: 'client' },
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    '@nuxtjs/pwa',
    '@nuxtjs/device',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/buefy
    'nuxt-buefy',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  publicRuntimeConfig: {
    nftStorageAPIKey: process.env.NFT_STORAGE_API_KEY,
  },

  // https://pwa.nuxtjs.org/
  // pwa: {
  //   manifest: {
  //     name: 'Fun dPool',
  //     short_name: 'fpd',
  //   },
  //   meta: {
  //     mobileAppIOS: true,
  //     appleStatusBarStyle: 'black-translucent',
  //     nativeUI: true,
  //   },
  // },
}
