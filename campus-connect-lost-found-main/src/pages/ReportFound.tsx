import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { categoryLabels, locationLabels, type ItemCategory, type CampusLocation } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '@/lib/api';

const ReportFound = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [categoryOther, setCategoryOther] = useState('');
  const [location, setLocation] = useState<CampusLocation | ''>('');
  const [locationOther, setLocationOther] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [date, setDate] = useState('');
  const [handedOver, setHandedOver] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      toast({
        title: 'Found Item Reported!',
        description: `Your report for "${title}" has been posted. The owner will be able to find it!`,
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/browse');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to report found item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !location || !date) return;

    // We add handedOver context to description since our DB schema doesn't have handedOver field yet
    const fullDescription = `${description}\n\n[Current Location]: ${handedOver}`;

    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('title', title);
    formData.append('description', fullDescription);
    formData.append('category', category === 'other' ? `other:${categoryOther}` : category);
    formData.append('location', location);
    formData.append('locationDetail', location === 'other' ? locationOther : locationDetail);
    formData.append('date', date);

    // Append each image
    images.forEach((img) => {
      formData.append('images', img);
    });

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <Link
            to="/browse"
            className="inline-flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Browse</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Report a Found Item
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for helping! Fill in the details so the owner can identify and reclaim their item.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Item Name</Label>
              <Input
                id="title"
                placeholder="e.g. Apple AirPods Pro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v as ItemCategory); setCategoryOther(''); }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(categoryLabels) as [ItemCategory, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {category === 'other' && (
                  <Input
                    placeholder="Describe the category..."
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    required
                    maxLength={80}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date Found</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campus Area</Label>
                <Select value={location} onValueChange={(v) => { setLocation(v as CampusLocation); setLocationOther(''); }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(locationLabels) as [CampusLocation, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {location === 'other' && (
                  <Input
                    placeholder="Describe your location..."
                    value={locationOther}
                    onChange={(e) => setLocationOther(e.target.value)}
                    required
                    maxLength={120}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationDetail">Specific Location</Label>
                <Input
                  id="locationDetail"
                  placeholder={location === 'other' ? 'e.g. Room number, floor...' : 'e.g. Library Main Entrance'}
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  required={location !== 'other'}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Where is it now */}
            <div className="space-y-2">
              <Label htmlFor="handedOver">Where is the item now?</Label>
              <Input
                id="handedOver"
                placeholder="e.g. Security Office, or I still have it"
                value={handedOver}
                onChange={(e) => setHandedOver(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the item — color, condition, any identifying marks. Avoid sharing sensitive details publicly."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
            </div>

            {/* Photo upload */}
            <div className="space-y-2">
              <Label>Photos (optional, max 5)</Label>
              <label htmlFor="photo-upload" className="block border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click or drag photos here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5 MB each</p>
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {images.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  <p className="font-medium">Selected files:</p>
                  <ul className="list-disc list-inside">
                    {images.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Link to="/browse">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={mutation.isPending} size="lg">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {mutation.isPending ? 'Submitting...' : 'Report Found Item'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportFound;
