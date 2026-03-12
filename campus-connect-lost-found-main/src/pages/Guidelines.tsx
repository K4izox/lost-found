import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShieldAlert, BadgeInfo } from 'lucide-react';

const Guidelines = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />
            <main className="flex-1 container py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Community Guidelines</h1>
                        <p className="text-muted-foreground text-lg">
                            Rules and expectations for using Campus Connect.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <CheckCircle2 className="text-green-600 w-8 h-8" />
                                <CardTitle className="text-xl">Be Honest & Helpful</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Only report items that you genuinely found or lost. Provide accurate descriptions to ensure items get back to their rightful owners as quickly as possible. Don't claim items that don't belong to you.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <ShieldAlert className="text-amber-600 w-8 h-8" />
                                <CardTitle className="text-xl">Safety First</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">If you find someone's item, hand it over to campus security or a reliable lost and found counter on campus instead of meeting strangers. Use common sense. Keep personal boundaries.</p>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center gap-3">
                                <BadgeInfo className="text-primary w-8 h-8" />
                                <CardTitle className="text-xl">Respect the Community</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Our platform relies on the good faith and integrity of President University students. Any attempts to spam the system, abuse the messaging feature, or repeatedly post false items will result in immediate suspension.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Guidelines;
