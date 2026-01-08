import { useState, useEffect } from 'react';
import { isIOS, isAndroid, isStandalone, supportsPWAInstall, getInstallInstructions } from '@/utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installInstructions, setInstallInstructions] = useState<ReturnType<typeof getInstallInstructions> | null>(null);

  useEffect(() => {
    // Verifica se já está instalado
    setIsInstalled(isStandalone());

    // Detecta evento beforeinstallprompt (Chrome/Edge Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Detecta se o app foi instalado
    const handleAppInstalled = () => {
      console.log('[PWA] App instalado');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Para iOS, mostra instruções se não estiver instalado
    if (isIOS() && !isStandalone()) {
      setInstallInstructions(getInstallInstructions());
      setShowPrompt(true);
    }

    // Para Android, verifica se pode mostrar prompt
    if (isAndroid() && !isStandalone() && supportsPWAInstall()) {
      // O prompt será mostrado quando beforeinstallprompt for disparado
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS ou navegador sem suporte - mostra instruções
      if (isIOS() || !deferredPrompt) {
        setInstallInstructions(getInstallInstructions());
        setShowPrompt(true);
      }
      return;
    }

    try {
      // Mostra o prompt de instalação
      await deferredPrompt.prompt();
      
      // Aguarda a escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou a instalação');
        setIsInstalled(true);
      } else {
        console.log('[PWA] Usuário rejeitou a instalação');
      }
      
      // Limpa o prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Erro ao instalar:', error);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  return {
    canInstall: deferredPrompt !== null || (isIOS() && !isInstalled),
    isInstalled,
    showPrompt,
    installInstructions,
    handleInstallClick,
    dismissPrompt,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
  };
}








