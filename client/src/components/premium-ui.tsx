import React from 'react';
import { Sparkles, Crown, Star } from 'lucide-react';

// PREMIUM METALLIC BADGE - Universal component
export const PremiumBadge = ({
  children,
  color = "gold",
  className = "",
  size = "md"
}: {
  children: React.ReactNode;
  color?: "gold" | "platinum" | "bronze" | "emerald" | "ruby" | "diamond" | "sapphire" | "topaz" | "amethyst" | "crimson" | "pearl";
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const colorStyles = {
    gold: {
      background: 'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f093fb 100%)',
      shadow: '0 4px 20px rgba(246, 211, 101, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    platinum: {
      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
      shadow: '0 4px 20px rgba(192, 210, 254, 0.5), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.15)',
    },
    bronze: {
      background: 'linear-gradient(135deg, #cd7f32 0%, #e89b5c 50%, #fbb574 100%)',
      shadow: '0 4px 20px rgba(205, 127, 50, 0.5), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.25)',
    },
    emerald: {
      background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
      shadow: '0 4px 20px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    ruby: {
      background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)',
      shadow: '0 4px 20px rgba(244, 63, 94, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    diamond: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)',
      shadow: '0 4px 25px rgba(56, 189, 248, 0.6), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.1)',
    },
    sapphire: {
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      shadow: '0 4px 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    topaz: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)',
      shadow: '0 4px 20px rgba(251, 191, 36, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    amethyst: {
      background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)',
      shadow: '0 4px 20px rgba(124, 58, 237, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    crimson: {
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
      shadow: '0 4px 20px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    pearl: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      shadow: '0 4px 20px rgba(226, 232, 240, 0.5), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.15)',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const style = colorStyles[color];

  return (
    <div
      className={`relative inline-flex items-center gap-2 rounded-xl overflow-hidden font-bold uppercase tracking-wide text-white transform hover:scale-105 transition-all duration-300 ${sizeClasses[size]} ${className}`}
      style={{
        background: style.background,
        boxShadow: style.shadow,
      }}
    >
      {/* Animated shimmer overlay */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.9) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }}
      ></div>
      {/* Glass-face effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
        }}
      ></div>
      <Sparkles className="h-3 w-3 relative z-10" />
      <span className="relative z-10 drop-shadow-md">{children}</span>
    </div>
  );
};

// PREMIUM GLASS CARD - Universal component
export const PremiumGlassCard = ({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${hover ? 'hover:-translate-y-2 hover:shadow-2xl' : ''} ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(30px) saturate(180%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,1), 0 0 0 2px rgba(255,255,255,0.5)',
        border: '2px solid rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Shimmer overlay */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      )}
      {children}
    </div>
  );
};

// PREMIUM BUTTON - Universal component
export const PremiumButton = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) => {
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #19b6f6 0%, #10b981 50%, #fda085 100%)',
      shadow: '0 6px 25px rgba(25, 182, 246, 0.4)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
      shadow: '0 6px 25px rgba(139, 92, 246, 0.4)',
    },
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
      shadow: '0 6px 25px rgba(16, 185, 129, 0.4)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)',
      shadow: '0 6px 25px rgba(239, 68, 68, 0.4)',
    },
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const style = variantStyles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl font-bold text-white transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
      style={{
        background: style.background,
        boxShadow: `${style.shadow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      {/* Shimmer effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.7) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }}
      ></div>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

// PREMIUM INPUT - Universal component
export const PremiumInput = ({
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  icon,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:border-transparent ${className}`}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(200, 200, 220, 0.5)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      />
    </div>
  );
};

// PREMIUM SELECT - Universal component
export const PremiumSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  className?: string;
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl border-2 appearance-none cursor-pointer transition-all duration-300 focus:outline-none focus:ring-4 focus:border-transparent font-semibold text-gray-700 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(200, 200, 220, 0.5)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%234B5563\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '1.5rem',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-medium">
          {opt.label}
        </option>
      ))}
    </select>
  );
};

// PREMIUM ICON WRAPPER - Makes ANY icon premium
export const PremiumIcon = ({
  children,
  color = "blue",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  color?: "blue" | "purple" | "gold" | "green" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const colors = {
    blue: 'from-blue-400 to-cyan-500',
    purple: 'from-purple-400 to-pink-500',
    gold: 'from-yellow-400 to-orange-500',
    green: 'from-emerald-400 to-teal-500',
    red: 'from-red-400 to-rose-500',
  };

  const sizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg hover:scale-110 transition-transform duration-300 ${sizes[size]} ${className}`}
      style={{
        boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      {children}
    </div>
  );
};
