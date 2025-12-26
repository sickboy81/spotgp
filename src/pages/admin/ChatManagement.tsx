import { useState, useEffect } from 'react';
import { MessageSquare, Search, Eye, Trash2, User, Calendar, Loader2, AlertTriangle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getConversationMessages, getAllConversations } from '@/lib/api/messages';

interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    participant1_name?: string;
    participant2_name?: string;
    last_message_at: string | null;
    created_at: string;
    message_count?: number;
    unread_count?: number;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name?: string;
    content: string;
    is_read: boolean;
    created_at: string;
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
                        // Get participant 1 name
                        const { data: p1 } = await supabase
                            .from('profiles')
                            .select('display_name')
                            .eq('id', conv.participant1_id)
                            .single();

                        // Get participant 2 name
                        const { data: p2 } = await supabase
                            .from('profiles')
                            .select('display_name')
                            .eq('id', conv.participant2_id)
                            .single();

                        // Count messages
                        const { count: messageCount } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('conversation_id', conv.id);

                        // Count unread messages
                        const { count: unreadCount } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('conversation_id', conv.id)
                            .eq('is_read', false);

                        return {
                            ...conv,
                            participant1_name: p1?.display_name || 'Usuário desconhecido',
                            participant2_name: p2?.display_name || 'Usuário desconhecido',
                            message_count: messageCount || 0,
                            unread_count: unreadCount || 0,
                        };
                    } catch (err) {
                        console.error('Error processing conversation:', err);
                        return {
                            ...conv,
                            participant1_name: 'Usuário desconhecido',
                            participant2_name: 'Usuário desconhecido',
                            message_count: 0,
                            unread_count: 0,
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

            // Get sender names
            const messagesWithNames = await Promise.all(
                messagesData.map(async (msg) => {
                    try {
                        const { data: sender } = await supabase
                            .from('profiles')
                            .select('display_name')
                            .eq('id', msg.sender_id)
                            .single();

                        return {
                            ...msg,
                            sender_name: sender?.display_name || msg.sender?.display_name || 'Usuário desconhecido',
                        };
                    } catch (err) {
                        return {
                            ...msg,
                            sender_name: msg.sender?.display_name || 'Usuário desconhecido',
                        };
                    }
                })
            );

            setMessages(messagesWithNames);
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
            await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId);

            // Delete conversation
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId);

            if (error) throw error;

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
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

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

    const formatTimeAgo = (dateString: string) => {
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
                                                    {conv.unread_count && conv.unread_count > 0 && (
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
                                            {selectedConversation.created_at && (
                                                <span className="ml-2">
                                                    • Criada em {new Date(selectedConversation.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                window.open(`/profile/${selectedConversation.participant1_id}`, '_blank');
                                            }}
                                            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                        >
                                            Ver {selectedConversation.participant1_name}
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.open(`/profile/${selectedConversation.participant2_id}`, '_blank');
                                            }}
                                            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                        >
                                            Ver {selectedConversation.participant2_name}
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
                                                        {new Date(message.created_at).toLocaleString('pt-BR')}
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

