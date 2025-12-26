import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './utils/pwa'

// Registrar Service Worker para PWA (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Aguarda o carregamento da página antes de registrar
  window.addEventListener('load', () => {
    registerServiceWorker().catch((error) => {
      console.error('[PWA] Erro ao registrar service worker:', error);
    });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Em desenvolvimento, desregistra qualquer service worker existente
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('[PWA] Service Worker desregistrado (modo desenvolvimento)');
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
