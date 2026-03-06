import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockItems } from '@/lib/mock-data';
import { categoryLabels } from '@/lib/types';

const SendMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const item = mockItems.find((i) => i.id === id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Item Not Found</h1>
            <p className="text-muted-foreground">The item you are looking for does not exist.</p>
            <Link to="/browse">
              <Button>Back to Browse</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate sending
    setTimeout(() => {
      setSending(false);
      toast({
        title: 'Message Sent!',
        description: `Your message about "${item.title}" has been sent to ${item.userName}.`,
      });
      navigate(`/item/${item.id}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          {/* Back link */}
          <Link
            to={`/item/${item.id}`}
            className="inline-flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to {item.title}</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Send a Message
          </h1>
          <p className="text-muted-foreground mb-8">
            Contact the poster about this item. Please be respectful and provide details to help verify ownership.
          </p>

          {/* Item summary */}
          <Card className="mb-8">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                    No Img
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {categoryLabels[item.category]} · {item.type === 'lost' ? 'Lost' : 'Found'}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {item.userAvatar ? (
                    <img src={item.userAvatar} alt={item.userName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">{item.userName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Message form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ahmad Rizki"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. ahmad@student.president.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe why you believe this is your item, or provide details about how you found it..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Tip: Include specific details about the item to help verify ownership.
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Link to={`/item/${item.id}`}>
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={sending} size="lg">
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SendMessage;
