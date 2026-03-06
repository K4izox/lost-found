import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-secondary">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                {isSubmitted ? (
                  <CheckCircle className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <Search className="h-6 w-6 text-primary-foreground" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
            </CardTitle>
            <CardDescription>
              {isSubmitted
                ? `We've sent a password reset link to ${submittedEmail}`
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-success" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-accent hover:underline font-medium"
                  >
                    try another email address
                  </button>
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.name@president.ac.id"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </Form>
            )}

            {!isSubmitted && (
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Remember your password? </span>
                <Link to="/login" className="text-accent hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
