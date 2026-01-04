// API functions for messaging system
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, updateItems } from '@directus/sdk';
// import { shouldUseMockAuth } from '../mock-auth';

// Types
export interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    last_message_at: string | null;
    date_created: string;
    date_updated: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    date_created: string;
    date_updated: string;
}

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
 */
export async function getOrCreateConversation(
    userId1: string,
    userId2: string
): Promise<Conversation> {
    try {
        // Check if chat is enabled for the advertiser (userId2 is typically the advertiser)
        try {
            // Assuming userId2 is the advertiser profile ID or related user ID
            const profiles = await directus.request(readItems('profiles', {
                filter: { id: { _eq: userId2 } }, // Assuming userId2 is profile ID for initial check? Or user ID?
                // If userId2 is user_id, finding profile:
                // filter: { user: { _eq: userId2 } }
                limit: 1
            }));
            const advertiserProfile: any = profiles[0];

            if (advertiserProfile?.role === 'advertiser' && advertiserProfile?.chat_enabled === false) {
                throw new Error('Chat interno está desabilitado para este perfil');
            }
        } catch (e) { /* ignore if profile fetch fails */ }

        // Try to find existing conversation
        // Filter: (p1=u1 AND p2=u2) OR (p1=u2 AND p2=u1)
        const existingList = await directus.request(readItems('conversations', {
            filter: {
                _or: [
                    {
                        _and: [
                            { participant1_id: { _eq: userId1 } },
                            { participant2_id: { _eq: userId2 } }
                        ]
                    },
                    {
                        _and: [
                            { participant1_id: { _eq: userId2 } },
                            { participant2_id: { _eq: userId1 } }
                        ]
                    }
                ]
            },
            limit: 1
        }));

        if (existingList.length > 0) {
            return existingList[0] as Conversation;
        }

        // Create new conversation
        const newConversation = await directus.request(createItem('conversations', {
            participant1_id: userId1,
            participant2_id: userId2,
            last_message_at: null,
        }));

        return newConversation as Conversation;
    } catch (err: any) {
        if (err.message?.includes('desabilitado')) {
            throw err;
        }
        console.warn('Error getting/creating conversation in Directus, using localStorage:', err);
        return getOrCreateConversationFromLocalStorage(userId1, userId2);
    }
}

/**
 * Get all conversations (for admin)
 */
