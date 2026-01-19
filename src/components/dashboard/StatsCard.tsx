import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
  success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
  warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
  info: 'bg-gradient-to-br from-info/10 to-info/5 border-info/20',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
}: StatsCardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground font-display">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
