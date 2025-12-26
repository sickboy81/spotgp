import { useState, useEffect } from 'react';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ConversationList } from '@/components/features/messages/ConversationList';
import { ChatWindow } from '@/components/features/messages/ChatWindow';
import { getOrCreateConversation } from '@/lib/api/messages';
import { useAuth } from '@/hooks/useAuth';

export default function Messages() {
    const { user } = useAuth();
    const { profileId } = useParams<{ profileId?: string }>();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [otherUserId, setOtherUserId] = useState<string>('');
    const [otherUserName, setOtherUserName] = useState<string>('');

    // If profileId is provided, create/load conversation with that profile
    useEffect(() => {
        if (profileId && user?.id && profileId !== user.id) {
            getOrCreateConversation(user.id, profileId)
                .then(conv => {
                    setSelectedConversationId(conv.id);
                    setOtherUserId(profileId);
                })
                .catch(err => {
                    console.error('Error creating conversation:', err);
                    if (err.message?.includes('desabilitado')) {
                        alert('O chat interno está desabilitado para este perfil. Entre em contato através dos outros métodos disponíveis.');
                    }
                });
        }
    }, [profileId, user?.id]);

    const handleSelectConversation = (conversationId: string, userId: string, userName?: string) => {
        setSelectedConversationId(conversationId);
        setOtherUserId(userId);
        setOtherUserName(userName || '');
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">Mensagens</h1>
                    <p className="text-muted-foreground">Suas conversas com os anunciantes</p>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-200px)] flex">
                    {/* Conversation List */}
                    <div className="w-80 border-r border-border flex flex-col">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Conversas
                            </h2>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {user?.id ? (
                                <ConversationList
                                    onSelectConversation={handleSelectConversation}
                                    selectedConversationId={selectedConversationId || undefined}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
                                    <p>Faça login para ver suas mensagens</p>
                                </div>
                            )}
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
        </div>
    );
}

