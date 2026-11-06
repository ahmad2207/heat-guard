import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// The logo is a full-bleed dark square with the thermometer already inside the
// maskable safe zone, so maskable and Apple icons need no extra padding. The
// background fills the logo's rounded corners with the same ink colour.
export default defineConfig({
  head: {
    entrypoint: true,
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: {
        background: '#14181D',
      },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: {
        background: '#14181D',
      },
    },
  },
  images: ['public/logo.svg'],
})
