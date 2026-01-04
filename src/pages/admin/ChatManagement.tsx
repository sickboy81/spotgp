import { useState, useEffect } from 'react';
import { MessageSquare, Search, AlertTriangle, Loader2, User, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { directus } from '@/lib/directus';
import { readItems, deleteItem } from '@directus/sdk';
import { getAllConversations, getConversationMessages } from '@/lib/api/messages';

interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    participant1_name?: string;
    participant2_name?: string;
    message_count?: number;
    unread_count?: number;
    last_message?: string;
    last_message_at?: string | null;
    date_created?: string;
    date_updated?: string;
    created?: string; // fallback
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name?: string;
    content: string;
    is_read: boolean;
    date_created: string;
    date_updated: string;
    created?: string; // fallback
}

export default function ChatManagement() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnread, setFilterUnread] = useState(false);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            // Get all conversations using API function
            const data = await getAllConversations();

            // Get profile names for participants
            const conversationsWithNames = await Promise.all(
                (data || []).map(async (conv) => {
                    try {
                        let p1Name = 'Usuário desconhecido';
                        let p2Name = 'Usuário desconhecido';

                        try {
                            const p1 = await directus.request(readItems('profiles', {
                                filter: { id: { _eq: conv.participant1_id } },
                                fields: ['display_name'],
                                limit: 1
                            }));
                            if (p1[0]) p1Name = p1[0].display_name || p1Name;
                        } catch { /* ignore */ }

                        try {
                            const p2 = await directus.request(readItems('profiles', {
                                filter: { id: { _eq: conv.participant2_id } },
                                fields: ['display_name'],
                                limit: 1
                            }));
                            if (p2[0]) p2Name = p2[0].display_name || p2Name;
                        } catch { /* ignore */ }

                        // Count messages
                        let messageCount = 0;
                        try {
                            const messagesResult = await directus.request(readItems('messages', {
                                filter: { conversation_id: { _eq: conv.id } },
                                aggregate: { count: '*' }
                            }));
                            messageCount = Number((messagesResult as any)[0]?.count || 0);
                        } catch { /* ignore */ }

                        // Count unread messages
                        let unreadCount = 0;
                        try {
                            const unreadResult = await directus.request(readItems('messages', {
                                filter: {
                                    conversation_id: { _eq: conv.id },
                                    is_read: { _eq: false }
                                },
                                aggregate: { count: '*' }
                            }));
                            unreadCount = Number((unreadResult as any)[0]?.count || 0);
                        } catch { /* ignore */ }

                        return {
                            ...conv,
                            participant1_name: p1Name,
                            participant2_name: p2Name,
                            message_count: messageCount,
                            unread_count: unreadCount,
                            created: conv.date_created, // Map for UI consistency if needed
                        };
                    } catch (err) {
                        console.error('Error processing conversation:', err);
                        return {
                            ...conv,
                            participant1_name: 'Usuário desconhecido',
                            participant2_name: 'Usuário desconhecido',
                            message_count: 0,
                            unread_count: 0,
                            created: conv.date_created,
                        };
                    }
                })
            );

            setConversations(conversationsWithNames);
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        setMessagesLoading(true);
        try {
            const messagesData = await getConversationMessages(conversationId, 500); // Get up to 500 messages

            // Get sender names if not present
            const messagesWithNames = await Promise.all(
                messagesData.map(async (msg) => {
                    try {
                        let senderName = msg.sender?.display_name || 'Usuário desconhecido';

                        // If sender name is missing but we have sender_id, try to fetch
                        if ((!msg.sender?.display_name || msg.sender?.display_name === 'Usuário desconhecido') && msg.sender_id) {
                            try {
                                const sender = await directus.request(readItems('profiles', {
                                    filter: { id: { _eq: msg.sender_id } },
                                    fields: ['display_name'],
                                    limit: 1
                                }));
                                if (sender[0]) senderName = sender[0].display_name || senderName;
                            } catch { /* ignore */ }
                        }

                        return {
                            ...msg,
                            sender_name: senderName,
                            created: msg.date_created // Map for UI
                        };
                    } catch {
                        return {
                            ...msg,
                            sender_name: msg.sender?.display_name || 'Usuário desconhecido',
                            created: msg.date_created
                        };
                    }
                })
            );

            setMessages(messagesWithNames as unknown as Message[]);
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleDeleteConversation = async (conversationId: string) => {
        if (!confirm('Tem certeza que deseja deletar esta conversa? Todas as mensagens serão removidas permanentemente.')) return;

        try {
            // Delete all messages first
            // We need to fetch all message IDs first then delete them loop or use deleteItems if supported (Directus deleteItems takes array of IDs)
            // Or just delete conversation if cascade is enabled? Directus usually enforces foreign keys.
            // Let's try to delete messages first manually to be safe.

            // Note: Directus SDK deleteItems is cleaner but strict typed.
            // Let's just fetch IDs and delete.
            const msgs = await directus.request(readItems('messages', {
                filter: { conversation_id: { _eq: conversationId } },
                fields: ['id'],
                limit: -1
            }));

            if (msgs.length > 0) {
                // await directus.request(deleteItems('messages', msgs.map(m => m.id))); // deleteItems not exported from some SDK versions, use loop or custom
                // deleteItem takes a single ID or array of IDs in some versions. Check docs or use loop.
                // SDK v13+ usually supports calculate delete.
                // For safety, loop:
                for (const m of msgs) {
                    await directus.request(deleteItem('messages', m.id));
                }
            }

            // Delete conversation
            await directus.request(deleteItem('conversations', conversationId));

            setConversations(conversations.filter(c => c.id !== conversationId));
            if (selectedConversation?.id === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('Error deleting conversation:', err);
            alert('Erro ao deletar conversa');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;

        try {
            await directus.request(deleteItem('messages', messageId));

            setMessages(messages.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Error deleting message:', err);
            alert('Erro ao deletar mensagem');
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch =
            conv.participant1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.participant2_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.participant1_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.participant2_id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = !filterUnread || (conv.unread_count || 0) > 0;

        return matchesSearch && matchesFilter;
    });

    const formatTimeAgo = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d atrás`;
        if (hours > 0) return `${hours}h atrás`;
        if (minutes > 0) return `${minutes}min atrás`;
        return 'Agora';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gerenciamento de Chat</h1>
                <p className="text-muted-foreground mt-1">
                    Visualizar e gerenciar todas as conversas e mensagens do sistema
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Conversas</p>
                            <p className="text-2xl font-bold mt-1">{conversations.length}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Mensagens</p>
                            <p className="text-2xl font-bold mt-1">
                                {conversations.reduce((sum, conv) => sum + (conv.message_count || 0), 0)}
                            </p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Não Lidas</p>
                            <p className="text-2xl font-bold mt-1">
                                {conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}
                            </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Conversas Ativas</p>
                            <p className="text-2xl font-bold mt-1">
                                {conversations.filter(c => c.last_message_at &&
                                    new Date(c.last_message_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                ).length}
                            </p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar conversas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterUnread}
                                    onChange={(e) => setFilterUnread(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Apenas não lidas</span>
                            </label>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={cn(
                                            "p-3 rounded-lg border cursor-pointer transition-colors",
                                            selectedConversation?.id === conv.id
                                                ? "bg-primary/10 border-primary"
                                                : "bg-muted/50 border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <div className="font-medium text-sm">
                                                        {conv.participant1_name} ↔ {conv.participant2_name}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {conv.message_count || 0} mensagens
                                                    {conv.unread_count !== undefined && conv.unread_count > 0 && (
                                                        <span className="ml-2 px-2 py-0.5 bg-primary text-white rounded text-xs">
                                                            {conv.unread_count} nova(s)
                                                        </span>
                                                    )}
                                                </div>
                                                {conv.last_message_at && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {formatTimeAgo(conv.last_message_at)}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteConversation(conv.id);
                                                }}
                                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                title="Deletar conversa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredConversations.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Nenhuma conversa encontrada
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages View */}
                <div className="lg:col-span-2">
                    {selectedConversation ? (
                        <div className="bg-card border border-border rounded-lg flex flex-col h-[600px]">
                            {/* Conversation Header */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold">
                                            {selectedConversation.participant1_name} ↔ {selectedConversation.participant2_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedConversation.message_count || 0} mensagens
                                            {selectedConversation.created && (
                                                <span className="ml-2">
                                                    • Criada em {new Date(selectedConversation.created).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                window.open(`/profile/${selectedConversation.participant1_id}`, '_blank');
                                            }}
                                            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Ver {selectedConversation.participant1_name?.split(' ')[0]}
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.open(`/profile/${selectedConversation.participant2_id}`, '_blank');
                                            }}
                                            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Ver {selectedConversation.participant2_name?.split(' ')[0]}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className="flex items-start gap-3 group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">{message.sender_name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(message.created || message.date_created).toLocaleString('pt-BR')}
                                                    </span>
                                                    {!message.is_read && (
                                                        <span className="px-2 py-0.5 bg-primary text-white text-xs rounded">
                                                            Não lida
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="bg-muted rounded-lg p-3">
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    className="mt-1 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                                >
                                                    Deletar mensagem
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Nenhuma mensagem nesta conversa
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-lg h-[600px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Selecione uma conversa para ver as mensagens</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
