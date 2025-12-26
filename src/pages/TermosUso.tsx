import { FileText, Shield, User, Ban, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermosUso() {
    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold text-foreground">Termos de Uso</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {/* Section 1 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">1. Aceitação dos Termos</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Ao acessar e usar o site acompanhantesAGORA, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                            Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
                        </p>
                        <p>
                            Estes termos se aplicam a todos os visitantes, usuários e outras pessoas que acessam ou usam o serviço.
                        </p>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">2. Elegibilidade</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p className="font-semibold">Você deve ter pelo menos 18 anos de idade para usar este serviço.</p>
                        <p>
                            Ao usar o acompanhantesAGORA, você declara e garante que:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Você tem pelo menos 18 anos de idade</li>
                            <li>Você tem capacidade legal para celebrar contratos vinculativos</li>
                            <li>Você não está impedido de usar o serviço sob as leis aplicáveis</li>
                            <li>Você não foi anteriormente banido do serviço</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">3. Natureza do Serviço</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            O acompanhantesAGORA é uma plataforma de publicidade que permite que anunciantes independentes publiquem 
                            informações sobre seus serviços.
                        </p>
                        <div className="bg-muted/50 border-l-4 border-primary rounded-lg p-4">
                            <p className="font-semibold mb-2">Importante:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>acompanhantesAGORA não é parte de nenhum acordo entre usuários e anunciantes</li>
                                <li>acompanhantesAGORA não fornece, gerencia ou controla os serviços anunciados</li>
                                <li>acompanhantesAGORA apenas publica informações fornecidas pelos anunciantes</li>
                                <li>Os anunciantes trabalham de forma independente e são responsáveis por seus próprios serviços</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 4 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Ban className="w-6 h-6 text-destructive" />
                        <h2 className="text-2xl font-bold text-foreground">4. Conduta do Usuário</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p className="font-semibold">Você concorda em NÃO:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Usar o serviço para qualquer propósito ilegal ou não autorizado</li>
                            <li>Violar qualquer lei local, estadual, nacional ou internacional</li>
                            <li>Transmitir qualquer vírus, malware ou código malicioso</li>
                            <li>Tentar obter acesso não autorizado a qualquer parte do serviço</li>
                            <li>Interferir ou interromper o serviço ou servidores conectados ao serviço</li>
                            <li>Usar informações de contato para spam, assédio ou atividades fraudulentas</li>
                            <li>Falsificar ou manipular informações de perfil</li>
                            <li>Publicar conteúdo que seja difamatório, obsceno, ameaçador ou ofensivo</li>
                        </ul>
                    </div>
                </section>

                {/* Section 5 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Responsabilidades dos Anunciantes</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>Os anunciantes são totalmente responsáveis por:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>A veracidade e precisão das informações publicadas</li>
                            <li>O cumprimento de todas as leis e regulamentações aplicáveis</li>
                            <li>A prestação dos serviços anunciados</li>
                            <li>As relações contratuais com os usuários</li>
                            <li>O pagamento de todos os impostos e obrigações fiscais</li>
                        </ul>
                    </div>
                </section>

                {/* Section 6 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitação de Responsabilidade</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            O acompanhantesAGORA atua apenas como uma plataforma de publicidade e não se responsabiliza por:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Disputas entre usuários e anunciantes</li>
                            <li>A qualidade, segurança ou legalidade dos serviços oferecidos</li>
                            <li>A veracidade das informações publicadas pelos anunciantes</li>
                            <li>Danos diretos, indiretos, incidentais ou consequenciais resultantes do uso do serviço</li>
                            <li>Perdas financeiras ou outras decorrentes de transações entre usuários e anunciantes</li>
                        </ul>
                    </div>
                </section>

                {/* Section 7 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Propriedade Intelectual</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Todo o conteúdo do site, incluindo textos, gráficos, logos, ícones e software, 
                            é propriedade do acompanhantesAGORA ou de seus licenciadores e está protegido por leis de direitos autorais.
                        </p>
                        <p>
                            Você não pode reproduzir, distribuir, modificar ou criar trabalhos derivados 
                            sem autorização prévia por escrito.
                        </p>
                    </div>
                </section>

                {/* Section 8 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">8. Modificações dos Termos e do Serviço</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                            Alterações significativas serão comunicadas através do site.
                        </p>
                        <p>
                            O uso continuado do serviço após alterações constitui aceitação dos novos termos.
                        </p>
                        <div className="bg-muted/50 border-l-4 border-primary rounded-lg p-4 mt-4">
                            <p className="font-semibold mb-2">Direito de Alteração do Serviço:</p>
                            <p>
                                O acompanhantesAGORA se reserva o direito de alterar, modificar, suspender ou descontinuar 
                                qualquer aspecto do serviço, incluindo mas não limitado a:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                                <li>Funcionalidades e recursos do site</li>
                                <li>Planos de assinatura, pacotes de créditos e preços</li>
                                <li>Forma de uso, regras e políticas</li>
                                <li>Disponibilidade de recursos e serviços</li>
                                <li>Interface, design e experiência do usuário</li>
                                <li>Métodos de pagamento aceitos</li>
                            </ul>
                            <p className="mt-3">
                                Essas alterações podem ser feitas a qualquer tempo, com ou sem aviso prévio, 
                                e não geram direito a reembolso ou compensação, exceto quando expressamente previsto 
                                em contrato específico ou exigido por lei.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 9 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. Encerramento</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, 
                            sem aviso prévio, por violação destes termos ou por qualquer outra razão a nosso critério.
                        </p>
                    </div>
                </section>

                {/* Section 10 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">10. Lei Aplicável</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida 
                            nos tribunais competentes do Brasil.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Contato</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através 
                            dos canais de atendimento disponíveis no site.
                        </p>
                    </div>
                </section>

                {/* Footer CTA */}
                <div className="text-center mt-8 space-x-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Voltar para a página inicial
                    </Link>
                    <Link
                        to="/privacidade"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                    >
                        Política de Privacidade
                    </Link>
                </div>
            </div>
        </div>
    );
}

