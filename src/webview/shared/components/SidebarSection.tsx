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
      <div className="flex items-center gap-2 border-b border-line px-2.5 py-1.5 text-[10px]">
        <button
          className="inline-flex min-w-0 items-center gap-1.5 bg-transparent text-left text-[10px] font-bold uppercase tracking-[0.04em] text-text"
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
          <span className="truncate text-[10px] leading-none">{title}</span>
        </button>
        {badge ? <div className="shrink-0">{badge}</div> : null}
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </div>
      {isExpanded ? <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div> : null}
    </section>
  );
};
