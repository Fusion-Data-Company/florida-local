// Performance optimization utilities

// Debounce function for search and input handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll and resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Image preloader
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}

// Bundle size analyzer helper
export function getBundleSize(): Promise<number> {
  return new Promise((resolve) => {
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      const resources = window.performance.getEntriesByType('resource');
      const totalSize = resources.reduce((total, resource) => {
        if (resource.transferSize) {
          return total + resource.transferSize;
        }
        return total;
      }, 0);
      resolve(totalSize);
    } else {
      resolve(0);
    }
  });
}

// Memory usage monitor
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return { used: 0, total: 0, percentage: 0 };
}

// Performance metrics collector
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

  startTiming(name: string): void {
    this.metrics.set(name, [performance.now()]);
  }

  endTiming(name: string): number {
    const timings = this.metrics.get(name);
    if (!timings || timings.length === 0) {
      console.warn(`No start timing found for "${name}"`);
      return 0;
    }
    const duration = performance.now() - timings[0];
    this.metrics.set(name, [...timings, duration]);
    return duration;
  }

  getAverage(name: string): number {
    const timings = this.metrics.get(name);
    if (!timings || timings.length < 2) return 0;
    
    const durations = timings.slice(1);
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    this.metrics.forEach((timings, name) => {
      if (timings.length > 1) {
        const durations = timings.slice(1);
        result[name] = {
          average: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
          count: durations.length
        };
      }
    });
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Intersection Observer with performance optimization
export class OptimizedIntersectionObserver {
  private observer: IntersectionObserver;
  private callbacks: Map<Element, (entry: IntersectionObserverEntry) => void> = new Map();

  constructor(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementCallback = this.callbacks.get(entry.target);
          if (elementCallback) {
            elementCallback(entry);
          }
        });
        callback(entries);
      },
      options
    );
  }

  observe(element: Element, callback: (entry: IntersectionObserverEntry) => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.callbacks.clear();
    this.observer.disconnect();
  }
}

// Resource hints for performance
export function addResourceHints(): void {
  // Preconnect to external domains
  const domains = [
    'https://images.unsplash.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical resources
  const criticalResources = [
    { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    { href: '/fonts/playfair-display.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
  ];

  criticalResources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
  });
}

// Critical CSS inliner
export function inlineCriticalCSS(css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.insertBefore(style, document.head.firstChild);
}

// Service Worker registration with performance monitoring
export function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Service Worker registered successfully');
      
      // Monitor service worker performance
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available');
            }
          });
        }
      });
      
      return registration;
    });
  }
  return Promise.reject(new Error('Service Worker not supported'));
}

// Web Vitals monitoring
export function measureWebVitals(): void {
  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}

// Performance budget checker
export function checkPerformanceBudget(): {
  passed: boolean;
  metrics: Record<string, { current: number; budget: number; status: 'pass' | 'fail' }>;
} {
  const budgets = {
    fcp: 1800, // First Contentful Paint (ms)
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100,  // First Input Delay (ms)
    cls: 0.1,  // Cumulative Layout Shift
    tti: 3800  // Time to Interactive (ms)
  };

  const metrics: Record<string, { current: number; budget: number; status: 'pass' | 'fail' }> = {};
  let passed = true;

  if ('PerformanceObserver' in window) {
    // This is a simplified version - in production, you'd collect actual metrics
    Object.entries(budgets).forEach(([metric, budget]) => {
      const current = 0; // Would be actual measured value
      const status = current <= budget ? 'pass' : 'fail';
      if (status === 'fail') passed = false;
      
      metrics[metric] = { current, budget, status };
    });
  }

  return { passed, metrics };
}

// Export all utilities
export const performanceUtils = {
  debounce,
  throttle,
  memoize,
  preloadImages,
  getBundleSize,
  getMemoryUsage,
  PerformanceMetrics,
  OptimizedIntersectionObserver,
  addResourceHints,
  inlineCriticalCSS,
  registerServiceWorker,
  measureWebVitals,
  checkPerformanceBudget
};
