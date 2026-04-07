import { Item } from './types';

const API_BASE_URL = `http://${window.location.hostname}:3000/api`;

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
        userEmail: item.user?.email,
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
        userEmail: item.user?.email,
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

export const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal memproses lupa password');
    return result;
};

export const resetPassword = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mereset kata sandi');
    return result;
};

// --- PROFILE API ---
export const fetchProfile = async () => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch profile');
    return result;
};

export const updateProfile = async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update profile');
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

export const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return { count: 0 };

    // Fail gracefully if not logged in
    try {
        const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return { count: 0 };
        return response.json();
    } catch {
        return { count: 0 };
    }
};

// --- NOTIFICATIONS API ---

export const fetchNotifications = async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

export const fetchUnreadNotificationsCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return { count: 0 };

    try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return { count: 0 };
        return response.json();
    } catch {
        return { count: 0 };
    }
};

export const markNotificationAsRead = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
};

export const markAllNotificationsAsRead = async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return response.json();
};

export const reportItem = async (data: { itemId: string; reason: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/items/${data.itemId}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to submit report');
    return result;
};
