import { useEffect, useRef, type FC } from 'react';

interface InfiniteScrollTriggerProps {
  isEnabled: boolean;
  onTrigger: () => void;
}

export const InfiniteScrollTrigger: FC<InfiniteScrollTriggerProps> = ({ isEnabled, onTrigger }) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = triggerRef.current;

    if (!isEnabled || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onTrigger();
        }
      },
      { rootMargin: '96px 0px', threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isEnabled, onTrigger]);

  return <div ref={triggerRef} className="infinite-scroll-trigger" aria-hidden="true" />;
};
