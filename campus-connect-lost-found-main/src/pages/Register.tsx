import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { registerUser } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .refine(
      (email) => email.endsWith('@president.ac.id') || email.endsWith('@student.president.ac.id'),
      'Please use your President University email (@president.ac.id or @student.president.ac.id)'
    ),
  role: z.enum(['student', 'lecturer', 'staff'], {
    required_error: 'Please select your role',
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Store token and redirect
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: 'Registration Successful',
        description: 'Welcome to Campus Connect!',
      });
      navigate('/browse');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterForm) => {
    mutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-md text-center text-primary-foreground space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
              <Search className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">Join Our Community</h2>
          <p className="text-primary-foreground/80 text-lg">
            Create an account to report lost items, find your belongings,
            and help others in the President University community.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-6 text-left">
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <div className="font-semibold mb-1">📦 Report Items</div>
              <div className="text-sm text-primary-foreground/70">Easily report lost or found items</div>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <div className="font-semibold mb-1">🔍 Smart Search</div>
              <div className="text-sm text-primary-foreground/70">Find items with powerful filters</div>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <div className="font-semibold mb-1">💬 Secure Chat</div>
              <div className="text-sm text-primary-foreground/70">Connect safely with finders</div>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <div className="font-semibold mb-1">🔔 Notifications</div>
              <div className="text-sm text-primary-foreground/70">Get alerts when items match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
              <div className="flex justify-center mb-4 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Search className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Register with your President University email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.name@student.president.ac.id"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="lecturer">Lecturer</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
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
                              placeholder="Create a strong password"
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-accent hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
