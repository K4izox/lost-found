import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, fetchMessages, sendMessage } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, MessageCircle } from 'lucide-react';

const Messages = () => {
    const [activeUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');

    const { data: conversations = [], isLoading: loadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
    });

    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: ['messages', activeConversationId],
        queryFn: () => fetchMessages(activeConversationId!),
        enabled: !!activeConversationId,
        refetchInterval: 3000,
    });

    const queryClient = useQueryClient();

    const sendMutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !activeConversationId) return;
        sendMutation.mutate({ conversationId: activeConversationId, content: messageText });
    };

    return (
        <div className="min-h-screen flex flex-col bg-muted/20">
            <Header />
            <main className="flex-1 container max-w-5xl py-6 h-[calc(100vh-4rem)]">
                <div className="bg-background rounded-xl border shadow-sm flex h-[600px] overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-1/3 border-r flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="font-semibold text-lg">Messages</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loadingConversations ? (
                                <div className="p-4 text-center text-muted-foreground">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">No conversations yet</div>
                            ) : (
                                conversations.map((conv: any) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className={`p-4 border-b cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-primary/5' : 'hover:bg-muted'}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {conv.partnerAvatar ? (
                                                    <img src={conv.partnerAvatar} alt={conv.partnerName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className="font-medium text-sm truncate">{conv.partnerName}</p>
                                                    {conv.lastMessage && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">Re: {conv.itemTitle}</p>
                                                {conv.lastMessage && (
                                                    <p className={`text-sm truncate mt-1 ${!conv.lastMessage.read && conv.lastMessage.senderId !== activeUser.id ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                        {conv.lastMessage.senderId === activeUser.id ? 'You: ' : ''}{conv.lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {activeConversationId ? (
                            <>
                                <div className="p-4 border-b flex items-center justify-between bg-muted/5">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-medium">
                                            {conversations.find((c: any) => c.id === activeConversationId)?.partnerName}
                                        </span>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                            {conversations.find((c: any) => c.id === activeConversationId)?.itemTitle}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                    {loadingMessages ? (
                                        <div className="text-center text-muted-foreground">Loading messages...</div>
                                    ) : (
                                        messages.map((msg: any) => {
                                            const isMe = msg.senderId === activeUser.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                        <span className={`text-[10px] block mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                <div className="p-4 border-t bg-background">
                                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                                        <Input
                                            placeholder="Type your message..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="submit" size="icon" disabled={!messageText.trim() || sendMutation.isPending}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col space-y-4 text-muted-foreground">
                                <MessageCircle className="h-12 w-12 text-muted" />
                                <p>Select a conversation to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Messages;
