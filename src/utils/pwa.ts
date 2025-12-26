// Utilitários para PWA

/**
 * Detecta se o usuário está em um dispositivo iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detecta se o usuário está em um dispositivo Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Detecta se o app está rodando em modo standalone (instalado)
 */
export function isStandalone(): boolean {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Detecta se o navegador suporta service workers
 */
export function supportsServiceWorker(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Detecta se o navegador suporta instalação de PWA
 */
export function supportsPWAInstall(): boolean {
  // Chrome/Edge
  if ((window as any).deferredPrompt) {
    return true;
  }
  
  // iOS Safari não suporta beforeinstallprompt, mas pode ser instalado manualmente
  if (isIOS() && !isStandalone()) {
    return true; // Pode ser instalado, mas manualmente
  }
  
  return false;
}

/**
 * Obtém instruções de instalação baseadas na plataforma
 */
export function getInstallInstructions(): {
  platform: 'ios' | 'android' | 'other';
  instructions: string[];
} {
  if (isIOS()) {
    return {
      platform: 'ios',
      instructions: [
        '1. Toque no botão de compartilhar (ícone de caixa com seta)',
        '2. Role para baixo e selecione "Adicionar à Tela de Início"',
        '3. Toque em "Adicionar" no canto superior direito',
        '4. O app aparecerá na sua tela inicial'
      ]
    };
  }
  
  if (isAndroid()) {
    return {
      platform: 'android',
      instructions: [
        '1. Toque no menu (três pontos) no canto superior direito',
        '2. Selecione "Adicionar à tela inicial" ou "Instalar app"',
        '3. Confirme a instalação',
        '4. O app aparecerá na sua tela inicial'
      ]
    };
  }
  
  return {
    platform: 'other',
    instructions: [
      '1. Procure pelo ícone de instalação na barra de endereços',
      '2. Clique em "Instalar" ou "Adicionar à tela inicial"',
      '3. Siga as instruções do navegador'
    ]
  };
}

/**
 * Registra o service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!supportsServiceWorker()) {
    console.warn('[PWA] Service Workers não são suportados neste navegador');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

    // Verifica atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Novo service worker disponível
            console.log('[PWA] Nova versão disponível');
            // Pode disparar notificação para o usuário atualizar
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Verifica se há atualização disponível do service worker
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!supportsServiceWorker()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('[PWA] Erro ao verificar atualizações:', error);
    return false;
  }
}


