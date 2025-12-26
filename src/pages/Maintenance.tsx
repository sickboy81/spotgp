import { Wrench, Clock, AlertCircle } from 'lucide-react';
import { getMaintenanceMode } from '@/lib/utils/maintenance';
import { Logo } from '@/components/ui/Logo';

export default function Maintenance() {
    const maintenance = getMaintenanceMode();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo size="lg" />
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                        <div className="relative bg-primary/10 p-8 rounded-full border-4 border-primary/30">
                            <Wrench className="w-16 h-16 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold font-serif text-foreground">
                        Site em Manutenção
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5" />
                        <p className="text-lg">Estamos trabalhando para melhorar sua experiência</p>
                    </div>
                </div>

                {/* Message */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div className="text-left space-y-2">
                            <p className="text-lg font-medium text-foreground">
                                {maintenance.message}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Pedimos desculpas pelo inconveniente. Estaremos de volta em breve!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} ACOMPANHANTES AGORA. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
}

