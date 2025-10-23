/**
 * Abstract Background System for Florida Local
 * Provides easy access to abstract background images throughout the application
 */

export const abstractBackgrounds = {
  // Vibrant, energetic backgrounds
  vibrant1: '/backgrounds/colorful-series-circles-with-orange-blue-colors_889056-245202.jpg',
  vibrant2: '/backgrounds/208414429-a-close-up-of-a-colorful-abstract-painting-generative-ai-image.jpg',
  vibrant3: '/backgrounds/colorful-painting-with-black-background-white-blue-background_380557-143.avif',

  // Flowing, liquid backgrounds
  flowing1: '/backgrounds/abstract-flowing-liquid-glass-waves-on-black-background-smooth-texture-blue-and-orange-photo.jpg',
  flowing2: '/backgrounds/abstract-composition-with-intertwined-orange-blue-curves-wave-aig51_31965-634212.avif',

  // Geometric backgrounds
  geometric1: '/backgrounds/geometric-lines-intersecting-with-organic-shapes-hd-4k_964851-163761.jpg',
  geometric2: '/backgrounds/360_F_652778958_COkVj7I3ibeJHDY0fKzEuHj5ptec0AB3.jpg',

  // Bubble/particle backgrounds
  bubbles1: '/backgrounds/abstract-composition-glowing-bubbles-dark-background-with-orange-blue-tones_1090747-6434.avif',
  dynamic1: '/backgrounds/dynamic-abstract-patterns-with-overlapping-circles-spirals-creating-sense-motion_36897-73531.avif',
} as const;

export type BackgroundKey = keyof typeof abstractBackgrounds;

/**
 * Get a random abstract background
 */
export function getRandomBackground(): string {
  const keys = Object.keys(abstractBackgrounds) as BackgroundKey[];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return abstractBackgrounds[randomKey];
}

/**
 * Get background by theme
 */
export function getBackgroundByTheme(theme: 'vibrant' | 'flowing' | 'geometric' | 'bubbles'): string {
  const themes = {
    vibrant: [abstractBackgrounds.vibrant1, abstractBackgrounds.vibrant2, abstractBackgrounds.vibrant3],
    flowing: [abstractBackgrounds.flowing1, abstractBackgrounds.flowing2],
    geometric: [abstractBackgrounds.geometric1, abstractBackgrounds.geometric2],
    bubbles: [abstractBackgrounds.bubbles1, abstractBackgrounds.dynamic1],
  };

  const themeBackgrounds = themes[theme];
  return themeBackgrounds[Math.floor(Math.random() * themeBackgrounds.length)];
}

/**
 * CSS classes for abstract backgrounds with overlay effects
 */
export const backgroundClasses = {
  // Light overlay for readability
  light: 'bg-cover bg-center bg-no-repeat relative before:absolute before:inset-0 before:bg-white/80 before:backdrop-blur-sm',

  // Medium overlay
  medium: 'bg-cover bg-center bg-no-repeat relative before:absolute before:inset-0 before:bg-white/70 before:backdrop-blur-md',

  // Dark overlay for light text
  dark: 'bg-cover bg-center bg-no-repeat relative before:absolute before:inset-0 before:bg-black/60 before:backdrop-blur-sm',

  // Subtle overlay
  subtle: 'bg-cover bg-center bg-no-repeat relative before:absolute before:inset-0 before:bg-white/90 before:backdrop-blur-lg',

  // Gradient overlay (orange to blue - Florida Local brand)
  gradient: 'bg-cover bg-center bg-no-repeat relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-orange-500/20 before:via-blue-500/20 before:to-purple-500/20 before:backdrop-blur-sm',

  // No overlay (pure background)
  none: 'bg-cover bg-center bg-no-repeat',
} as const;

export type OverlayType = keyof typeof backgroundClasses;

/**
 * Generate inline style for background image
 */
export function getBackgroundStyle(backgroundKey: BackgroundKey): React.CSSProperties {
  return {
    backgroundImage: `url('${abstractBackgrounds[backgroundKey]}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

/**
 * Generate complete background style with overlay
 */
export function getBackgroundWithOverlay(
  backgroundKey: BackgroundKey,
  overlayColor: string = 'rgba(255, 255, 255, 0.85)',
  blurAmount: string = '10px'
): React.CSSProperties {
  return {
    backgroundImage: `url('${abstractBackgrounds[backgroundKey]}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative' as const,
  };
}
