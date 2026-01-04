import { X, Download, Share2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
  const {
    canInstall,
    isInstalled,
    showPrompt,
    installInstructions,
    handleInstallClick,
    dismissPrompt,
    isIOS,
    isAndroid,
  } = usePWAInstall();

  // Não mostra se já está instalado ou não pode instalar
  if (isInstalled || !showPrompt || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Instalar App</h3>
              <p className="text-sm text-muted-foreground">
                Tenha acesso rápido e fácil
              </p>
            </div>
          </div>
          <button
            onClick={dismissPrompt}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instruções para iOS */}
        {isIOS && installInstructions && (
          <div className="space-y-3">
            <p className="text-sm text-foreground font-medium">
              Para instalar no iOS:
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {installInstructions.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-semibold mt-0.5">
                    {instruction.split('.')[0]}.
                  </span>
                  <span>{instruction.split('.').slice(1).join('.').trim()}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Share2 className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Use o botão de compartilhar no Safari e selecione "Adicionar à Tela de Início"
              </p>
            </div>
          </div>
        )}

        {/* Botão de instalação para Android */}
        {isAndroid && !isIOS && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Instale o app para ter acesso rápido, funcionar offline e receber notificações.
            </p>
            <button
              onClick={handleInstallClick}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3",
                "bg-primary text-primary-foreground rounded-lg font-semibold",
                "hover:bg-primary/90 transition-colors",
                "shadow-lg shadow-primary/20"
              )}
            >
              <Download className="w-5 h-5" />
              Instalar Agora
            </button>
          </div>
        )}

        {/* Instruções genéricas se não for iOS nem Android */}
        {!isIOS && !isAndroid && installInstructions && (
          <div className="space-y-3">
            <p className="text-sm text-foreground font-medium">
              Para instalar:
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {installInstructions.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-semibold mt-0.5">
                    {instruction.split('.')[0]}.
                  </span>
                  <span>{instruction.split('.').slice(1).join('.').trim()}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={handleInstallClick}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3",
                "bg-primary text-primary-foreground rounded-lg font-semibold",
                "hover:bg-primary/90 transition-colors",
                "shadow-lg shadow-primary/20"
              )}
            >
              <Download className="w-5 h-5" />
              Tentar Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}






