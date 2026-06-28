import type { FC } from 'react';
import type { SymbolKind } from '../../types/commit';

const LABELS: Record<SymbolKind, string> = {
  function: 'fn',
  class: 'cls',
  interface: 'ifc',
  type: 'typ',
  variable: 'var',
  constant: 'cst',
  enum: 'enm',
};

export const SymbolKindBadge: FC<{ kind: SymbolKind }> = ({ kind }) => {
  return <span className={`symbol-kind-badge symbol-kind-badge-${kind}`}>{LABELS[kind]}</span>;
};
