import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Upload, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { categoryLabels, locationLabels, type ItemCategory, type CampusLocation } from '@/lib/types';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '@/lib/api';

const ReportLost = () => {
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
  const [images, setImages] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      toast({
        title: 'Lost Item Reported!',
        description: `Your report for "${title}" has been posted. We hope you find it soon!`,
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/browse');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to report lost item. Please try again.',
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

    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('title', title);
    formData.append('description', description);
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
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Report a Lost Item
          </h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details below to let the campus community help you find your item.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Item Name</Label>
              <Input
                id="title"
                placeholder="e.g. Black Leather Wallet"
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
                <Label htmlFor="date">Date Lost</Label>
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
                  placeholder={location === 'other' ? 'e.g. Room number, floor...' : 'e.g. Room 405, Floor 2'}
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  required={location !== 'other'}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the item in detail — color, brand, distinguishing marks, contents, etc."
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
              <Button type="submit" disabled={mutation.isPending} size="lg" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {mutation.isPending ? 'Submitting...' : 'Report Lost Item'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportLost;
