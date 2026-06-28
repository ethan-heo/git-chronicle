import { BaseEdge, MarkerType, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { CSSProperties, FC } from 'react';
import { Position } from '@xyflow/react';
import type { SymbolEdgeType } from './symbolGraphUtils';

export const SymbolEdge: FC<EdgeProps<SymbolEdgeType>> = ({ sourceX, sourceY, targetX, targetY, markerEnd, data }) => {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition: Position.Right, targetX, targetY, targetPosition: Position.Left });
  const stroke = data?.highlighted ? 'var(--gae-color-symbol-highlight)' : data?.dimmed ? 'var(--gae-color-symbol-dimmed)' : 'var(--gae-color-symbol-default)';
  const edgeStyle = getEdgeStyle(data?.kind, stroke, Boolean(data?.highlighted));
  const edgeClassName = ['symbol-edge', data?.kind ? `symbol-edge-${data.kind}` : '', data?.highlighted ? 'symbol-edge-highlighted' : '', data?.dimmed ? 'symbol-edge-dimmed' : ''].filter(Boolean).join(' ');

  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd ?? MarkerType.ArrowClosed}
      style={edgeStyle}
      className={edgeClassName}
    />
  );
};

function getEdgeStyle(
  kind: string | undefined,
  stroke: string,
  highlighted: boolean,
): CSSProperties {
  const style: CSSProperties = {
    stroke,
    strokeWidth: 2,
    fill: 'none',
  };

  if (kind === 'uses') {
    style.strokeDasharray = '4 4';
    style.strokeLinecap = 'round';
    style.strokeLinejoin = 'round';
    style.strokeWidth = highlighted ? 2 : 1.5;
  }

  if (kind === 'extends') {
    style.strokeWidth = highlighted ? 4 : 3;
    style.strokeLinecap = 'round';
    style.strokeLinejoin = 'round';
  }

  if (kind === 'implements') {
    style.strokeDasharray = '10 5';
    style.strokeLinecap = 'round';
    style.strokeLinejoin = 'round';
    style.strokeWidth = highlighted ? 3.5 : 2.5;
  }

  if (kind === 'calls') {
    style.strokeWidth = highlighted ? 3 : 2.25;
  }

  return style;
}
