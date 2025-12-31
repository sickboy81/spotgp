// API functions for messaging system
import { pb } from '@/lib/pocketbase';
// import { shouldUseMockAuth } from '../mock-auth';

// Types
export interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    last_message_at: string | null;
    created: string;
    updated: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created: string;
    updated: string;
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
            const advertiserProfile = await pb.collection('profiles').getOne(userId2);
            if (advertiserProfile.role === 'advertiser' && advertiserProfile.chat_enabled === false) {
                throw new Error('Chat interno está desabilitado para este perfil');
            }
        } catch (e) { /* ignore if profile fetch fails */ }

        // Try to find existing conversation
        // Filter: (p1=u1 AND p2=u2) OR (p1=u2 AND p2=u1)
        const filter = `(participant1_id = "${userId1}" && participant2_id = "${userId2}") || (participant1_id = "${userId2}" && participant2_id = "${userId1}")`;

        const existingList = await pb.collection('conversations').getList<Conversation>(1, 1, { filter });

        if (existingList.items.length > 0) {
            return existingList.items[0];
        }

        // Create new conversation
        const newConversation = await pb.collection('conversations').create<Conversation>({
            participant1_id: userId1,
            participant2_id: userId2,
            last_message_at: null,
        });

        return newConversation;
    } catch (err: any) {
        if (err.message?.includes('desabilitado')) {
            throw err;
        }
        console.warn('Error getting/creating conversation in PocketBase, using localStorage:', err);
        return getOrCreateConversationFromLocalStorage(userId1, userId2);
    }
}

/**
 * Get all conversations (for admin)
 */
export async function getAllConversations(): Promise<Conversation[]> {
    try {
        const list = await pb.collection('conversations').getFullList<Conversation>({
            sort: '-last_message_at',
        });
        return list;
    } catch (err: any) {
        console.warn('Error fetching all conversations from PocketBase, using localStorage:', err);
        return getConversationsFromLocalStorageArray();
    }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationWithParticipant[]> {
    try {
        const filter = `participant1_id = "${userId}" || participant2_id = "${userId}"`;
        const list = await pb.collection('conversations').getFullList<Conversation>({
            filter,
            sort: '-last_message_at',
        });

        // Fetch details
        const conversationsWithDetails = await Promise.all(
            list.map(async (conv) => {
                const otherUserId = conv.participant1_id === userId
                    ? conv.participant2_id
                    : conv.participant1_id;

                let otherParticipant = null;
                try {
                    const p = await pb.collection('profiles').getOne(otherUserId);
                    otherParticipant = { id: p.id, display_name: p.display_name, ad_id: p.ad_id };
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
        console.warn('Error fetching conversations from PocketBase, using localStorage:', err);
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
        const list = await pb.collection('messages').getList<Message>(1, limit, {
            filter: `conversation_id = "${conversationId}"`,
            sort: '-created',
            expand: 'sender_id', // Expand sender info if relation exists
        });

        const messagesWithSenders = list.items.map((msg: any) => ({
            ...msg,
            sender: msg.expand?.sender_id ? {
                id: msg.expand.sender_id.id,
                display_name: msg.expand.sender_id.display_name
            } : undefined
        }));

        return messagesWithSenders.reverse() as MessageWithSender[];
    } catch (err: any) {
        console.warn('Error fetching messages from PocketBase, using localStorage:', err);
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

        const message = await pb.collection('messages').create<Message>(messageData);

        // Update conversation
        await pb.collection('conversations').update(conversationId, {
            last_message_at: new Date().toISOString(),
        });

        saveMessageToLocalStorage(message);
        return { success: true, message };
    } catch (err: any) {
        console.warn('Error sending message in PocketBase, using localStorage:', err);

        const newMessage: Message = {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
            is_read: false,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
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
        // Fetch unread messages sent by others
        const unread = await pb.collection('messages').getFullList({
            filter: `conversation_id = "${conversationId}" && sender_id != "${userId}" && is_read = false`,
        });

        await Promise.all(unread.map(m =>
            pb.collection('messages').update(m.id, { is_read: true })
        ));

        updateMessagesReadStatus(conversationId, userId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error marking messages as read in PocketBase, using localStorage:', err);
        updateMessagesReadStatus(conversationId, userId);
        return { success: true };
    }
}

/**
 * Get unread message count for a conversation
 */
async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
        const result = await pb.collection('messages').getList(1, 1, {
            filter: `conversation_id = "${conversationId}" && sender_id != "${userId}" && is_read = false`,
        });
        return result.totalItems;
    } catch {
        return getUnreadCountFromLocalStorage(conversationId, userId);
    }
}

/**
 * Get last message in a conversation
 */
async function getLastMessage(conversationId: string): Promise<Message | null> {
    try {
        const list = await pb.collection('messages').getList<Message>(1, 1, {
            filter: `conversation_id = "${conversationId}"`,
            sort: '-created',
        });
        return list.items.length > 0 ? list.items[0] : null;
    } catch {
        return getLastMessageFromLocalStorage(conversationId);
    }
}

// LocalStorage fallback functions (types adjusted)
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
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
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
        conversations[convIndex].last_message_at = message.created;
        conversations[convIndex].updated = new Date().toISOString();
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
        .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
        .slice(-limit)
        .map(msg => ({ ...msg, sender: undefined })) as MessageWithSender[];
}

function getLastMessageFromLocalStorage(conversationId: string): Message | null {
    const messages = getMessagesFromLocalStorageArray();
    const convMessages = messages
        .filter(m => m.conversation_id === conversationId)
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

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
