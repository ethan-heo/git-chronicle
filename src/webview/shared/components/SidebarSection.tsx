import type { FC, ReactNode } from 'react';

interface SidebarSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export const SidebarSection: FC<SidebarSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  badge,
  actions,
  children,
}) => {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div className="flex min-h-8 items-center gap-1.5 border-b border-line px-2.5 py-1 text-[10px]">
        <button
          className="inline-flex min-w-0 flex-1 items-center gap-1.5 bg-transparent text-left text-[10px] font-bold uppercase leading-none tracking-[0.04em] text-text"
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-label={`${title} ${isExpanded ? 'collapse' : 'expand'}`}
          title={title}
        >
          <span className="leading-none" aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
          <span className="truncate text-[10px] leading-none">{title}</span>
          {badge ? <span className="ml-auto shrink-0">{badge}</span> : null}
        </button>
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
      {isExpanded ? <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div> : null}
    </section>
  );
};
