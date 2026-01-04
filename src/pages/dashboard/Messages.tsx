import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ConversationList } from '@/components/features/messages/ConversationList';
import { ChatWindow } from '@/components/features/messages/ChatWindow';

export default function Messages() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [otherUserId, setOtherUserId] = useState<string>('');
    const [otherUserName, setOtherUserName] = useState<string>('');

    const handleSelectConversation = (conversationId: string, userId: string, userName?: string) => {
        setSelectedConversationId(conversationId);
        setOtherUserId(userId);
        setOtherUserName(userName || '');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Mensagens</h1>
                <p className="text-muted-foreground">Gerencie suas conversas com os usuários</p>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-250px)] flex">
                {/* Conversation List */}
                <div className="w-80 border-r border-border flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Conversas
                        </h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={selectedConversationId || undefined}
                        />
                    </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col">
                    {selectedConversationId ? (
                        <>
                            <div className="p-4 border-b border-border">
                                <h2 className="font-semibold">{otherUserName || 'Usuário'}</h2>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ChatWindow
                                    conversationId={selectedConversationId}
                                    otherUserId={otherUserId}
                                    otherUserName={otherUserName}
                                    onMessageSent={() => {
                                        // Refresh conversation list
                                        window.dispatchEvent(new Event('conversation-updated'));
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Selecione uma conversa para começar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}






