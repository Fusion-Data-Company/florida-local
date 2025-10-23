import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  disabled?: boolean;
}

export const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  className,
  intensity = 'medium',
  disabled = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 3D rotation intensity based on prop
    const rotationMultiplier = intensity === 'high' ? 15 : intensity === 'medium' ? 10 : 5;
    const rotateX = (y - centerY) / rotationMultiplier;
    const rotateY = (centerX - x) / rotationMultiplier;

    // Update CSS custom properties for holographic effect
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
    card.style.setProperty('--bg-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--bg-y', `${(y / rect.height) * 100}%`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (disabled || !cardRef.current) return;

    const card = cardRef.current;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    card.style.setProperty('--x', '50%');
    card.style.setProperty('--y', '50%');
    card.style.setProperty('--bg-x', '50%');
    card.style.setProperty('--bg-y', '50%');
  };

  return (
    <div
      className={cn('holographic-card', className)}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--x': '50%',
        '--y': '50%',
        '--bg-x': '50%',
        '--bg-y': '50%',
      } as React.CSSProperties}
    >
      {children}
      <div className="holo-glow"></div>
    </div>
  );
};

export default HolographicCard;
