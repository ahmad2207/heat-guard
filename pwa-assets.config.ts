import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  head: {
    entrypoint: true,
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      resizeOptions: {
        background: '#fafaf9',
      },
    },
    apple: {
      sizes: [180],
      resizeOptions: {
        background: '#fafaf9',
      },
    },
  },
  images: ['public/logo.svg'],
})
