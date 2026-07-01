import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FC } from 'react';
import { SymbolKindBadge } from './SymbolKindBadge';
import type { SymbolNodeType } from './symbolGraphUtils';
import './SymbolNode.css';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

export const SymbolNode: FC<NodeProps<SymbolNodeType>> = ({ data, selected }) => {
  const isImportNode = data.symbolNode.nodeCategory === 'import';
  const importKind = data.symbolNode.importKind ?? 'named';
  const modulePath = data.symbolNode.modulePath ?? '';

  return (
    <div
      className={[
        'symbol-node rounded-[16px] border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_94%,transparent)] px-4 pt-[14px] pb-3 shadow-[0_4px_18px_rgba(0,0,0,0.22)]',
        isImportNode ? 'symbol-node-import min-w-[200px] border-dashed px-[14px] pt-3 pb-[10px]' : 'min-w-[240px]',
        selected ? 'symbol-node-selected' : '',
      ].filter(Boolean).join(' ')}
      role="button"
      aria-label={`${data.label} (${isImportNode ? `${importKind} import` : data.symbolNode.kind}) symbol node`}
      tabIndex={0}
      title={isImportNode && modulePath ? modulePath : undefined}
    >
      {handlePositions.map(({ face, position }) => (
        <Handle key={`${data.symbolNode.id}-${face}-target`} id={`target-${face}`} type="target" position={position} className="symbol-node-handle h-0 w-0 border-0 bg-transparent opacity-0 shadow-none" />
      ))}
      <div className="flex items-center gap-2">
        <SymbolKindBadge kind={isImportNode ? 'import' : data.symbolNode.kind} />
        {data.symbolNode.isExported ? <span className="ml-auto text-[11px] text-muted uppercase">export</span> : null}
      </div>
      {isImportNode ? <div className="mt-2 overflow-hidden text-[11px] whitespace-nowrap text-ellipsis text-muted">{modulePath}</div> : null}
      <div className={isImportNode ? 'mt-2 text-[14px] font-bold' : 'mt-[10px] text-[14px] font-bold'}>{data.label}</div>
      {isImportNode ? <div className="mt-1.5 text-[11px] font-semibold text-[var(--gae-color-symbol-imp)] lowercase">{importKind}</div> : null}
      <div className="mt-1 text-[12px] text-muted">{data.lineRange}</div>
      {handlePositions.map(({ face, position }) => (
        <Handle key={`${data.symbolNode.id}-${face}-source`} id={`source-${face}`} type="source" position={position} className="symbol-node-handle h-0 w-0 border-0 bg-transparent opacity-0 shadow-none" />
      ))}
    </div>
  );
};
