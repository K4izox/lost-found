import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />
            <main className="flex-1 container py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                        <p className="text-muted-foreground text-lg">
                            Effective Date: October 2026
                        </p>
                    </div>

                    <Card className="p-6 prose max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {`Thank you for using Campus Connect. Your privacy is critically important to us at President University.

1. Information We Collect
We collect information you provide directly to us when you register for an account, create or modify your profile, post items, request services, or communicate with us. This includes names, emails, and any photos you upload.

2. How We Use Information
We use the information we collect to operate, maintain, and provide the functionality of the service. We may also use it to communicate with you, such as sending notifications, alerts, and customer service.

3. Sharing of Information
We will not rent or sell your personal information to third parties. We may store personal information in locations outside the direct control of Campus Connect (for instance, on servers or databases co-located with hosting providers).

4. Security
We care about the security of your information and use commercially reasonable safeguards to preserve the integrity and security of all information collected through the service.`}
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
