import { abstractBackgrounds, BackgroundKey, OverlayType } from "@/lib/backgrounds";
import { cn } from "@/lib/utils";

interface AbstractBackgroundProps {
  backgroundKey: BackgroundKey;
  overlay?: OverlayType;
  className?: string;
  children?: React.ReactNode;
  containerClassName?: string;
}

/**
 * AbstractBackground Component
 * Renders a section with an abstract background and optional overlay
 *
 * TEXT COLOR GUIDELINES:
 * - For 'light', 'medium', or 'subtle' overlays: Use default dark text colors
 * - For 'dark' or 'gradient' overlays: Use white text with these utility classes:
 *   - .text-abstract-heading - For h1, h2, h3 headings
 *   - .text-abstract-body - For paragraph text
 *   - .text-abstract-display - For large display text
 *   - .text-abstract-muted - For secondary/muted text
 *   - .text-abstract-stat - For numbers and statistics
 *
 * Or use Tailwind: text-white with appropriate text-shadow
 */
export function AbstractBackground({
  backgroundKey,
  overlay = 'light',
  className = '',
  children,
  containerClassName = '',
}: AbstractBackgroundProps) {
  const backgroundUrl = abstractBackgrounds[backgroundKey];

  return (
    <div
      className={cn('relative bg-cover bg-center bg-no-repeat', className)}
      style={{ backgroundImage: `url('${backgroundUrl}')` }}
    >
      {/* Overlay Layer */}
      {overlay === 'light' && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      )}
      {overlay === 'medium' && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      )}
      {overlay === 'dark' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}
      {overlay === 'subtle' && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-lg" />
      )}
      {overlay === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm" />
      )}
      {overlay === 'none' && null}

      {/* Content Container */}
      <div className={cn('relative z-10', containerClassName)}>
        {children}
      </div>
    </div>
  );
}

/**
 * CardBackground Component
 * Applies abstract background to cards with proper contrast
 */
export function CardBackground({
  backgroundKey,
  className = '',
  children,
}: {
  backgroundKey: BackgroundKey;
  className?: string;
  children?: React.ReactNode;
}) {
  const backgroundUrl = abstractBackgrounds[backgroundKey];

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-cover bg-center bg-no-repeat',
        className
      )}
      style={{ backgroundImage: `url('${backgroundUrl}')` }}
    >
      {/* Card Overlay for readability */}
      <div className="absolute inset-0 bg-white/85 backdrop-blur-md" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * SectionBackground Component
 * Full-width section with abstract background
 */
export function SectionBackground({
  backgroundKey,
  overlay = 'light',
  className = '',
  contentClassName = '',
  children,
}: {
  backgroundKey: BackgroundKey;
  overlay?: OverlayType;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <AbstractBackground
      backgroundKey={backgroundKey}
      overlay={overlay}
      className={cn('w-full', className)}
      containerClassName={contentClassName}
    >
      {children}
    </AbstractBackground>
  );
}
