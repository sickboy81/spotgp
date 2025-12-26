import { Lock, Eye, Shield, Database, UserX, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacidade() {
    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold text-foreground">Política de Privacidade</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {/* Section 1 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Eye className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">1. Introdução</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            A acompanhantesAGORA ("nós", "nosso" ou "empresa") respeita sua privacidade e está comprometida 
                            em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, 
                            usamos e protegemos suas informações quando você usa nosso serviço.
                        </p>
                        <p>
                            Ao usar o acompanhantesAGORA, você concorda com a coleta e uso de informações de acordo com esta política.
                        </p>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">2. Informações que Coletamos</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <h3 className="text-lg font-semibold">2.1 Informações que você nos fornece:</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Nome de exibição ou nome artístico</li>
                            <li>Endereço de e-mail</li>
                            <li>Número de telefone (quando fornecido)</li>
                            <li>Informações de perfil (idade, localização, descrição, etc.)</li>
                            <li>Fotos e vídeos</li>
                            <li>Informações de pagamento (processadas por terceiros seguros)</li>
                        </ul>

                        <h3 className="text-lg font-semibold mt-6">2.2 Informações coletadas automaticamente:</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Endereço IP</li>
                            <li>Tipo de navegador e versão</li>
                            <li>Páginas visitadas e tempo de permanência</li>
                            <li>Data e hora de acesso</li>
                            <li>Dispositivo usado (desktop, mobile, tablet)</li>
                            <li>Localização aproximada (quando permitida)</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">3. Como Usamos suas Informações</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>Utilizamos as informações coletadas para:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Fornecer e manter nosso serviço</li>
                            <li>Processar e publicar anúncios</li>
                            <li>Melhorar e personalizar sua experiência</li>
                            <li>Comunicar-nos com você sobre o serviço</li>
                            <li>Enviar notificações importantes</li>
                            <li>Prevenir fraudes e garantir segurança</li>
                            <li>Cumprir obrigações legais</li>
                            <li>Analisar uso do site para melhorias</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Compartilhamento de Informações</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p className="font-semibold">NÃO vendemos seus dados pessoais. Podemos compartilhar informações apenas em situações limitadas:</p>
                        
                        <h3 className="text-lg font-semibold mt-4">4.1 Informações públicas no perfil:</h3>
                        <p>
                            Informações publicadas no perfil (nome, fotos, descrição) são visíveis publicamente 
                            para outros usuários do site.
                        </p>

                        <h3 className="text-lg font-semibold mt-4">4.2 Prestadores de serviços:</h3>
                        <p>
                            Podemos compartilhar dados com prestadores de serviços confiáveis que nos ajudam 
                            a operar o site (hospedagem, processamento de pagamentos, análise de dados), 
                            sujeitos a acordos de confidencialidade.
                        </p>

                        <h3 className="text-lg font-semibold mt-4">4.3 Requisitos legais:</h3>
                        <p>
                            Podemos divulgar informações se exigido por lei, ordem judicial ou processo legal, 
                            ou para proteger nossos direitos, propriedade ou segurança.
                        </p>
                    </div>
                </section>

                {/* Section 5 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Segurança dos Dados</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger 
                            seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
                        </p>
                        <div className="bg-muted/50 border-l-4 border-primary rounded-lg p-4">
                            <p className="font-semibold mb-2">Medidas de segurança incluem:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Criptografia de dados sensíveis</li>
                                <li>Firewalls e sistemas de segurança</li>
                                <li>Acesso restrito a dados pessoais</li>
                                <li>Monitoramento regular de segurança</li>
                                <li>Backups regulares</li>
                            </ul>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No entanto, nenhum método de transmissão pela internet ou armazenamento eletrônico 
                            é 100% seguro. Embora nos esforcemos para proteger seus dados, não podemos garantir 
                            segurança absoluta.
                        </p>
                    </div>
                </section>

                {/* Section 6 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Seus Direitos (LGPD)</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Confirmar a existência de tratamento:</strong> Verificar se tratamos seus dados</li>
                            <li><strong>Acessar dados:</strong> Obter cópia dos dados que temos sobre você</li>
                            <li><strong>Corrigir dados:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
                            <li><strong>Anonimizar ou eliminar:</strong> Solicitar anonimização ou eliminação de dados desnecessários</li>
                            <li><strong>Portabilidade:</strong> Solicitar portabilidade dos dados para outro serviço</li>
                            <li><strong>Revogar consentimento:</strong> Revogar seu consentimento a qualquer momento</li>
                            <li><strong>Informar sobre compartilhamento:</strong> Ser informado sobre compartilhamento com terceiros</li>
                        </ul>
                        <p>
                            Para exercer seus direitos, entre em contato conosco através dos canais de atendimento disponíveis.
                        </p>
                    </div>
                </section>

                {/* Section 7 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies e Tecnologias Similares</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso 
                            do site e personalizar conteúdo.
                        </p>
                        <p>
                            Você pode configurar seu navegador para recusar cookies, mas isso pode afetar 
                            a funcionalidade do site.
                        </p>
                    </div>
                </section>

                {/* Section 8 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <UserX className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">8. Retenção de Dados</h2>
                    </div>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir os propósitos 
                            descritos nesta política, a menos que um período de retenção mais longo seja exigido 
                            ou permitido por lei.
                        </p>
                        <p>
                            Quando você encerra sua conta, excluímos ou anonimizamos seus dados pessoais, 
                            exceto quando a retenção for necessária para cumprir obrigações legais.
                        </p>
                    </div>
                </section>

                {/* Section 9 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. Privacidade de Menores</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4">
                            <p className="font-semibold text-destructive">
                                Nosso serviço é estritamente para pessoas com 18 anos ou mais.
                            </p>
                        </div>
                        <p>
                            Não coletamos intencionalmente dados pessoais de menores de 18 anos. 
                            Se descobrirmos que coletamos dados de um menor, tomaremos medidas para 
                            excluir essas informações imediatamente.
                        </p>
                    </div>
                </section>

                {/* Section 10 */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">10. Alterações nesta Política</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Podemos atualizar esta Política de Privacidade periodicamente. 
                            Notificaremos sobre mudanças significativas publicando a nova política 
                            nesta página e atualizando a data de "última atualização".
                        </p>
                        <p>
                            Recomendamos que você revise esta política periodicamente para se manter 
                            informado sobre como protegemos suas informações.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Contato</h2>
                    <div className="space-y-4 text-foreground leading-relaxed">
                        <p>
                            Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como 
                            tratamos seus dados pessoais, entre em contato conosco através dos 
                            canais de atendimento disponíveis no site.
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
                        to="/termos"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                    >
                        Termos de Uso
                    </Link>
                </div>
            </div>
        </div>
    );
}

