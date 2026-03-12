import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
    const faqs = [
        {
            question: "How do I report a lost item?",
            answer: "Click on the 'Report Lost' button in the navigation bar, fill in the details of the item you lost including a description, category, and where you think you lost it. Add a photo if you have one.",
        },
        {
            question: "What should I do if I find an item?",
            answer: "Use the 'Report Found' button. Provide as much detail as possible about the item and where you found it. If you turned it in to a security desk, please mention the location.",
        },
        {
            question: "How do I claim an item?",
            answer: "Go to the item's detail page and click 'Claim Item'. You will need to provide proof of ownership, such as a detailed description of distinctive features, a receipt, or a photo of you with the item.",
        },
        {
            question: "Who can see my contact information?",
            answer: "Your contact information is kept private. Communication happens through our secure messaging system until you decide to share your details with another user to arrange an exchange.",
        }
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />
            <main className="flex-1 container py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
                        <p className="text-muted-foreground text-lg">
                            Find answers to common questions about using the Campus Connect Lost & Found platform.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>General Questions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQ;
