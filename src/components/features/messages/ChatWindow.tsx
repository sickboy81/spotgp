import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getConversationMessages, sendMessage, markMessagesAsRead, MessageWithSender } from '@/lib/api/messages';
import { useAuth } from '@/hooks/useAuth';

interface ChatWindowProps {
    conversationId: string;
    otherUserId: string;
    otherUserName?: string;
    onMessageSent?: () => void;
}

export function ChatWindow({ conversationId, onMessageSent }: ChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        markAsRead();

        // Poll for new messages every 3 seconds
        const interval = setInterval(() => {
            loadMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const data = await getConversationMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        if (user?.id) {
            await markMessagesAsRead(conversationId, user.id);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !user?.id || sending) return;

        setSending(true);
        try {
            const result = await sendMessage(conversationId, user.id, messageText);
            if (result.success && result.message) {
                setMessages(prev => [...prev, result.message!]);
                setMessageText('');
                onMessageSent?.();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex",
                                    isOwn ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[70%] rounded-lg px-4 py-2",
                                    isOwn
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}>
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <p className={cn(
                                        "text-xs mt-1",
                                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                        {formatTime(message.date_created)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-background border border-input rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!messageText.trim() || sending}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            messageText.trim() && !sending
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}







