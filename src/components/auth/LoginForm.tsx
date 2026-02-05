import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing in...');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoadingMessage('Signing in...');

    // Progressive loading messages to keep user informed
    const messageTimer1 = setTimeout(() => {
      setLoadingMessage('Connecting to server...');
    }, 5000); // 5 seconds

    const messageTimer2 = setTimeout(() => {
      setLoadingMessage('Verifying credentials...');
    }, 15000); // 15 seconds

    const messageTimer3 = setTimeout(() => {
      setLoadingMessage('Almost there...');
    }, 30000); // 30 seconds

    const messageTimer4 = setTimeout(() => {
      setLoadingMessage('Please wait, server is responding...');
    }, 45000); // 45 seconds

    try {
      // Login with extended timeout (90 seconds handled by axios)
      await login(data.email, data.password);

      // Clear all timers on success
      clearTimeout(messageTimer1);
      clearTimeout(messageTimer2);
      clearTimeout(messageTimer3);
      clearTimeout(messageTimer4);

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      navigate('/admin/dashboard');
    } catch (error: any) {
      // Clear all timers on error
      clearTimeout(messageTimer1);
      clearTimeout(messageTimer2);
      clearTimeout(messageTimer3);
      clearTimeout(messageTimer4);

      // Extract error message from various sources
      const errorMessage = 
        error.message || 
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Invalid email or password. Please try again.';
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 6000, // Show error for 6 seconds
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('Signing in...');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-rose mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            JinniChirag
          </h1>
          <p className="text-muted-foreground mt-2">Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-card-hover p-8 animate-slide-up border border-border/50">
          <h2 className="font-display text-xl font-semibold text-center mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className="h-11"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="h-11 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Loading Status - Shows when request is in progress */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-2 space-y-2 bg-muted/50 rounded-lg px-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground animate-pulse font-medium">
                    {loadingMessage}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  This may take up to a minute. Please don't close this page.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 gradient-primary text-primary-foreground font-medium shadow-rose hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/admin/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 JinniChirag Makeup Artist
        </p>
      </div>
    </div>
  );
};

export default LoginForm;