// User Types
export type UserRole = 'student' | 'lecturer' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

// Item Types
export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'claimed' | 'resolved' | 'expired';
export type ItemCategory = 'personal' | 'electronics' | 'academic' | 'miscellaneous';
export type CampusLocation = 'academic' | 'food' | 'common' | 'dormitory';

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  location: CampusLocation;
  locationDetail: string;
  date: Date;
  status: ItemStatus;
  images: string[];
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  itemId: string;
  itemTitle: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
}

// Category and Location Labels
export const categoryLabels: Record<ItemCategory, string> = {
  personal: 'Personal Items',
  electronics: 'Electronics',
  academic: 'Academic Items',
  miscellaneous: 'Miscellaneous',
};

export const locationLabels: Record<CampusLocation, string> = {
  academic: 'Academic Buildings',
  food: 'Food & Dining',
  common: 'Common Areas',
  dormitory: 'Dormitories',
};

export const statusLabels: Record<ItemStatus, string> = {
  active: 'Active',
  claimed: 'Claimed',
  resolved: 'Resolved',
  expired: 'Expired',
};

export const categoryIcons: Record<ItemCategory, string> = {
  personal: 'Wallet',
  electronics: 'Laptop',
  academic: 'BookOpen',
  miscellaneous: 'Package',
};

export const locationIcons: Record<CampusLocation, string> = {
  academic: 'Building2',
  food: 'UtensilsCrossed',
  common: 'Users',
  dormitory: 'Home',
};
