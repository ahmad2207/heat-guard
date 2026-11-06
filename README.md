# HeatGuard AI

Privacy-first heat-risk warning Progressive Web App (PWA) for outdoor workers and supervisors.

## Stack

- React: Declarative component model for building accessible and reactive interfaces.
- TypeScript (strict mode): Type safety catching errors early across worker and supervisor workflows.
- Vite: Fast local development server and optimized rollup bundling for production.
- Tailwind CSS v4: Utility-first styling via the official Vite plugin for minimal CSS output.
- vite-plugin-pwa: Zero-config service worker generation and Web App Manifest handling for offline support.

## Getting Started

### Prerequisites

- Node.js (v20 or newer recommended)
- npm (v10 or newer)

### Installation

```bash
npm install
```

### Running Locally

To run the standard development server (PWA features disabled by default):

```bash
npm run dev
```

To run the development server with PWA and service worker registration enabled:

On Linux / macOS:

```bash
DEV_PWA=true npm run dev
```

On Windows PowerShell:

```powershell
$env:DEV_PWA="true"; npm run dev
```

### Building for Production

Type-check and build the production bundle:

```bash
npm run build
```

This compiles TypeScript, generates Tailwind CSS, bundles the application into `dist/`, and generates `dist/sw.js` and `dist/manifest.webmanifest`.

### Previewing Production Build

Preview the production build locally:

```bash
npm run preview
```

Open the preview URL in your browser to verify PWA registration and offline caching.

## Deploying to Vercel from GitHub

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel automatically detects Vite:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **Deploy**. Single-page app routing is handled automatically via `vercel.json`.

## Testing on a Mobile Phone (Android)

1. Open the deployed Vercel URL in Chrome on your Android device.
2. When prompted by the browser banner, tap **Install app** or open the Chrome menu (three dots) and tap **Add to Home screen**.
3. Launch HeatGuard AI directly from your phone home screen.
4. Verify that the app opens in standalone mode without browser address bar chrome.
5. Turn on **Airplane mode** on your phone (disconnecting Wi-Fi and mobile data).
6. Close and reopen the app from your home screen. Confirm the app shell loads completely offline and displays the "Offline" connection status.

## Checking PWA in Chrome DevTools

1. Open your browser and navigate to the local preview or production URL.
2. Open DevTools (press `F12` or right-click and choose **Inspect**).
3. Switch to the **Application** tab in DevTools:
   - **Manifest section**: Verify the app name ("HeatGuard AI"), short name ("HeatGuard"), start URL (`/`), theme color (`#E8742A`), background color (`#EEF1F3`), and that all icon sizes (192x192, 512x512, and maskable) load without errors.
   - **Service Workers section**: Verify that the service worker from `/sw.js` is active and running. Check the **Offline** checkbox and refresh the page to simulate offline mode and confirm the app shell reloads successfully.
