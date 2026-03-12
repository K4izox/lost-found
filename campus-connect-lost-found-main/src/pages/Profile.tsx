import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ItemCard from '@/components/ItemCard';
import { User, Camera, Mail, Shield, Loader2, Package } from 'lucide-react';
import { Label } from '@/components/ui/label';

const Profile = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfile,
    });

    const updateProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            localStorage.setItem('user', JSON.stringify(updatedUser)); // update local storage cache too
            setIsEditing(false);
            toast({ title: 'Profile Updated', description: 'Your profile has been updated successfully.' });
        },
        onError: (error: any) => {
            toast({
                title: 'Update Failed',
                description: error.message || 'There was an error updating your profile.',
                variant: 'destructive',
            });
        }
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        updateProfileMutation.mutate(formData);
    };

    const handleSaveName = () => {
        if (editName.trim() === '') return setIsEditing(false);
        const formData = new FormData();
        formData.append('name', editName);
        updateProfileMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 bg-muted/30">
                <div className="container py-12 max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left sidebar - Profile Card */}
                        <div className="md:col-span-1 space-y-6">
                            <Card className="border-0 shadow-sm overflow-hidden">
                                <div className="h-24 bg-gradient-to-r from-primary to-primary/60 relative" />
                                <CardContent className="pt-0 relative px-6 pb-6">
                                    <div className="flex justify-center -mt-12 mb-4">
                                        <div className="relative group">
                                            <div className="h-24 w-24 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center">
                                                {profile.avatar ? (
                                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-10 w-10 text-muted-foreground" />
                                                )}
                                            </div>
                                            <button
                                                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={updateProfileMutation.isPending}
                                            >
                                                <Camera className="h-4 w-4" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center space-y-1 mb-6">
                                        {isEditing ? (
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Your name"
                                                    className="h-8"
                                                />
                                                <Button size="sm" onClick={handleSaveName} disabled={updateProfileMutation.isPending}>Save</Button>
                                            </div>
                                        ) : (
                                            <div className="group flex items-center justify-center gap-2">
                                                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                                                <button onClick={() => { setEditName(profile.name); setIsEditing(true); }} className="text-muted-foreground hover:text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                                            <Mail className="h-3 w-3" /> {profile.email}
                                        </p>
                                        <div className="pt-2 flex justify-center">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                <Shield className="mr-1 h-3 w-3" />
                                                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Content - Items */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle>My Reported Items</CardTitle>
                                    <CardDescription>A track record of all items you've submitted to the platform</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {profile.items && profile.items.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {profile.items.map((item: any) => (
                                                <ItemCard key={item.id} item={{ ...item, userName: profile.name, userAvatar: profile.avatar }} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 px-4 border rounded-xl border-dashed">
                                            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium text-foreground">No items reported</h3>
                                            <p className="text-sm text-muted-foreground mt-1">You haven't reported any lost or found items yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Profile;
