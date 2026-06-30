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
  return <span className={`symbol-kind-badge symbol-kind-badge-${kind}`}>{LABELS[kind]}</span>;
};
