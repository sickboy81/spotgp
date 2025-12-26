// API functions for messaging system
// Prepared for database integration - currently using localStorage simulation with Supabase integration ready

import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export interface ConversationWithParticipant extends Conversation {
    other_participant?: {
        id: string;
        display_name: string | null;
        ad_id?: string | null;
    };
    last_message?: Message;
    unread_count?: number;
}

export interface MessageWithSender extends Message {
    sender?: {
        id: string;
        display_name: string | null;
    };
}

/**
 * Get or create a conversation between two users
 * Checks if chat is enabled for the advertiser before creating
 */
export async function getOrCreateConversation(
    userId1: string,
    userId2: string
): Promise<Conversation> {
    try {
        // Check if chat is enabled for the advertiser (userId2 is typically the advertiser)
        const { data: advertiserProfile, error: profileError } = await supabase
            .from('profiles')
            .select('chat_enabled, role')
            .eq('id', userId2)
            .single();

        // If advertiser has chat disabled, throw error
        if (!profileError && advertiserProfile && advertiserProfile.role === 'advertiser') {
            if (advertiserProfile.chat_enabled === false) {
                throw new Error('Chat interno está desabilitado para este perfil');
            }
        }

        // Try to find existing conversation
        const { data: existing, error: findError } = await supabase
            .from('conversations')
            .select('*')
            .or(`and(participant1_id.eq.${userId1},participant2_id.eq.${userId2}),and(participant1_id.eq.${userId2},participant2_id.eq.${userId1})`)
            .single();

        if (existing && !findError) {
            return existing;
        }

        // Create new conversation
        const newConversation: ConversationInsert = {
            participant1_id: userId1,
            participant2_id: userId2,
        };

        const { data, error } = await supabase
            .from('conversations')
            .insert(newConversation)
            .select()
            .single();

        if (error) throw error;

        // Save to localStorage as backup
        saveConversationToLocalStorage(data);

        return data;
    } catch (err: any) {
        // If it's our custom error about disabled chat, rethrow it
        if (err.message?.includes('desabilitado')) {
            throw err;
        }
        console.warn('Error getting/creating conversation in Supabase, using localStorage:', err);
        return getOrCreateConversationFromLocalStorage(userId1, userId2);
    }
}

/**
 * Get all conversations (for admin)
 */
export async function getAllConversations(): Promise<Conversation[]> {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) throw error;
        return data || [];
    } catch (err: any) {
        console.warn('Error fetching all conversations from Supabase, using localStorage:', err);
        return getConversationsFromLocalStorageArray();
    }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationWithParticipant[]> {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
            .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) throw error;

        if (data && data.length > 0) {
            // Fetch participant info and last message for each conversation
            const conversationsWithDetails = await Promise.all(
                data.map(async (conv) => {
                    const otherUserId = conv.participant1_id === userId 
                        ? conv.participant2_id 
                        : conv.participant1_id;

                    const [otherParticipant, lastMessage, unreadCount] = await Promise.all([
                        supabase.from('profiles').select('id, display_name, ad_id').eq('id', otherUserId).single().catch(() => ({ data: null })),
                        getLastMessage(conv.id),
                        getUnreadCount(conv.id, userId),
                    ]);

                    return {
                        ...conv,
                        other_participant: otherParticipant.data,
                        last_message: lastMessage,
                        unread_count: unreadCount,
                    } as ConversationWithParticipant;
                })
            );

            return conversationsWithDetails;
        }

        return getConversationsFromLocalStorage(userId);
    } catch (err: any) {
        console.warn('Error fetching conversations from Supabase, using localStorage:', err);
        return getConversationsFromLocalStorage(userId);
    }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
    conversationId: string,
    limit = 50
): Promise<MessageWithSender[]> {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        if (data && data.length > 0) {
            // Fetch sender info for each message
            const messagesWithSenders = await Promise.all(
                data.map(async (msg) => {
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('id, display_name')
                        .eq('id', msg.sender_id)
                        .single()
                        .catch(() => ({ data: null }));

                    return {
                        ...msg,
                        sender: sender?.data,
                    } as MessageWithSender;
                })
            );

            return messagesWithSenders.reverse(); // Reverse to show oldest first
        }

        return getMessagesFromLocalStorage(conversationId, limit);
    } catch (err: any) {
        console.warn('Error fetching messages from Supabase, using localStorage:', err);
        return getMessagesFromLocalStorage(conversationId, limit);
    }
}

