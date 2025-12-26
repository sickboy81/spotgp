import { AlertTriangle, Phone, Shield, Ban, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Golpes() {
    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                        <h1 className="text-4xl font-bold text-destructive">ALERTA !!!</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Informações importantes para sua segurança
                    </p>
                </div>

                {/* Section 1 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">1. NUNCA ENTRAREMOS EM CONTATO COM VOCÊ</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p className="text-lg font-semibold">
                            acompanhantesAGORA nunca entrará em contato com você, sob nenhuma circunstância.
                        </p>
                        <p>
                            A empresa de publicidade que gerencia acompanhantesAGORA tem uma trajetória de mais de 20 anos, e as anunciantes somente contratam anúncios no nosso site.
                        </p>
                        <p>
                            Todas as anunciantes trabalham por conta própria, e acompanhantesAGORA somente se limita a publicar os serviços que elas oferecem aos usuários.
                        </p>
                        <p>
                            acompanhantesAGORA nunca intervém na relação e acordos entre os usuários e as anunciantes do site.
                        </p>
                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mt-4">
                            <p className="font-semibold text-destructive">
                                Portanto, se como usuário você receber mensagens que dizem falar em nome de acompanhantesAGORA, não é verdade que elas tenham sido enviadas a você por nós.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Ban className="w-6 h-6 text-destructive" />
                        <h2 className="text-2xl font-bold text-foreground">2. GOLPES</h2>
                    </div>
                    <div className="space-y-4">
                        <p className="text-lg font-semibold text-foreground">
                            Conselhos a seguir para não levar um golpe ao contratar um serviço.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <span className="text-foreground">Não pague adiantado parte do serviço.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <span className="text-foreground">Não pague adiantado o taxi da anunciante.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <span className="text-foreground">Não compre conteúdo digital se dizem que é uma condição obrigatória antes de poder ter um serviço presencial.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                        <h2 className="text-2xl font-bold text-foreground">3. AMEAÇAS</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p className="text-lg font-semibold">
                            Ameaças para que você pague dinheiro como compensação ou extorsão.
                        </p>
                        <div className="space-y-3">
                            <p>
                                Pedem a você uma compensação por ter feito as anunciantes perderem tempo, porque você entrou em contato com elas e, finalmente, acabou não contratando o serviço.
                            </p>
                            <p>
                                Te extorquem para não publicar os prints das suas conversas com as anunciantes nas suas redes sociais ou para não enviá-las aos seus familiares.
                            </p>
                        </div>
                        <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4 mt-4">
                            <p>
                                Em ambos os casos, supostos encarregados ou criminosos te ameaçam por meio de ligações, textos, áudios e imagens muito violentas e, inclusive, podem dizer que têm seus dados pessoais.
                            </p>
                        </div>
                        <div className="bg-primary/10 border-l-4 border-primary rounded-lg p-4 mt-4">
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-primary mb-1">
                                        Se você recebeu ameaças, ou levou um golpe, ou foi extorquido:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-foreground">
                                        <li>Entre em contato conosco para poder bloquear o anúncio</li>
                                        <li>Imediatamente, denuncie os autores às autoridades</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <div className="text-center mt-8">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Voltar para a página inicial
                    </Link>
                </div>
            </div>
        </div>
    );
}

