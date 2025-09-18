// Accessibility utilities and helpers

// ARIA live region manager
export class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();

  createRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    this.regions.set(id, region);
    return region;
  }

  announce(message: string, regionId: string = 'default'): void {
    let region = this.regions.get(regionId);
    if (!region) {
      region = this.createRegion(regionId);
    }
    region.textContent = message;
  }

  clear(regionId: string = 'default'): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = '';
    }
  }

  destroy(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.remove();
      this.regions.delete(regionId);
    }
  }

  destroyAll(): void {
    this.regions.forEach((region) => region.remove());
    this.regions.clear();
  }
}

// Focus management utilities
export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  saveFocus(): void {
    if (document.activeElement instanceof HTMLElement) {
      this.focusHistory.push(document.activeElement);
    }
  }

  restoreFocus(): void {
    const previousElement = this.focusHistory.pop();
    if (previousElement) {
      previousElement.focus();
    }
  }

  moveFocusTo(element: HTMLElement): void {
    this.saveFocus();
    element.focus();
  }

  moveFocusToFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      this.moveFocusTo(focusableElements[0]);
    }
  }

  moveFocusToLast(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      this.moveFocusTo(focusableElements[focusableElements.length - 1]);
    }
  }

  moveFocusToNext(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    this.moveFocusTo(focusableElements[nextIndex]);
  }

  moveFocusToPrevious(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const previousIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    this.moveFocusTo(focusableElements[previousIndex]);
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  private handlers: Map<string, () => void> = new Map();
  private isEnabled = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = this.getKeyString(event);
    const handler = this.handlers.get(key);
    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  private getKeyString(event: KeyboardEvent): string {
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    const key = event.key.toLowerCase();
    return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
  }

  addShortcut(key: string, handler: () => void): () => void {
    this.handlers.set(key, handler);
    return () => this.handlers.delete(key);
  }

  removeShortcut(key: string): void {
    this.handlers.delete(key);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.handlers.clear();
  }
}

// Color contrast checker
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  largeText: boolean;
} {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = (brightest + 0.05) / (darkest + 0.05);

  let level: 'AA' | 'AAA' | 'fail';
  if (ratio >= 7) {
    level = 'AAA';
  } else if (ratio >= 4.5) {
    level = 'AA';
  } else {
    level = 'fail';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    level,
    largeText: false // Would need font size context to determine
  };
}

// Screen reader detection
export function isScreenReaderActive(): Promise<boolean> {
  return new Promise((resolve) => {
    const testElement = document.createElement('div');
    testElement.setAttribute('aria-hidden', 'true');
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.width = '1px';
    testElement.style.height = '1px';
    testElement.style.overflow = 'hidden';
    testElement.textContent = 'Screen reader test';
    
    document.body.appendChild(testElement);

    const observer = new MutationObserver(() => {
      const isActive = testElement.offsetHeight === 0;
      observer.disconnect();
      document.body.removeChild(testElement);
      resolve(isActive);
    });

    observer.observe(testElement, { attributes: true });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      if (document.body.contains(testElement)) {
        document.body.removeChild(testElement);
      }
      resolve(false);
    }, 1000);
  });
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Color scheme detection
export function prefersColorScheme(): 'light' | 'dark' | 'no-preference' {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'no-preference';
}

// Announce page changes for screen readers
export function announcePageChange(pageTitle: string): void {
  const liveRegion = document.getElementById('page-announcements') || 
    (() => {
      const region = document.createElement('div');
      region.id = 'page-announcements';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
      return region;
    })();

  liveRegion.textContent = `Navigated to ${pageTitle}`;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

// Skip link functionality
export function setupSkipLinks(): void {
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  
  skipLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = (link as HTMLAnchorElement).getAttribute('href')?.slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (target) {
        event.preventDefault();
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Form validation announcements
export function announceFormError(element: HTMLElement, message: string): void {
  const liveRegion = document.getElementById('form-errors') ||
    (() => {
      const region = document.createElement('div');
      region.id = 'form-errors';
      region.setAttribute('aria-live', 'assertive');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
      return region;
    })();

  liveRegion.textContent = message;
  element.setAttribute('aria-invalid', 'true');
  element.setAttribute('aria-describedby', 'form-errors');

  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

// Loading state announcements
export function announceLoadingState(isLoading: boolean, context?: string): void {
  const liveRegion = document.getElementById('loading-announcements') ||
    (() => {
      const region = document.createElement('div');
      region.id = 'loading-announcements';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
      return region;
    })();

  const message = isLoading 
    ? `Loading ${context || 'content'}...`
    : `${context || 'Content'} loaded`;

  liveRegion.textContent = message;

  if (!isLoading) {
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

// Export all utilities
export const accessibilityUtils = {
  LiveRegionManager,
  FocusManager,
  KeyboardNavigation,
  checkColorContrast,
  isScreenReaderActive,
  prefersReducedMotion,
  prefersHighContrast,
  prefersColorScheme,
  announcePageChange,
  setupSkipLinks,
  announceFormError,
  announceLoadingState
};
