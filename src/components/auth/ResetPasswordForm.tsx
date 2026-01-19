import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast({
        title: 'Invalid link',
        description: 'The reset link is invalid or has expired.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
      toast({
        title: 'Password reset successful',
        description: 'You can now log in with your new password.',
      });
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: 'The reset link is invalid or has expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4">
        <div className="bg-card rounded-2xl shadow-card-hover p-8 max-w-md w-full text-center border border-border/50">
          <h2 className="font-display text-xl font-semibold text-destructive mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            The password reset link is invalid or has expired.
          </p>
          <Link to="/admin/forgot-password">
            <Button className="w-full">Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          {isSuccess ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                Password reset successful!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link to="/admin/login">
                <Button className="w-full gradient-primary text-primary-foreground">
                  Go to login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-center mb-2">
                Reset your password
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      {...register('password')}
                      className="h-11 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      {...register('confirmPassword')}
                      className="h-11 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
                      Resetting...
                    </>
                  ) : (
                    'Reset password'
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

export default ResetPasswordForm;
