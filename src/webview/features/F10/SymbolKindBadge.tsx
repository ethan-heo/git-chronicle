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
  return (
    <span
      className={[
        'inline-flex h-5 min-w-[34px] items-center justify-center rounded-full px-2 text-[11px] font-bold text-white',
        kind === 'function' ? 'bg-[#4b93ff]' : '',
        kind === 'class' ? 'bg-[#4caf72]' : '',
        kind === 'interface' ? 'bg-[#26b7b7]' : '',
        kind === 'type' ? 'bg-[#7d61d6]' : '',
        kind === 'variable' ? 'bg-[#77808f]' : '',
        kind === 'constant' ? 'bg-[#f08a24]' : '',
        kind === 'enum' ? 'bg-[#d85aa0]' : '',
        kind === 'import' ? 'bg-[var(--gae-color-symbol-imp)]' : '',
      ].filter(Boolean).join(' ')}
    >
      {LABELS[kind]}
    </span>
  );
};
