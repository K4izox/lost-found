import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const formatMessage = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    if (!linkRegex.test(content)) return content;

    linkRegex.lastIndex = 0;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }

        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
            <Link key={match.index} to={linkUrl} className="font-bold underline underline-offset-2 hover:opacity-80 transition-colors" target={linkUrl.startsWith('http') ? "_blank" : "_self"}>
                {linkText}
            </Link>
        );

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return parts;
};

const QUICK_SUGGESTIONS = [
    "I lost my black wallet",
    "How to report a found item?",
    "Has anyone found my item?",
    "How to claim a recovered item?"
];

const THINKING_MESSAGES = [
    "Scanning database...",
    "Looking for matches...",
    "Reading campus rules..."
];

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get user from local storage
    const userStr = localStorage.getItem('user');
    const userProfile = userStr ? JSON.parse(userStr) : null;

    const [thinkingIndex, setThinkingIndex] = useState(0);

    // Initial greeting when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = userProfile?.name
                ? `Hi ${userProfile.name.split(' ')[0]} 🤖! Did you lose something today at campus?\nI can help you check if a lost or found item is already registered in the system.`
                : "Hello! I'm the Lost & Found AI 🤖\nI can help you check if a lost or found item is already registered in the system. What are you looking for?";

            setMessages([{
                role: 'model',
                content: greeting
            }]);
        }
    }, [isOpen, messages.length]);

    // Dynamic thinking texts
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            setThinkingIndex(0);
            interval = setInterval(() => {
                setThinkingIndex(prev => (prev + 1) % THINKING_MESSAGES.length);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const cleanTextForSpeech = (text: string) => {
        // Remove markdown links but keep the text
        let clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        // Remove bold/italic markdown characters
        clean = clean.replace(/[*_~`]/g, '');
        // Aggressively remove all emojis and special UI symbols (including robot 🤖)
        // using a broad Unicode regex that removes anything that isn't a basic letter, number, or punctuation
        clean = clean.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '');
        return clean.trim();
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();

        const messageToSend = textOverride || input;
        if (!messageToSend.trim() || isLoading) return;

        const userMsg = messageToSend.trim();
        setInput('');
        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.slice(1) // Only previous messages, not the new one
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'model', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: data.error || "Sorry, the AI system is currently offline. Please try again later." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: `Sorry, failed to contact the server: ${error instanceof Error ? error.message : "Unknown error"}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] bg-white text-primary border-2 border-primary/20 hover:bg-slate-50 transition-all z-50 p-0 hover:scale-105"
            >
                <Bot className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[80vh] flex flex-col shadow-2xl z-50 border-primary/20 animate-in slide-in-from-bottom-5">
            <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-xl flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Lost & Found AI
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-primary/20 hover:text-white">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center overflow-hidden ${msg.role === 'user' ? 'bg-primary' : 'bg-muted border'}`}>
                                {msg.role === 'user' ? (
                                    userProfile && userProfile.avatar ? (
                                        <img src={userProfile.avatar} alt="User Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-primary-foreground" />
                                    )
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-background border rounded-tl-sm'
                                    }`}>
                                    {formatMessage(msg.content)}
                                </div>
                                {msg.role === 'model' && (
                                    <button
                                        onClick={() => speak(msg.content)}
                                        className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 self-start ml-1 mt-0.5"
                                        title="Read aloud"
                                    >
                                        <Volume2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-2 max-w-[85%]">
                            <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-muted border">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1 w-[180px]">
                                <div className="p-4 rounded-2xl bg-background border rounded-tl-sm text-sm flex items-center gap-1 self-start min-h-[44px]">
                                    <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-[10px] text-muted-foreground px-1 animate-pulse">
                                    {THINKING_MESSAGES[thinkingIndex]}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Suggestions */}
                {messages.length === 1 && !isLoading && (
                    <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(undefined, suggestion)}
                                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors text-left"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="p-3 border-t bg-background rounded-b-xl">
                <form onSubmit={handleSend} className="flex w-full gap-2">
                    <Input
                        placeholder="Search for a black wallet..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};

export default AIChatbot;
