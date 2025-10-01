import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'luxury' | 'glass' | 'metallic';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ripple?: boolean;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'rotate' | 'none';
  animationDuration?: number;
  children: React.ReactNode;
}

export default function MagicButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  success = false,
  error = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ripple = true,
  hoverEffect = 'lift',
  animationDuration = 0.3,
  className,
  children,
  onClick,
  disabled,
  ...props
}: MagicButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  // Handle ripple effect
  const handleRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!ripple || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newRipple = {
      id: rippleIdRef.current++,
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  // Handle click with ripple
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    handleRipple(event);
    onClick?.(event);
  };

  // Variant styles - aligned with Button component system
  const variantStyles = {
    primary: "bg-gradient-to-r from-primary to-accent text-white hover:from-accent hover:to-secondary shadow-lg hover:shadow-xl transition-all",
    secondary: "bg-white/30 backdrop-blur-lg border-2 border-white/40 text-foreground hover:bg-white/50 shadow-md hover:shadow-lg transition-all",
    ghost: "hover:bg-white/20 text-slate-700 hover:text-slate-900",
    destructive: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-red-500/25",
    luxury: "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white shadow-2xl hover:shadow-purple-500/25",
    glass: "bg-white/25 backdrop-blur-xl border border-white/30 text-slate-900 hover:bg-white/35 shadow-md hover:shadow-lg transition-all",
    metallic: "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-amber-500/30 border-2 border-white/30"
  };

  // Size styles
  const sizeStyles = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    xl: "h-14 px-8 text-lg"
  };

  // Hover effect styles
  const hoverEffects = {
    lift: "miami-hover-lift",
    glow: "hover:shadow-2xl hover:shadow-primary/25",
    scale: "hover:scale-105",
    rotate: "hover:rotate-1",
    none: ""
  };

  // Status icons
  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (success) return <Check className="h-4 w-4" />;
    if (error) return <AlertCircle className="h-4 w-4" />;
    return icon;
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "overflow-hidden",
        variantStyles[variant],
        sizeStyles[size],
        hoverEffects[hoverEffect],
        fullWidth && "w-full",
        className
      )}
      onClick={handleClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={!isDisabled ? { scale: hoverEffect === 'scale' ? 1.05 : 1 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: animationDuration }}
      {...props}
    >
      {/* Magic MCP Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        
        {/* Sparkle effects */}
        {variant === 'luxury' && (
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-0"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${30 + i * 20}%`
                }}
                animate={{
                  opacity: isHovered ? [0, 1, 0] : 0,
                  scale: [0, 1.5, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: isHovered ? Infinity : 0,
                  repeatDelay: 2
                }}
              />
            ))}
          </div>
        )}

        {/* Glow effect */}
        {variant === 'luxury' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-cyan-400/20 rounded-lg"
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: animationDuration }}
          />
        )}
      </div>

      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        {/* Left Icon */}
        {getStatusIcon() && iconPosition === 'left' && (
          <motion.div
            animate={{
              rotate: loading ? 360 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ 
              rotate: { duration: 1, repeat: loading ? Infinity : 0 },
              scale: { duration: animationDuration }
            }}
          >
            {getStatusIcon()}
          </motion.div>
        )}

        {/* Text Content */}
        <motion.span
          animate={{
            y: isPressed ? 1 : 0
          }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.span>

        {/* Right Icon */}
        {getStatusIcon() && iconPosition === 'right' && (
          <motion.div
            animate={{
              rotate: loading ? 360 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ 
              rotate: { duration: 1, repeat: loading ? Infinity : 0 },
              scale: { duration: animationDuration }
            }}
          >
            {getStatusIcon()}
          </motion.div>
        )}
      </div>

      {/* Magic MCP Sparkle for luxury variant */}
      {variant === 'luxury' && (
        <motion.div
          className="absolute top-1 right-1"
          animate={{
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.2 : 1
          }}
          transition={{ 
            rotate: { duration: 2, repeat: isHovered ? Infinity : 0 },
            scale: { duration: animationDuration }
          }}
        >
          <Sparkles className="h-3 w-3 text-yellow-300" />
        </motion.div>
      )}

      {/* Pressed effect */}
      <motion.div
        className="absolute inset-0 bg-black/10 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPressed ? 1 : 0 }}
        transition={{ duration: 0.1 }}
      />
    </motion.button>
  );
}

// Specialized button variants
export const MagicPrimaryButton = (props: Omit<MagicButtonProps, 'variant'>) => (
  <MagicButton {...props} variant="primary" />
);

export const MagicLuxuryButton = (props: Omit<MagicButtonProps, 'variant'>) => (
  <MagicButton {...props} variant="luxury" hoverEffect="glow" />
);

export const MagicGlassButton = (props: Omit<MagicButtonProps, 'variant'>) => (
  <MagicButton {...props} variant="glass" hoverEffect="scale" />
);

export const MagicMetallicButton = (props: Omit<MagicButtonProps, 'variant'>) => (
  <MagicButton {...props} variant="metallic" hoverEffect="lift" />
);

// Button group component
export const MagicButtonGroup: React.FC<{
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, orientation = 'horizontal', spacing = 'md', className }) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
    md: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
    lg: orientation === 'horizontal' ? 'gap-4' : 'gap-4'
  };

  return (
    <div className={cn(
      "flex",
      orientation === 'vertical' ? 'flex-col' : 'flex-row',
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};
