import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, MessageSquare, Package, AlertTriangle, Clock, Check } from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'claim' | 'message' | 'match' | 'status' | 'system';
  title: string;
  description: string;
  itemId?: string;
  read: boolean;
  createdAt: Date;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'claim',
    title: 'New Claim on Your Item',
    description: 'Someone has claimed your "Apple AirPods Pro" listing. Review the claim details.',
    itemId: '2',
    read: false,
    createdAt: new Date('2024-01-26T10:00:00'),
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message Received',
    description: 'Siti Nurhaliza sent you a message about "Apple AirPods Pro".',
    itemId: '2',
    read: false,
    createdAt: new Date('2024-01-25T14:30:00'),
  },
  {
    id: '3',
    type: 'match',
    title: 'Potential Match Found',
    description: 'A found item matching your lost "Black Leather Wallet" has been reported.',
    itemId: '1',
    read: true,
    createdAt: new Date('2024-01-24T09:00:00'),
  },
  {
    id: '4',
    type: 'status',
    title: 'Item Status Updated',
    description: 'Your "Student ID Card" listing has been marked as claimed.',
    itemId: '4',
    read: true,
    createdAt: new Date('2024-01-23T16:00:00'),
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to Lost & Found',
    description: 'Thank you for joining the President University Lost & Found platform!',
    read: true,
    createdAt: new Date('2024-01-15T08:00:00'),
  },
];

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'claim': return <Package className="h-5 w-5 text-primary" />;
    case 'message': return <MessageSquare className="h-5 w-5 text-primary" />;
    case 'match': return <CheckCircle className="h-5 w-5 text-accent-foreground" />;
    case 'status': return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case 'system': return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const timeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filterNotifications = (tab: string) => {
    if (tab === 'all') return notifications;
    if (tab === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === tab);
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
      onClick={() => markRead(notification.id)}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="mt-0.5">{typeIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">{notification.title}</h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
          {notification.itemId && (
            <Link
              to={`/item/${notification.itemId}`}
              className="text-xs text-primary hover:underline mt-2 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              View Item →
            </Link>
          )}
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You have <Badge variant="secondary" className="mx-1">{unreadCount}</Badge> unread notifications
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="message">Messages</TabsTrigger>
              <TabsTrigger value="claim">Claims</TabsTrigger>
            </TabsList>

            {['all', 'unread', 'message', 'claim'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-3">
                {filterNotifications(tab).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No notifications here</p>
                  </div>
                ) : (
                  filterNotifications(tab).map(n => (
                    <NotificationItem key={n.id} notification={n} />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