/**
 * Send a message
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string
): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
        const messageData: MessageInsert = {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
            is_read: false,
        };

        const { data, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single();

        if (error) throw error;

        // Update conversation last_message_at
        await supabase
            .from('conversations')
            .update({ 
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

        // Save to localStorage
        saveMessageToLocalStorage(data);

        return { success: true, message: data };
    } catch (err: any) {
        console.warn('Error sending message in Supabase, using localStorage:', err);
        
        const messageData: MessageInsert = {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
            is_read: false,
        };

        const newMessage: Message = {
            ...messageData,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
        } as Message;

        saveMessageToLocalStorage(newMessage);
        return { success: true, message: newMessage };
    }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId); // Don't mark own messages as read

        if (error) throw error;

        // Update localStorage
        updateMessagesReadStatus(conversationId, userId);

        return { success: true };
    } catch (err: any) {
        console.warn('Error marking messages as read in Supabase, using localStorage:', err);
        updateMessagesReadStatus(conversationId, userId);
        return { success: true };
    }
}

/**
 * Get unread message count for a conversation
 */
async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId)
            .eq('is_read', false)
            .neq('sender_id', userId);

        if (error) throw error;
        return count || 0;
    } catch {
        return getUnreadCountFromLocalStorage(conversationId, userId);
    }
}

/**
 * Get last message in a conversation
 */
async function getLastMessage(conversationId: string): Promise<Message | null> {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data;
    } catch {
        return getLastMessageFromLocalStorage(conversationId);
    }
}

// LocalStorage fallback functions
function saveConversationToLocalStorage(conversation: Conversation): void {
    const conversations = getConversationsFromLocalStorageArray();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
    } else {
        conversations.push(conversation);
    }

    localStorage.setItem('saphira_conversations', JSON.stringify(conversations));
}

function getOrCreateConversationFromLocalStorage(userId1: string, userId2: string): Conversation {
    const conversations = getConversationsFromLocalStorageArray();
    const existing = conversations.find(c => 
        (c.participant1_id === userId1 && c.participant2_id === userId2) ||
        (c.participant1_id === userId2 && c.participant2_id === userId1)
    );

    if (existing) return existing;

    const newConversation: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participant1_id: userId1,
        participant2_id: userId2,
        last_message_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    saveConversationToLocalStorage(newConversation);
    return newConversation;
}

function getConversationsFromLocalStorageArray(): Conversation[] {
    const stored = localStorage.getItem('saphira_conversations');
    return stored ? JSON.parse(stored) : [];
}

function getConversationsFromLocalStorage(userId: string): ConversationWithParticipant[] {
    const conversations = getConversationsFromLocalStorageArray();
    return conversations
        .filter(c => c.participant1_id === userId || c.participant2_id === userId)
        .map(conv => ({
            ...conv,
            other_participant: undefined,
            last_message: getLastMessageFromLocalStorage(conv.id),
            unread_count: getUnreadCountFromLocalStorage(conv.id, userId),
        })) as ConversationWithParticipant[];
}

function saveMessageToLocalStorage(message: Message): void {
    const messages = getMessagesFromLocalStorageArray();
    messages.push(message);
    localStorage.setItem('saphira_messages', JSON.stringify(messages));

    // Update conversation last_message_at
    const conversations = getConversationsFromLocalStorageArray();
    const convIndex = conversations.findIndex(c => c.id === message.conversation_id);
    if (convIndex >= 0) {
        conversations[convIndex].last_message_at = message.created_at;
        conversations[convIndex].updated_at = new Date().toISOString();
        localStorage.setItem('saphira_conversations', JSON.stringify(conversations));
    }
}

function getMessagesFromLocalStorageArray(): Message[] {
    const stored = localStorage.getItem('saphira_messages');
    return stored ? JSON.parse(stored) : [];
}

function getMessagesFromLocalStorage(conversationId: string, limit: number): MessageWithSender[] {
    const messages = getMessagesFromLocalStorageArray();
    return messages
        .filter(m => m.conversation_id === conversationId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-limit)
        .map(msg => ({ ...msg, sender: undefined })) as MessageWithSender[];
}

function getLastMessageFromLocalStorage(conversationId: string): Message | null {
    const messages = getMessagesFromLocalStorageArray();
    const convMessages = messages
        .filter(m => m.conversation_id === conversationId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return convMessages.length > 0 ? convMessages[0] : null;
}

function getUnreadCountFromLocalStorage(conversationId: string, userId: string): number {
    const messages = getMessagesFromLocalStorageArray();
    return messages.filter(m => 
        m.conversation_id === conversationId &&
        m.sender_id !== userId &&
        !m.is_read
    ).length;
}

function updateMessagesReadStatus(conversationId: string, userId: string): void {
    const messages = getMessagesFromLocalStorageArray();
    const updated = messages.map(m => 
        m.conversation_id === conversationId && m.sender_id !== userId
            ? { ...m, is_read: true }
            : m
    );
    localStorage.setItem('saphira_messages', JSON.stringify(updated));
}

