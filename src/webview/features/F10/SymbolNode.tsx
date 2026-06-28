import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FC } from 'react';
import { SymbolKindBadge } from './SymbolKindBadge';
import type { SymbolNodeType } from './symbolGraphUtils';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

export const SymbolNode: FC<NodeProps<SymbolNodeType>> = ({ data, selected }) => {
  return (
    <div className={['symbol-node', selected ? 'symbol-node-selected' : ''].filter(Boolean).join(' ')} role="button" aria-label={`${data.label} (${data.symbolNode.kind}) symbol node`} tabIndex={0}>
      {handlePositions.map(({ face, position }) => (
        <Handle key={`${data.symbolNode.id}-${face}-target`} id={`target-${face}`} type="target" position={position} className="symbol-node-handle" />
      ))}
      <div className="symbol-node-main">
        <SymbolKindBadge kind={data.symbolNode.kind} />
        {data.symbolNode.isExported ? <span className="symbol-node-exported">export</span> : null}
      </div>
      <div className="symbol-node-name">{data.label}</div>
      <div className="symbol-node-range">{data.lineRange}</div>
      {handlePositions.map(({ face, position }) => (
        <Handle key={`${data.symbolNode.id}-${face}-source`} id={`source-${face}`} type="source" position={position} className="symbol-node-handle" />
      ))}
    </div>
  );
};
