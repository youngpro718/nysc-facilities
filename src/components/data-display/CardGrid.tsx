
import { cn } from "@/lib/utils";

interface CardGridProps {
  children: React.ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export function CardGrid({ 
  children, 
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'medium',
  className 
}: CardGridProps) {
  const gapClass = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  }[gap];

  const getColumnsClass = () => {
    const classes = [];
    
    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={cn('grid', getColumnsClass(), gapClass, className)}>
      {children}
    </div>
  );
}
