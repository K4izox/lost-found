import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: 'Login Successful',
        description: 'Welcome back! Redirecting to dashboard...',
      });
      navigate('/browse');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Search className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your President University account
              </CardDescription>
            </CardHeader>
            <CardContent>
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

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-accent hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/register" className="text-accent hover:underline font-medium">
                  Create account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Image/Brand */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-md text-center text-primary-foreground space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
              <Search className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">Lost & Found</h2>
          <p className="text-primary-foreground/80 text-lg">
            President University's official platform for reporting and finding lost items.
            Join our community and help reunite items with their owners.
          </p>
          <div className="flex justify-center space-x-8 pt-6">
            <div>
              <div className="text-3xl font-bold">150+</div>
              <div className="text-sm text-primary-foreground/60">Items Recovered</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-primary-foreground/60">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
