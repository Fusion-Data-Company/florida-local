import React from 'react';
import { motion } from 'framer-motion';
import { spinnerVariants, pulseVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'slate';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'magic';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    white: 'text-white',
    slate: 'text-slate-600'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            className={cn(
              'border-2 border-current border-t-transparent rounded-full',
              sizeClasses[size],
              colorClasses[color]
            )}
            variants={spinnerVariants}
            animate="animate"
          />
        );

      case 'dots':
        return (
          <div className={cn('flex gap-1', sizeClasses[size])}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  'rounded-full bg-current',
                  size === 'sm' ? 'w-1 h-1' : 
                  size === 'md' ? 'w-2 h-2' : 
                  size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
                )}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={cn(
              'rounded-full bg-current',
              sizeClasses[size]
            )}
            variants={pulseVariants}
            animate="animate"
          />
        );

      case 'bars':
        return (
          <div className={cn('flex gap-1 items-end', sizeClasses[size])}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  'bg-current',
                  size === 'sm' ? 'w-1' : 
                  size === 'md' ? 'w-2' : 
                  size === 'lg' ? 'w-3' : 'w-4'
                )}
                animate={{
                  height: ['20%', '100%', '20%']
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        );

      case 'magic':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            <motion.div
              className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full"
              variants={spinnerVariants}
              animate="animate"
            />
            <motion.div
              className="absolute inset-1 border-2 border-accent border-b-transparent rounded-full"
              variants={spinnerVariants}
              animate="animate"
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <motion.div
              className="absolute inset-2 border-2 border-secondary border-l-transparent rounded-full"
              variants={spinnerVariants}
              animate="animate"
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('flex flex-col items-center gap-2', text && 'gap-3')}>
        <div className={colorClasses[color]}>
          {renderSpinner()}
        </div>
        {text && (
          <motion.p
            className={cn('text-sm font-medium', colorClasses[color])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
}

// Specialized loading components
export const LoadingPage: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div
    className="premium-page-wrapper premium-surface min-h-screen flex items-center justify-center marble-texture abstract-overlay-light"
    data-surface-intensity="delicate"
  >
    <LoadingSpinner size="xl" variant="magic" text={text} />
  </div>
);

export const LoadingCard: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" variant="dots" text={text} />
  </div>
);

export const LoadingButton: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" variant="spinner" color="white" />
    <span>{text}</span>
  </div>
);

export const LoadingOverlay: React.FC<{ text?: string; show?: boolean }> = ({ 
  text = 'Loading...', 
  show = true 
}) => {
  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="miami-glass rounded-2xl p-8 miami-card-glow">
        <LoadingSpinner size="xl" variant="magic" text={text} color="primary" />
      </div>
    </motion.div>
  );
};
