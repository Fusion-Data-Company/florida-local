import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<Element>;
  entry: IntersectionObserverEntry | undefined;
  isIntersecting: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    freezeOnceVisible = false
  } = options;

  const ref = useRef<Element>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isIntersecting, setIsIntersecting] = useState(false);

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  const updateEntry = useCallback(([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry);
    setIsIntersecting(entry.isIntersecting);
  }, []);

  useEffect(() => {
    const node = ref?.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !node) return;

    const observerParams = { threshold, rootMargin, root };
    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, root, frozen, updateEntry]);

  return { ref, entry, isIntersecting };
}

// Specialized hooks for common use cases
export function useInView(options: UseIntersectionObserverOptions = {}) {
  const { ref, isIntersecting } = useIntersectionObserver(options);
  return { ref, inView: isIntersecting };
}

export function useLazyLoading(options: UseIntersectionObserverOptions = {}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  });
  return { ref, isVisible: isIntersecting };
}

export function useScrollTrigger(options: UseIntersectionObserverOptions = {}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    ...options
  });
  return { ref, isTriggered: isIntersecting };
}

// Hook for animating elements when they come into view
export function useAnimationTrigger(
  animationType: 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn' = 'fadeIn',
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isIntersecting, hasAnimated]);

  return {
    ref,
    isVisible: isIntersecting,
    hasAnimated,
    animationClass: hasAnimated ? `animate-${animationType}` : ''
  };
}

// Hook for infinite scroll
export function useInfiniteScroll(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    ...options
  });

  useEffect(() => {
    if (isIntersecting) {
      callback();
    }
  }, [isIntersecting, callback]);

  return { ref, isNearBottom: isIntersecting };
}

// Hook for sticky elements
export function useSticky(
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '-1px 0px 0px 0px',
    ...options
  });

  return { ref, isSticky: !isIntersecting };
}
