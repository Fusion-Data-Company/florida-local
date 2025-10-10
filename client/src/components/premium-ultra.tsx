import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, Star, Zap } from 'lucide-react';

// ============================================
// ULTRA PREMIUM COMPONENTS - LEVEL 5 UPGRADE
// ============================================

// ANIMATED GRADIENT HERO BACKGROUND - DISABLED (causing content visibility issues)
export const AnimatedGradientHero = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  // Component simplified to just render children without gradient overlays
  // The gradient layers were visually blocking content despite pointer-events-none
  return <div className={className}>{children}</div>;
};

// PARTICLE EFFECTS SYSTEM - DISABLED (causing content visibility issues)
export const ParticleField = ({ count = 50, color = "cyan" }: { count?: number; color?: "cyan" | "pink" | "yellow" | "purple" }) => {
  // Component disabled - particles were visually blocking content
  return null;
};

// PREMIUM LOADING STATE
export const PremiumLoader = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      {/* Animated rings */}
      <div className="relative w-24 h-24">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: 'hsl(195, 100%, 50%)',
              borderRightColor: 'hsl(320, 85%, 55%)',
              animation: `spin ${2 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.2}s`,
              transform: `scale(${1 - i * 0.2})`,
            }}
          />
        ))}
        {/* Center glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Shimmer text */}
      <p
        className="text-xl font-bold"
        style={{
          background: 'linear-gradient(90deg, #06b6d4 0%, #ec4899 50%, #06b6d4 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'shimmer 2s linear infinite',
        }}
      >
        {text}
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// INTERACTIVE HOVER TRAIL - ENHANCED VERSION
export const HoverTrail = () => {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    let idCounter = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint = { x: e.clientX, y: e.clientY, id: idCounter++ };
      setTrail(prev => [...prev.slice(-20), newPoint]); // Keep more trail points
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Rainbow colors matching the demo
  const colors = [
    'rgba(6, 182, 212, 0.9)',    // cyan
    'rgba(139, 92, 246, 0.9)',   // purple
    'rgba(236, 72, 153, 0.9)',   // pink
    'rgba(251, 191, 36, 0.9)',   // amber
    'rgba(14, 165, 233, 0.9)',   // sky
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {trail.map((point, index) => {
        const colorIndex = index % colors.length;
        // Calculate recency: newest points (at end of array) should be most prominent
        const recency = trail.length - 1 - index;
        const opacity = 1 - (recency / trail.length);
        const size = 80 - (recency * 2); // Newest = largest (80px), oldest = smallest
        
        return (
          <div
            key={point.id}
            className="absolute rounded-full"
            style={{
              left: point.x,
              top: point.y,
              width: `${size}px`,
              height: `${size}px`,
              background: `radial-gradient(circle, ${colors[colorIndex]} 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              opacity: opacity * 0.9,
              animation: 'trail-fade-out 1.2s forwards',
              filter: 'blur(8px)',
              boxShadow: `0 0 ${size}px ${colors[colorIndex]}`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes trail-fade-out {
          0% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
          }
          100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};

// 3D TRANSFORM CARD
export const Transform3DCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / 20;
    setRotation({ x: -x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div
      className={`relative transition-transform duration-500 ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D depth layers */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(236, 72, 153, 0.1))',
          transform: 'translateZ(-20px)',
          filter: 'blur(20px)',
        }}
      />
      <div className="relative" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>
    </div>
  );
};

// AURORA AMBIENT LIGHTING - DISABLED (was blocking all page content)
export const AuroraAmbient = ({ intensity = "medium" }: { intensity?: "low" | "medium" | "high" }) => {
  // Component disabled to fix content blocking issue
  // Fixed position overlay with z-index was preventing page interaction
  return null;
};

// RIPPLE EFFECT BUTTON
export const RippleButton = ({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out',
          }}
        />
      ))}
      <span className="relative z-10">{children}</span>

      <style>{`
        @keyframes ripple {
          to {
            width: 500px;
            height: 500px;
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

// MICROINTERACTION ICON
export const MicroIcon = ({ children, color = "blue" }: { children: React.ReactNode; color?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.2) rotate(10deg)' : 'scale(1) rotate(0deg)',
      }}
    >
      {/* Glow effect */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            animation: 'glow-pulse 1s ease-in-out infinite',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};
