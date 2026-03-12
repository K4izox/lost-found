import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />
            <main className="flex-1 container py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
                        <p className="text-muted-foreground text-lg">
                            Effective Date: October 2026
                        </p>
                    </div>

                    <Card className="p-6 prose max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {`Welcome to Campus Connect! 

1. Acceptance of Terms
By accessing or using the Campus Connect Lost & Found service, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.

2. User Responsibilities
You agree to use this platform strictly for reporting lost or found items within President University. You agree not to:
- Post false, inaccurate, or misleading information about items.
- Solicit passwords or personal info for commercial or unlawful purposes.
- Impersonate any person or entity.

3. Dispute Over Items
Campus Connect acts only as a communication channel. We are not responsible for any disputes that emerge during the handover of items. Always arrange meetings in public, safe areas like campus security points or administration offices.

4. Account Termination
We reserve the right to suspend or terminate accounts that breach these Terms or for any other reason at our sole discretion without prior notice.

5. Modifications
These Terms may be updated at any time. Continued use of the platform indicates your agreement to those changes.`}
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
