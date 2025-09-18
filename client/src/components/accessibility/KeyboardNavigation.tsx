import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface KeyboardNavigationProps {
  children: React.ReactNode;
  className?: string;
  onKeyDown?: (event: KeyboardEvent) => void;
  shortcuts?: Record<string, () => void>;
}

export default function KeyboardNavigation({ 
  children, 
  className = '',
  onKeyDown,
  shortcuts = {}
}: KeyboardNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for registered shortcuts
    const shortcutKey = Object.keys(shortcuts).find(key => {
      const keys = key.toLowerCase().split('+');
      const ctrlKey = keys.includes('ctrl') || keys.includes('cmd');
      const altKey = keys.includes('alt');
      const shiftKey = keys.includes('shift');
      const mainKey = keys[keys.length - 1];

      return (
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey &&
        event.key.toLowerCase() === mainKey
      );
    });

    if (shortcutKey) {
      event.preventDefault();
      shortcuts[shortcutKey]();
      return;
    }

    // Call custom key handler
    onKeyDown?.(event);
  }, [shortcuts, onKeyDown]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.setAttribute('tabindex', '0');

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      ref={containerRef}
      className={`focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}

// Hook for keyboard shortcuts
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = key.toLowerCase().split('+');
      const ctrlKey = keys.includes('ctrl') || keys.includes('cmd');
      const altKey = keys.includes('alt');
      const shiftKey = keys.includes('shift');
      const mainKey = keys[keys.length - 1];

      if (
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey &&
        event.key.toLowerCase() === mainKey
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, ...deps]);
}

// Arrow key navigation hook
export function useArrowNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' | 'both' = 'both'
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const currentIndex = items.findIndex(item => item === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      items[nextIndex]?.focus();
    }
  }, [items, orientation]);

  return handleKeyDown;
}

// Focus management hook
export function useFocusManagement() {
  const focusStack = useRef<HTMLElement[]>([]);

  const pushFocus = useCallback((element: HTMLElement) => {
    if (document.activeElement instanceof HTMLElement) {
      focusStack.current.push(document.activeElement);
    }
    element.focus();
  }, []);

  const popFocus = useCallback(() => {
    const previousElement = focusStack.current.pop();
    if (previousElement) {
      previousElement.focus();
    }
  }, []);

  const clearFocusStack = useCallback(() => {
    focusStack.current = [];
  }, []);

  return {
    pushFocus,
    popFocus,
    clearFocusStack
  };
}

// Accessible button component
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}> = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  ariaLabel,
  ariaDescribedBy
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.button>
  );
};

// Accessible link component
export const AccessibleLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  external?: boolean;
}> = ({ 
  href, 
  children, 
  className = '',
  ariaLabel,
  external = false
}) => {
  return (
    <motion.a
      href={href}
      className={`
        text-primary hover:text-primary/80 underline-offset-4 hover:underline
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded
        transition-colors duration-200
        ${className}
      `}
      aria-label={ariaLabel}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {children}
      {external && (
        <span className="sr-only"> (opens in new tab)</span>
      )}
    </motion.a>
  );
};
