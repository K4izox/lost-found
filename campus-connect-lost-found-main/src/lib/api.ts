import { Item } from './types';

const API_BASE_URL = 'http://localhost:3000/api';

export const fetchItems = async (): Promise<Item[]> => {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) {
        throw new Error('Failed to fetch items');
    }
    const data = await response.json();

    // Mapping the backend Prisma "Item & User" structure to our frontend Item Type
    return data.map((item: any) => ({
        ...item,
        date: new Date(item.date),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        userName: item.user?.name || 'Anonymous',
        userAvatar: item.user?.avatar,
    }));
};

export const fetchItemById = async (id: string): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch item');
    }
    const item = await response.json();

    return {
        ...item,
        date: new Date(item.date),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        userName: item.user?.name || 'Anonymous',
        userAvatar: item.user?.avatar,
    };
};

export const createItem = async (itemData: any): Promise<Item> => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('You must be logged in to report an item');
    }

    const isFormData = itemData instanceof FormData;

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers,
        body: isFormData ? itemData : JSON.stringify(itemData),
    });

    if (!response.ok) {
        throw new Error('Failed to create item');
    }
    return response.json();
};

export const updateItemStatus = async (id: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/items/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to update item status');
    }
    return result;
};

export const registerUser = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
    }
    return result;
};

export const loginUser = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Login failed');
    }
    return result;
};

// --- CHAT API ---

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const fetchConversations = async () => {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
};

export const createConversation = async (data: { itemId: string; receiverId: string }) => {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to start conversation');
    return result;
};

export const fetchMessages = async (conversationId: string) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
};

export const sendMessage = async (data: { conversationId: string; content: string }) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: data.content }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
};
