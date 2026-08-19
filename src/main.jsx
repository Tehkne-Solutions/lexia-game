import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/styles/premium-game.css'

if (typeof document !== 'undefined') {
  document.documentElement.dataset.lexiaReleaseSha = import.meta.env.VITE_LEXIA_RELEASE_SHA || '';
  document.documentElement.dataset.lexiaBuildProvider = import.meta.env.VITE_LEXIA_BUILD_PROVIDER_MARKER || '';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
