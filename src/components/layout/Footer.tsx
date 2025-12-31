import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
    return (
        <footer className="bg-muted/30 py-12 border-t border-border mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="mb-4">
                            <Logo size="lg" showText={true} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            As melhores acompanhantes, perto de você e disponíveis agora.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/golpes" className="hover:text-primary transition-colors">⚠️ Alertas sobre Golpes</Link></li>
                            <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                            <li><Link to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            All advertisers on this site are over the age of 18.
                            acompanhantesAGORA is a platform for adults only.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} acompanhantesAGORA. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
