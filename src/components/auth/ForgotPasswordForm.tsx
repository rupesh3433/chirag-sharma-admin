import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail, Sparkles, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

/* ---------------------------------------
   Validation Schema
--------------------------------------- */
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/* ---------------------------------------
   Component
--------------------------------------- */
const ForgotPasswordForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  /* ---------------------------------------
     Submit Handler
  --------------------------------------- */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      await authApi.forgotPassword(data.email);
    } catch {
      /**
       * IMPORTANT:
       * We intentionally ignore backend errors here
       * to avoid email enumeration and UI confusion.
       */
    } finally {
      setIsSubmitted(true);
      setIsLoading(false);

      toast({
        title: 'Check your email',
        description:
          'If your email is registered, you will receive a password reset link shortly.',
      });

      // Additional warning for non-admins
      toast({
        title: '⚠️ Admin Access Only',
        description: 'Only authorized admin accounts will receive the reset link.',
        variant: 'default',
      });
    }
  };

  /* ---------------------------------------
     UI
  --------------------------------------- */
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

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card-hover p-8 animate-slide-up border border-border/50">
          {isSubmitted ? (
            /* ---------------------------------------
               Success State
            --------------------------------------- */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4">
                <Mail className="h-6 w-6 text-success" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                Check your email
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                If your email is registered, you will receive a password reset link shortly.
              </p>
              <Link to="/admin/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          ) : (
            /* ---------------------------------------
               Form State
            --------------------------------------- */
            <>
              {/* Admin Warning Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Admin Access Only
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Password reset is restricted to authorized admin accounts only.
                      If you're not an admin, please contact support.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="font-display text-xl font-semibold text-center mb-2">
                Forgot password?
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Enter your email address and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your admin email"
                    {...register('email')}
                    className="h-11"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gradient-primary text-primary-foreground font-medium shadow-rose hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/admin/login"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;