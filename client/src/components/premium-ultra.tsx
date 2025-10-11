import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, Star, Zap } from 'lucide-react';

// ============================================
// ULTRA PREMIUM COMPONENTS - LEVEL 5 UPGRADE
// ============================================

// ANIMATED GRADIENT HERO BACKGROUND - RE-ENABLED with proper z-index layering
export const AnimatedGradientHero = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Gradient orb 1 - Cyan/Blue */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.4) 0%, transparent 50%)',
          filter: 'blur(60px)',
          animation: 'float-gradient-1 20s ease-in-out infinite',
        }}
      />
      
      {/* Gradient orb 2 - Purple */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 80% 60%, rgba(139, 92, 246, 0.35) 0%, transparent 50%)',
          filter: 'blur(70px)',
          animation: 'float-gradient-2 25s ease-in-out infinite',
        }}
      />
      
      {/* Gradient orb 3 - Pink */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
          filter: 'blur(80px)',
          animation: 'float-gradient-3 30s ease-in-out infinite',
        }}
      />
      
      {/* Content wrapper with positive z-index */}
      <div className="relative z-10">
        {children}
      </div>
      
      <style>{`
        @keyframes float-gradient-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10%, -5%) scale(1.1); }
          66% { transform: translate(-5%, 10%) scale(0.95); }
        }
        @keyframes float-gradient-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-8%, 8%) scale(1.05); }
          66% { transform: translate(12%, -10%) scale(0.9); }
        }
        @keyframes float-gradient-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-10%, -8%) scale(1.15); }
          66% { transform: translate(8%, 12%) scale(0.85); }
        }
      `}</style>
    </div>
  );
};

// PARTICLE EFFECTS SYSTEM - RE-ENABLED with proper z-index layering
export const ParticleField = ({ count = 50, color = "cyan" }: { count?: number; color?: "cyan" | "pink" | "yellow" | "purple" }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      size: 2 + Math.random() * 4,
    }));
    setParticles(newParticles);
  }, [count]);

  const colorMap = {
    cyan: 'rgba(6, 182, 212, 0.5)',
    pink: 'rgba(236, 72, 153, 0.5)',
    yellow: 'rgba(251, 191, 36, 0.5)',
    purple: 'rgba(139, 92, 246, 0.5)',
  };

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute -z-10 pointer-events-none rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: colorMap[color],
            opacity: 0.3 + Math.random() * 0.3,
            animation: `particle-float-${particle.id % 3} ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            boxShadow: `0 0 ${particle.size * 2}px ${colorMap[color]}`,
          }}
        />
      ))}
      <style>{`
        @keyframes particle-float-0 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-15px, -60px); }
          75% { transform: translate(25px, -40px); }
        }
        @keyframes particle-float-1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-25px, -25px); }
          50% { transform: translate(15px, -55px); }
          75% { transform: translate(-20px, -35px); }
        }
        @keyframes particle-float-2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -35px); }
          50% { transform: translate(-20px, -65px); }
          75% { transform: translate(10px, -45px); }
        }
      `}</style>
    </>
  );
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
        const opacity = Math.max(0.85, 1 - (recency / trail.length));
        const size = Math.max(28, 80 - (recency * 2.5)); // Newest = 80px, oldest = 28px minimum
        
        return (
          <div
            key={point.id}
            className="absolute rounded-full"
            style={{
              left: point.x,
              top: point.y,
              width: `${size}px`,
              height: `${size}px`,
              background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${colors[colorIndex]} 40%, transparent 65%)`,
              transform: 'translate(-50%, -50%)',
              opacity: opacity,
              animation: 'trail-fade-out-clean 1.2s forwards',
              filter: `drop-shadow(0 0 10px ${colors[colorIndex].replace('0.9', '0.5')})`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
      <style>{`
        @keyframes trail-fade-out-clean {
          0% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
          }
          100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(1.15);
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

// AURORA AMBIENT LIGHTING - RE-ENABLED with proper z-index layering
export const AuroraAmbient = ({ intensity = "medium" }: { intensity?: "low" | "medium" | "high" }) => {
  const intensityMap = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  };

  const opacityValue = intensityMap[intensity];

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Aurora wave 1 - Cyan/Blue */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.6) 0%, transparent 60%)',
          filter: 'blur(100px)',
          opacity: opacityValue,
          animation: 'aurora-wave-1 15s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />
      
      {/* Aurora wave 2 - Purple */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(225deg, rgba(139, 92, 246, 0.5) 0%, transparent 60%)',
          filter: 'blur(120px)',
          opacity: opacityValue * 0.9,
          animation: 'aurora-wave-2 20s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />
      
      {/* Aurora wave 3 - Pink */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, rgba(236, 72, 153, 0.4) 0%, transparent 60%)',
          filter: 'blur(110px)',
          opacity: opacityValue * 0.8,
          animation: 'aurora-wave-3 18s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />
      
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          filter: 'blur(80px)',
          opacity: opacityValue * 0.6,
          animation: 'aurora-shimmer 10s ease-in-out infinite',
          mixBlendMode: 'overlay',
        }}
      />
      
      <style>{`
        @keyframes aurora-wave-1 {
          0%, 100% { 
            transform: translateX(0) translateY(0) scale(1);
            opacity: ${opacityValue};
          }
          33% { 
            transform: translateX(-10%) translateY(5%) scale(1.05);
            opacity: ${opacityValue * 1.2};
          }
          66% { 
            transform: translateX(5%) translateY(-8%) scale(0.95);
            opacity: ${opacityValue * 0.8};
          }
        }
        @keyframes aurora-wave-2 {
          0%, 100% { 
            transform: translateX(0) translateY(0) rotate(0deg);
            opacity: ${opacityValue * 0.9};
          }
          33% { 
            transform: translateX(8%) translateY(-6%) rotate(2deg);
            opacity: ${opacityValue * 1.1};
          }
          66% { 
            transform: translateX(-6%) translateY(10%) rotate(-2deg);
            opacity: ${opacityValue * 0.7};
          }
        }
        @keyframes aurora-wave-3 {
          0%, 100% { 
            transform: translateX(0) translateY(0) scale(1);
            opacity: ${opacityValue * 0.8};
          }
          33% { 
            transform: translateX(6%) translateY(8%) scale(1.1);
            opacity: ${opacityValue};
          }
          66% { 
            transform: translateX(-8%) translateY(-5%) scale(0.9);
            opacity: ${opacityValue * 0.6};
          }
        }
        @keyframes aurora-shimmer {
          0%, 100% { 
            transform: scale(1);
            opacity: ${opacityValue * 0.6};
          }
          50% { 
            transform: scale(1.3);
            opacity: ${opacityValue * 0.9};
          }
        }
      `}</style>
    </div>
  );
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
