import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Your utility for merging class names
import { useRef } from "react";

// Prop types remain the same
export interface Stat {
  icon: React.ReactNode;
  label: string;
}

export interface AnimatedHikeCardProps {
  title: string;
  images: string[];
  stats: Stat[];
  description: string;
  href: string;
  className?: string;
}

export const AnimatedHikeCard = React.forwardRef<
  HTMLAnchorElement,
  AnimatedHikeCardProps
>(({ title, images, stats, description, href, className }, ref) => {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
    card.style.setProperty('--bg-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--bg-y', `${(y / rect.height) * 100}%`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-0.25rem)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    card.style.setProperty('--x', '50%');
    card.style.setProperty('--y', '50%');
    card.style.setProperty('--bg-x', '50%');
    card.style.setProperty('--bg-y', '50%');
  };

  const combinedRef = (node: HTMLAnchorElement | null) => {
    (cardRef as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
    }
  };

  return (
    <a
      ref={combinedRef}
      href={href}
      className={cn(
        "holographic-card group relative block w-full max-w-sm cursor-pointer rounded-2xl p-6 transition-all duration-300 ease-in-out hover:shadow-lg lg:max-w-md",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label={`Learn more about ${title}`}
      style={{
        '--x': '50%',
        '--y': '50%',
        '--bg-x': '50%',
        '--bg-y': '50%',
      } as React.CSSProperties}
    >
      <div className="holo-content flex flex-col">
        {/* Card Header: Title and Arrow */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tighter text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{title}</h2>
          <ArrowRight className="h-6 w-6 text-white transition-transform duration-300 ease-in-out group-hover:translate-x-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
        </div>

        {/* Stacked Images with CORRECTED Hover Animation */}
        <div className="relative mb-6 h-32">
          {images.map((src, index) => (
            <div
              key={index}
              className={cn(
                "absolute h-full w-[40%] overflow-hidden rounded-lg border-2 border-white/40 shadow-md transition-all duration-300 ease-in-out",
                // On hover, apply transforms using the CSS variables defined in `style`
                "group-hover:translate-x-[var(--tx)] group-hover:rotate-[var(--r)]"
              )}
              style={{
                // Set initial transform for the stacked look
                transform: `translateX(${index * 32}px)`,
                // Define CSS variables for the hover state transforms
                '--tx': `${index * 80}px`,
                '--r': `${index * 5 - 5}deg`,
                zIndex: images.length - index,
              } as React.CSSProperties}
            >
              <img
                src={src}
                alt={`${title} view ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mb-4 flex items-center space-x-4 text-sm text-white/90">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-1.5">
              {stat.icon}
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-white/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          {description}
        </p>
      </div>
      <div className="holo-glow"></div>
    </a>
  );
});

AnimatedHikeCard.displayName = "AnimatedHikeCard";
