import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, User, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockItems } from '@/lib/mock-data';
import { categoryLabels, locationLabels } from '@/lib/types';
import { format } from 'date-fns';

const ClaimItem = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const item = mockItems.find((i) => i.id === id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const isLost = item.type === 'lost';
  const pageTitle = isLost ? 'I Found This Item' : 'Claim This Item';
  const pageDescription = isLost
    ? 'Let the owner know you found their item. Please provide details so we can verify and connect you.'
    : 'If this is your lost item, fill out the form below. We will verify your claim and connect you with the finder.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: isLost ? 'Report Submitted!' : 'Claim Submitted!',
        description: isLost
          ? `Thank you! The owner of "${item.title}" will be notified.`
          : `Your claim for "${item.title}" has been submitted. The finder will be notified.`,
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
            <ShieldCheck className="h-6 w-6 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground mb-8">{pageDescription}</p>

          {/* Item summary card */}
          <Card className="mb-8">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                      No Img
                    </div>
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        item.type === 'lost'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-success text-success-foreground'
                      }
                    >
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </Badge>
                    <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                  </div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {locationLabels[item.location]} · {format(item.date, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {item.userAvatar ? (
                    <img src={item.userAvatar} alt={item.userName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Posted by <span className="font-medium text-foreground">{item.userName}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Claim / Found form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ahmad Rizki"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
              <Label htmlFor="studentId">Student / Staff ID</Label>
              <Input
                id="studentId"
                placeholder="e.g. 001202100123"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {isLost ? 'Where & how did you find it?' : 'Proof of ownership'}
              </Label>
              <Textarea
                id="description"
                placeholder={
                  isLost
                    ? 'Describe where you found the item and its current condition...'
                    : 'Describe specific details about the item only the owner would know (color, scratches, contents, etc.)...'
                }
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Supporting Photo (optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click or drag a photo here to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5 MB</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Link to={`/item/${item.id}`}>
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={submitting} size="lg">
                <ShieldCheck className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : isLost ? 'Submit Report' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClaimItem;