export async function getAllConversations(): Promise<Conversation[]> {
    try {
        const list = await directus.request(readItems('conversations', {
            sort: ['-last_message_at']
        }));
        return list as Conversation[];
    } catch (err: any) {
        console.warn('Error fetching all conversations from Directus, using localStorage:', err);
        return getConversationsFromLocalStorageArray();
    }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationWithParticipant[]> {
    try {
        const list = await directus.request(readItems('conversations', {
            filter: {
                _or: [
                    { participant1_id: { _eq: userId } },
                    { participant2_id: { _eq: userId } }
                ]
            },
            sort: ['-last_message_at']
        }));

        // Fetch details
        const conversationsWithDetails = await Promise.all(
            list.map(async (conv: any) => {
                const otherUserId = conv.participant1_id === userId
                    ? conv.participant2_id
                    : conv.participant1_id;

                let otherParticipant = null;
                try {
                    // Get profile of other user
                    // Assuming otherUserId is user ID, fetch profile linked to it
                    const profiles = await directus.request(readItems('profiles', {
                        filter: { user: { _eq: otherUserId } }, // Safer lookup
                        limit: 1,
                        fields: ['id', 'display_name', 'ad_id']
                    }));
                    const p: any = profiles[0];
                    if (p) otherParticipant = { id: p.id, display_name: p.display_name, ad_id: p.ad_id };
                } catch (e) { /* ignore */ }

                const lastMessage = await getLastMessage(conv.id);
                const unreadCount = await getUnreadCount(conv.id, userId);

                return {
                    ...conv,
                    other_participant: otherParticipant,
                    last_message: lastMessage,
                    unread_count: unreadCount,
                } as ConversationWithParticipant;
            })
        );

        return conversationsWithDetails;
    } catch (err: any) {
        console.warn('Error fetching conversations from Directus, using localStorage:', err);
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
        // Directus: fetch messages and sender details in one go
        // Assuming sender_id is a relation to profiles or users
        const list = await directus.request(readItems('messages', {
            filter: { conversation_id: { _eq: conversationId } },
            sort: ['-date_created'],
            limit: limit,
            // Fetch sender info nested
            fields: ['*', 'sender_id.id', 'sender_id.display_name']
        }));

        // Map Directus nested data to structure expected by UI
        const messagesWithSenders = list.map((msg: any) => ({
            ...msg,
            sender: msg.sender_id ? {
                id: msg.sender_id.id,
                display_name: msg.sender_id.display_name
            } : undefined
        }));

        return messagesWithSenders.reverse() as MessageWithSender[];
    } catch (err: any) {
        console.warn('Error fetching messages from Directus, using localStorage:', err);
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
        const messageData = {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
            is_read: false,
        };

        const message = await directus.request(createItem('messages', messageData));

        // Update conversation timestamp
        await directus.request(updateItem('conversations', conversationId, {
            last_message_at: new Date().toISOString(),
        }));

        saveMessageToLocalStorage(message as Message);
        return { success: true, message: message as Message };
    } catch (err: any) {
        console.warn('Error sending message in Directus, using localStorage:', err);

        const newMessage: Message = {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
            is_read: false,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString(),
        };

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
        // Find unread messages not sent by me
        const unread = await directus.request(readItems('messages', {
            filter: {
                conversation_id: { _eq: conversationId },
                sender_id: { _neq: userId },
                is_read: { _eq: false }
            },
            fields: ['id']
        }));

        if (unread.length > 0) {
            await directus.request(updateItems('messages', unread.map((m: any) => m.id), { is_read: true }));
        }

        updateMessagesReadStatus(conversationId, userId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error marking messages as read in Directus, using localStorage:', err);
        updateMessagesReadStatus(conversationId, userId);
        return { success: true };
    }
}

/**
 * Get unread message count for a conversation
 */
async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
        // Count unread that are NOT from me
        const result = await directus.request(readItems('messages', {
            filter: {
                conversation_id: { _eq: conversationId },
                sender_id: { _neq: userId },
                is_read: { _eq: false }
            },
            aggregate: { count: '*' }
        }));
        // Directus aggregate likely returns array
        return Number((result as any)[0]?.count || 0);
    } catch {
        return getUnreadCountFromLocalStorage(conversationId, userId);
    }
}

/**
 * Get last message in a conversation
 */
async function getLastMessage(conversationId: string): Promise<Message | null> {
    try {
        const list = await directus.request(readItems('messages', {
            filter: { conversation_id: { _eq: conversationId } },
            sort: ['-date_created'], // Directus date_created
            limit: 1
        }));
        return list.length > 0 ? list[0] as Message : null;
    } catch {
        return getLastMessageFromLocalStorage(conversationId);
    }
}

// LocalStorage fallback functions (types adjusted to match Directus fields date_created etc)
function saveConversationToLocalStorage(conversation: Conversation): void {
    const conversations = getConversationsFromLocalStorageArray();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);

    if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
    } else {
        conversations.push(conversation);
    }
    localStorage.setItem('spotgp_conversations', JSON.stringify(conversations));
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
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString(),
    };

    saveConversationToLocalStorage(newConversation);
    return newConversation;
}

function getConversationsFromLocalStorageArray(): Conversation[] {
    const stored = localStorage.getItem('spotgp_conversations');
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
    localStorage.setItem('spotgp_messages', JSON.stringify(messages));

    const conversations = getConversationsFromLocalStorageArray();
    const convIndex = conversations.findIndex(c => c.id === message.conversation_id);
    if (convIndex >= 0) {
        conversations[convIndex].last_message_at = message.date_created;
        conversations[convIndex].date_updated = new Date().toISOString();
        localStorage.setItem('spotgp_conversations', JSON.stringify(conversations));
    }
}

function getMessagesFromLocalStorageArray(): Message[] {
    const stored = localStorage.getItem('spotgp_messages');
    return stored ? JSON.parse(stored) : [];
}

function getMessagesFromLocalStorage(conversationId: string, limit: number): MessageWithSender[] {
    const messages = getMessagesFromLocalStorageArray();
    return messages
        .filter(m => m.conversation_id === conversationId)
        .sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime())
        .slice(-limit)
        .map(msg => ({ ...msg, sender: undefined })) as MessageWithSender[];
}

function getLastMessageFromLocalStorage(conversationId: string): Message | null {
    const messages = getMessagesFromLocalStorageArray();
    const convMessages = messages
        .filter(m => m.conversation_id === conversationId)
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

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
    localStorage.setItem('spotgp_messages', JSON.stringify(updated));
}
