import type { FC } from 'react';
import type { SymbolKind } from '../../types/commit';

type BadgeKind = SymbolKind | 'import';

const LABELS: Record<BadgeKind, string> = {
  function: 'fn',
  class: 'cls',
  interface: 'ifc',
  type: 'typ',
  variable: 'var',
  constant: 'cst',
  enum: 'enm',
  import: 'imp',
};

export const SymbolKindBadge: FC<{ kind: BadgeKind }> = ({ kind }) => {
  const colorClass = {
    function: 'bg-[var(--gae-color-symbol-function)]',
    class: 'bg-[var(--gae-color-symbol-class)]',
    interface: 'bg-[var(--gae-color-symbol-interface)]',
    type: 'bg-[var(--gae-color-symbol-type)]',
    variable: 'bg-[var(--gae-color-symbol-variable)]',
    constant: 'bg-[var(--gae-color-symbol-constant)]',
    enum: 'bg-[var(--gae-color-symbol-enum)]',
    import: 'bg-[var(--gae-color-symbol-imp)]',
  }[kind];

  return (
    <span
      className={[
        'inline-flex h-6 min-w-[40px] items-center justify-center rounded-full px-2.5 text-[11px] font-bold tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
        colorClass,
      ].filter(Boolean).join(' ')}
    >
      {LABELS[kind]}
    </span>
  );
};
