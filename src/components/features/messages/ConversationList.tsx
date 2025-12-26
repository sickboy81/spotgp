import { useEffect, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserConversations, ConversationWithParticipant } from '@/lib/api/messages';
import { useAuth } from '@/hooks/useAuth';

interface ConversationListProps {
    onSelectConversation: (conversationId: string, otherUserId: string, otherUserName?: string) => void;
    selectedConversationId?: string;
}

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadConversations();
            
            // Poll for new conversations every 5 seconds
            const interval = setInterval(() => {
                loadConversations();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const loadConversations = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const data = await getUserConversations(user.id);
            setConversations(data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const getLastMessagePreview = (conversation: ConversationWithParticipant) => {
        if (conversation.last_message) {
            const content = conversation.last_message.content;
            return content.length > 50 ? content.substring(0, 50) + '...' : content;
        }
        return 'Nenhuma mensagem ainda';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-sm mt-2">Suas conversas aparecerão aqui</p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {conversations.map((conversation) => {
                        const otherUser = conversation.other_participant;
                        const isSelected = conversation.id === selectedConversationId;
                        
                        return (
                            <button
                                key={conversation.id}
                                onClick={() => onSelectConversation(
                                    conversation.id,
                                    otherUser?.id || '',
                                    otherUser?.display_name || undefined
                                )}
                                className={cn(
                                    "w-full p-4 text-left hover:bg-muted/50 transition-colors relative",
                                    isSelected && "bg-primary/10"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-primary">
                                            {(otherUser?.display_name || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-sm truncate">
                                                {otherUser?.display_name || 'Usuário'}
                                            </h3>
                                            {conversation.last_message && (
                                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                                    {formatTime(conversation.last_message.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {getLastMessagePreview(conversation)}
                                        </p>
                                    </div>
                                    {conversation.unread_count && conversation.unread_count > 0 && (
                                        <div className="flex-shrink-0">
                                            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


