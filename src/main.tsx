import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'

import { AppProviders } from './app/providers'
import { router } from './app/router'
import './styles/globals.css'

const rootElement = document.getElementById('root') as HTMLDivElement | null

if (!rootElement) {
  throw new Error('Root element #root not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}
