import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Clock, MessageCircle, Flag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ItemCard from '@/components/ItemCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchItems, createConversation, updateItemStatus, reportItem } from '@/lib/api';
import { categoryLabels, locationLabels } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activeUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  const chatMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
      // You could pass the created conversation ID in state if you wanted it to auto-open
      navigate('/messages');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Cannot start conversation. Are you logged in?',
        variant: 'destructive',
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateItemStatus(id, status),
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'The item status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status.',
        variant: 'destructive',
      });
    }
  });

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDescription, setReportDescription] = useState("");

  const reportMutation = useMutation({
    mutationFn: reportItem,
    onSuccess: () => {
      toast({
        title: 'Report Submitted',
        description: 'Thank you for keeping our community safe.',
      });
      setIsReportOpen(false);
      setReportReason("");
      setReportDescription("");
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleReportSubmit = () => {
    if (!reportReason) {
      toast({ title: 'Error', description: 'Please select a reason.', variant: 'destructive' });
      return;
    }
    reportMutation.mutate({
      itemId: id!,
      reason: reportReason,
      description: reportDescription
    });
  };

  const item = allItems.find((i) => i.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading item details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Item Not Found</h1>
            <p className="text-muted-foreground">The item you're looking for doesn't exist or has been removed.</p>
            <Link to="/browse">
              <Button>Back to Browse</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedItems = allItems
    .filter((i: any) => i.id !== item.id && i.category === item.category && i.status === 'active')
    .slice(0, 3);

  const handleShare = async () => {
    const shareData = {
      title: `Campus Connect - ${item.title}`,
      text: `Check out this ${item.type} item on Campus Connect: ${item.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Item link has been copied to clipboard.",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <Link to="/browse" className="flex items-center space-x-1 hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Browse</span>
            </Link>
            <span>/</span>
            <span className="text-foreground">{item.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                  {item.images[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-lg">
                      No Image Available
                    </div>
                  )}
                  <Badge
                    className={`absolute top-4 left-4 text-sm px-3 py-1 ${item.type === 'lost'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-success text-success-foreground'
                      }`}
                  >
                    {item.type === 'lost' ? 'Lost' : 'Found'}
                  </Badge>
                  {item.status !== 'active' && (
                    <Badge variant="secondary" className="absolute top-4 right-4 text-sm px-3 py-1">
                      {item.status === 'claimed' ? 'Claimed' : item.status === 'resolved' ? 'Resolved' : 'Expired'}
                    </Badge>
                  )}
                </div>
                {/* Thumbnail strip */}
                {item.images.length > 1 && (
                  <div className="flex space-x-3">
                    {item.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`h-20 w-20 rounded-lg overflow-hidden bg-muted cursor-pointer border-2 ${idx === 0 ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                          }`}
                      >
                        <img src={img} alt={`${item.title} ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {categoryLabels[item.category]}
                    </Badge>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{item.title}</h1>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" title="Share" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Report" onClick={() => setIsReportOpen(true)}>
                      <Flag className="h-5 w-5" />
                    </Button>
                    <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Report Item</DialogTitle>
                          <DialogDescription>
                            Help us keep Campus Connect safe. What is wrong with this item?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                              <SelectTrigger id="reason">
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spam">Spam or Misleading</SelectItem>
                                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                                <SelectItem value="fake">Fake Item / Scam</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Additional Details</Label>
                            <Textarea
                              id="description"
                              placeholder="Please provide any additional information..."
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
                          <Button onClick={handleReportSubmit} disabled={reportMutation.isPending || !reportReason}>
                            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{locationLabels[item.location]} — {item.locationDetail}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{format(item.date, 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-4 w-4" />
                    <span>Posted {formatDistanceToNow(item.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">

              {activeUser?.id === item.userId ? (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-foreground text-lg">Manage Your Item</h3>
                    <p className="text-sm text-muted-foreground">Keep the community updated by changing the status of your item when it's resolved.</p>
                    <div className="flex flex-col space-y-2 pt-2">
                      <Button
                        variant={item.status === 'active' ? 'default' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'active' })}
                        disabled={item.status === 'active' || updateStatusMutation.isPending}
                        className="w-full justify-start"
                      >
                        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                        Mark as Active
                      </Button>
                      <Button
                        variant={item.status === 'claimed' ? 'default' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'claimed' })}
                        disabled={item.status === 'claimed' || updateStatusMutation.isPending}
                        className="w-full justify-start"
                      >
                        <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                        Mark as Claimed
                      </Button>
                      <Button
                        variant={item.status === 'resolved' ? 'default' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'resolved' })}
                        disabled={item.status === 'resolved' || updateStatusMutation.isPending}
                        className="w-full justify-start"
                      >
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        {item.type === 'lost' ? 'Found it!' : 'Returned to Owner!'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-foreground">Posted By</h3>
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                          {item.userAvatar ? (
                            <img src={item.userAvatar} alt={item.userName} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.userName}</p>
                          <p className="text-sm text-muted-foreground">{item.userEmail || 'President University'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => chatMutation.mutate({ itemId: item.id, receiverId: item.userId })}
                          disabled={chatMutation.isPending}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {chatMutation.isPending ? 'Starting Chat...' : 'Send Message'}
                        </Button>

                        {item.userEmail && (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            asChild
                          >
                            <a href={`mailto:${item.userEmail}?subject=Regarding your post: ${item.title}`}>
                              <Flag className="mr-2 h-4 w-4" />
                              Send Email
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 space-y-3">
                      <h3 className="font-semibold text-foreground">
                        {item.type === 'lost' ? 'Found this item?' : 'Is this yours?'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.type === 'lost'
                          ? "If you've found this item, let the owner know by sending a message."
                          : 'If this is your lost item, contact the finder to arrange a pickup.'}
                      </p>
                      <Link to={`/item/${item.id}/claim`}>
                        <Button variant="outline" className="w-full" size="lg">
                          {item.type === 'lost' ? 'I Found This Item' : 'Claim This Item'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Item Details Summary */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium text-foreground capitalize">{item.type}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium text-foreground">{categoryLabels[item.category]}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{locationLabels[item.location]}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {item.status}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground">{format(item.date, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-foreground mb-6">Similar Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedItems.map((relItem) => (
                  <ItemCard key={relItem.id} item={relItem} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ItemDetail;
