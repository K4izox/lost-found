import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ItemCard from '@/components/ItemCard';
import { useQuery } from '@tanstack/react-query';
import { fetchItems } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemType, ItemCategory, CampusLocation, categoryLabels, locationLabels, Item } from '@/lib/types';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState<ItemType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ItemCategory[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<CampusLocation[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch from backend
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  // Filter items
  const filteredItems = useMemo(() => {
    let currentItems = [...items];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      currentItems = currentItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      currentItems = currentItems.filter((item) => selectedTypes.includes(item.type));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      currentItems = currentItems.filter((item) => selectedCategories.includes(item.category));
    }

    // Location filter
    if (selectedLocations.length > 0) {
      currentItems = currentItems.filter((item) => selectedLocations.includes(item.location));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        currentItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        currentItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    return currentItems;
  }, [items, searchQuery, selectedTypes, selectedCategories, selectedLocations, sortBy]);

  const toggleType = (type: ItemType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCategory = (category: ItemCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleLocation = (location: CampusLocation) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSearchQuery('');
  };

  const activeFiltersCount =
    selectedTypes.length + selectedCategories.length + selectedLocations.length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Item Type */}
      <div>
        <h3 className="font-medium mb-3">Item Type</h3>
        <div className="space-y-2">
          {(['lost', 'found'] as ItemType[]).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <Label htmlFor={`type-${type}`} className="text-sm capitalize">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-medium mb-3">Category</h3>
        <div className="space-y-2">
          {(Object.keys(categoryLabels) as ItemCategory[]).map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label htmlFor={`category-${category}`} className="text-sm">
                {categoryLabels[category]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <h3 className="font-medium mb-3">Location</h3>
        <div className="space-y-2">
          {(Object.keys(locationLabels) as CampusLocation[]).map((location) => (
            <div key={location} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location}`}
                checked={selectedLocations.includes(location)}
                onCheckedChange={() => toggleLocation(location)}
              />
              <Label htmlFor={`location-${location}`} className="text-sm">
                {locationLabels[location]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary">
        {/* Hero Search Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b py-10">
          <div className="container">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Browse Items</h1>
              <p className="text-muted-foreground mt-1 text-sm">Search through all lost & found reports on campus</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-border/60 bg-background/80 backdrop-blur-sm shadow-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-11 rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden h-11 rounded-xl relative">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {selectedTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="capitalize rounded-full">
                    {type}
                    <button onClick={() => toggleType(type)} className="ml-1"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="rounded-full">
                    {categoryLabels[category]}
                    <button onClick={() => toggleCategory(category)} className="ml-1"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {selectedLocations.map((location) => (
                  <Badge key={location} variant="secondary" className="rounded-full">
                    {locationLabels[location]}
                    <button onClick={() => toggleLocation(location)} className="ml-1"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="font-semibold mb-4">Filters</h2>
                  <FilterContent />
                </CardContent>
              </Card>
            </aside>

            {/* Items Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredItems.length}</span> items
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3 bg-card p-4 rounded-xl border object-cover">
                      <Skeleton className="h-[200px] w-full rounded-xl bg-muted/60" />
                      <div className="space-y-2 mt-4">
                        <Skeleton className="h-5 w-[80%] bg-muted/60" />
                        <Skeleton className="h-4 w-[60%] bg-muted/60" />
                        <Skeleton className="h-8 w-full mt-4 bg-muted/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  layout
                >
                  <AnimatePresence mode='popLayout'>
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ItemCard item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-6xl mb-4">🔎</div>
                  <h3 className="text-xl font-semibold mb-2">No items found</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="rounded-full px-6">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Browse;
