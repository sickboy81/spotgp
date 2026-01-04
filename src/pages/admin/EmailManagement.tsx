import { useState } from 'react';
import { Mail, Send, MessageSquare, Plus, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    type: 'welcome' | 'verification' | 'notification' | 'promotional' | 'custom';
    created_at: string;
}

interface BulkEmail {
    id: string;
    subject: string;
    recipients: number;
    sent: number;
    failed: number;
    status: 'draft' | 'sending' | 'sent' | 'failed';
    created_at: string;
}

export default function EmailManagement() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [bulkEmails] = useState<BulkEmail[]>([]);
    const [activeTab, setActiveTab] = useState<'templates' | 'send' | 'history'>('templates');

    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        subject: '',
        body: '',
        type: 'custom' as EmailTemplate['type'],
    });

    const handleSaveTemplate = () => {
        if (editingTemplate) {
            // Update existing template
            setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...editingTemplate, ...templateForm } as EmailTemplate : t));
        } else {
            // Create new template
            const newTemplate: EmailTemplate = {
                id: `template_${Date.now()}`,
                ...templateForm,
                created_at: new Date().toISOString(),
            };
            setTemplates([...templates, newTemplate]);
        }
        setShowTemplateForm(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject: '', body: '', type: 'custom' });
    };

    const handleEditTemplate = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setTemplateForm({
            name: template.name,
            subject: template.subject,
            body: template.body,
            type: template.type,
        });
        setShowTemplateForm(true);
    };

    const handleDeleteTemplate = (id: string) => {
        if (confirm('Tem certeza que deseja deletar este template?')) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    const handleSendBulkEmail = () => {
        // TODO: Implement bulk email sending
        alert('Funcionalidade de envio em massa será implementada');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Email</h1>
                    <p className="text-muted-foreground mt-1">
                        Templates de email e envio em massa
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('templates')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'templates'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Templates
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('send')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'send'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Enviar Email
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'history'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Histórico
                    </div>
                </button>
            </div>

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setEditingTemplate(null);
                                setTemplateForm({ name: '', subject: '', body: '', type: 'custom' });
                                setShowTemplateForm(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Template
                        </button>
                    </div>

                    {showTemplateForm && (
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4">
                                {editingTemplate ? 'Editar Template' : 'Novo Template'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome do Template</label>
                                    <input
                                        type="text"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Ex: Email de Boas-vindas"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo</label>
                                    <select
                                        value={templateForm.type}
                                        onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as EmailTemplate['type'] })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        aria-label="Tipo de template"
                                    >
                                        <option value="welcome">Boas-vindas</option>
                                        <option value="verification">Verificação</option>
                                        <option value="notification">Notificação</option>
                                        <option value="promotional">Promocional</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Assunto</label>
                                    <input
                                        type="text"
                                        value={templateForm.subject}
                                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Assunto do email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Corpo do Email</label>
                                    <textarea
                                        value={templateForm.body}
                                        onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none h-48"
                                        placeholder="Conteúdo do email (suporta HTML)"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use {'{nome}'}, {'{email}'}, etc. para variáveis dinâmicas
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowTemplateForm(false);
                                            setEditingTemplate(null);
                                            setTemplateForm({ name: '', subject: '', body: '', type: 'custom' });
                                        }}
                                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveTemplate}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template) => (
                            <div key={template.id} className="bg-card border border-border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-bold">{template.name}</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {template.type === 'welcome' && 'Boas-vindas'}
                                            {template.type === 'verification' && 'Verificação'}
                                            {template.type === 'notification' && 'Notificação'}
                                            {template.type === 'promotional' && 'Promocional'}
                                            {template.type === 'custom' && 'Personalizado'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditTemplate(template)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                            aria-label="Editar template"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                            aria-label="Deletar template"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm font-medium mb-1">{template.subject}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{template.body}</p>
                            </div>
                        ))}
                    </div>
                    {templates.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum template criado. Clique em "Novo Template" para começar.
                        </div>
                    )}
                </div>
            )}

            {/* Send Tab */}
            {activeTab === 'send' && (
                <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Enviar Email em Massa</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Selecionar Template</label>
                            <select
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                aria-label="Selecionar template"
                            >
                                <option value="">Selecione um template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Destinatários</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <span>Todos os usuários</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <span>Apenas anunciantes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <span>Usuários verificados</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <span>Usuários não verificados</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Assunto (opcional - sobrescreve template)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Deixe em branco para usar o assunto do template"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mensagem (opcional - sobrescreve template)</label>
                            <textarea
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none h-32"
                                placeholder="Deixe em branco para usar o corpo do template"
                            />
                        </div>
                        <button
                            onClick={handleSendBulkEmail}
                            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Enviar Email em Massa
                        </button>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Assunto</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Destinatários</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Enviados</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Falhas</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bulkEmails.map((email) => (
                                    <tr key={email.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{email.subject}</td>
                                        <td className="px-4 py-3 text-sm">{email.recipients}</td>
                                        <td className="px-4 py-3 text-sm text-green-600">{email.sent}</td>
                                        <td className="px-4 py-3 text-sm text-red-600">{email.failed}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-1 text-xs font-medium rounded",
                                                email.status === 'sent' && "bg-green-500/20 text-green-600",
                                                email.status === 'sending' && "bg-yellow-500/20 text-yellow-600",
                                                email.status === 'failed' && "bg-red-500/20 text-red-600",
                                                email.status === 'draft' && "bg-muted text-muted-foreground"
                                            )}>
                                                {email.status === 'sent' && 'Enviado'}
                                                {email.status === 'sending' && 'Enviando'}
                                                {email.status === 'failed' && 'Falhou'}
                                                {email.status === 'draft' && 'Rascunho'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(email.created_at).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {bulkEmails.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum email enviado ainda
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}







