import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

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

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
      toast({
        title: 'Email sent',
        description: 'If your email is registered, you will receive a reset link.',
      });
    } catch (error) {
      // Always show the same message for security
      setIsSubmitted(true);
      toast({
        title: 'Email sent',
        description: 'If your email is registered, you will receive a reset link.',
      });
    } finally {
      setIsLoading(false);
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

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card-hover p-8 animate-slide-up border border-border/50">
          {isSubmitted ? (
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
            <>
              <h2 className="font-display text-xl font-semibold text-center mb-2">
                Forgot password?
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Enter your email address and we'll send you a reset link.
              </p>

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
