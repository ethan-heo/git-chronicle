import { useEffect, useRef, type MutableRefObject } from 'react';

const scrollTopCache = new Map<string, number>();

export function useRestoredScrollTop<T extends HTMLElement>(
  cacheKey: string,
  isEnabled: boolean,
): MutableRefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!isEnabled || !element) {
      return;
    }

    const savedScrollTop = scrollTopCache.get(cacheKey);
    if (typeof savedScrollTop === 'number') {
      element.scrollTop = savedScrollTop;
    }

    const handleScroll = (): void => {
      scrollTopCache.set(cacheKey, element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollTopCache.set(cacheKey, element.scrollTop);
      element.removeEventListener('scroll', handleScroll);
    };
  }, [cacheKey, isEnabled]);

  return containerRef;
}
