import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, MessageSquare, Package, AlertTriangle, Clock, Check } from 'lucide-react';
import { useState } from 'react';

import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'claim': return <Package className="h-5 w-5 text-primary" />;
    case 'message': return <MessageSquare className="h-5 w-5 text-primary" />;
    case 'match': return <CheckCircle className="h-5 w-5 text-accent-foreground" />;
    case 'status': return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case 'system':
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filterNotifications = (tab: string) => {
    if (tab === 'all') return notifications;
    if (tab === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => n.type === tab);
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
      onClick={() => handleNotificationClick(notification)}
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
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        </div>
        {!notification.isRead && (
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
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
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
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading notifications...</p>
                  </div>
                ) : filterNotifications(tab).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No notifications here</p>
                  </div>
                ) : (
                  filterNotifications(tab).map((n: Notification) => (
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
