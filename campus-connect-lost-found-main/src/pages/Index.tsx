import { Search, ArrowRight, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ItemCard from '@/components/ItemCard';
import { useQuery } from '@tanstack/react-query';
import { fetchItems } from '@/lib/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import CountUp from 'react-countup';
import { Skeleton } from '@/components/ui/skeleton';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('token');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  const recentItems = items.filter((item) => item.status === 'active').slice(0, 6);

  const totalItems = items.length;
  const itemsRecovered = items.filter((i: any) => i.status === 'resolved' || i.status === 'claimed').length;
  const activeListings = items.filter((i: any) => i.status === 'active').length;
  const successRate = totalItems > 0 ? Math.round((itemsRecovered / totalItems) * 100) : 0;

  const stats = [
    {
      icon: Package,
      value: totalItems,
      label: 'Total Items Reported',
      color: 'text-primary',
      suffix: ''
    },
    {
      icon: CheckCircle,
      value: itemsRecovered,
      label: 'Items Recovered',
      color: 'text-success',
      suffix: ''
    },
    {
      icon: Clock,
      value: activeListings,
      label: 'Active Listings',
      color: 'text-accent',
      suffix: ''
    },
    {
      icon: TrendingUp,
      value: successRate,
      label: 'Success Rate',
      color: 'text-warning',
      suffix: '%'
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-20 md:py-32 overflow-hidden">
          {/* Background Animated Blobs */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-accent/30 blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="container relative">
            <motion.div
              className="max-w-3xl mx-auto text-center space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Find What You've Lost
              </motion.h1>
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-primary-foreground/80">
                The official Lost & Found platform for President University. Report lost items,
                find what you're looking for, and help reunite items with their owners.
              </motion.p>

              {/* Search Bar */}
              <motion.form variants={itemVariants} onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for lost or found items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-background text-foreground"
                  />
                </div>
                <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Search
                </Button>
              </motion.form>

              {/* Quick Actions */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-4 w-full px-4 sm:px-0">
                <Link to="/report-lost" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto bg-primary-foreground/10 border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground">
                    Report Lost Item
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/report-found" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto bg-primary-foreground/10 border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground">
                    Report Found Item
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-12 bg-secondary">
          <div className="container">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {stats.map((stat, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="text-center h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="pt-6 relative z-10">
                      <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} transition-transform duration-500 group-hover:scale-110`} />
                      <div className="text-3xl font-bold text-foreground">
                        <CountUp start={0} end={stat.value} duration={2.5} suffix={stat.suffix} enableScrollSpy scrollSpyOnce />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Recent Items Section */}
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recent Listings</h2>
                <p className="text-muted-foreground mt-1">Browse the latest lost and found items</p>
              </div>
              <Link to="/browse">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3 bg-card p-4 rounded-xl border object-cover">
                    <Skeleton className="h-[200px] w-full rounded-xl bg-muted/60" />
                    <div className="space-y-2 mt-4">
                      <Skeleton className="h-5 w-[80%] bg-muted/60" />
                      <Skeleton className="h-4 w-[60%] bg-muted/60" />
                      <Skeleton className="h-8 w-full mt-4 bg-muted/60" />
                    </div>
                  </div>
                ))
              ) : (
                recentItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-secondary">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">How It Works</h2>
              <p className="text-muted-foreground mt-2">Simple steps to find or report items</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Report an Item',
                  description: 'Lost something? Found an item? Report it with details and photos to help with identification.',
                },
                {
                  step: '02',
                  title: 'Search & Match',
                  description: 'Browse through listings or use our search to find items matching your lost belongings.',
                },
                {
                  step: '03',
                  title: 'Connect & Retrieve',
                  description: 'Use our secure messaging to connect with the finder and arrange item pickup.',
                },
              ].map((item, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="pt-8 pb-6">
                    <span className="absolute top-4 right-4 text-6xl font-bold text-muted/50">
                      {item.step}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!token && (
          <section className="py-16">
            <div className="container">
              <Card className="bg-primary text-primary-foreground overflow-hidden">
                <CardContent className="p-8 md:p-12 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
                  <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
                    Join the President University community in helping reunite lost items with their owners.
                    Create an account to report items and connect with others.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full px-4 sm:px-0">
                    <Link to="/register" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                        Create Account
                      </Button>
                    </Link>
                    <Link to="/browse" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 bg-transparent">
                        Browse Items
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
