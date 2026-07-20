import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, type Position } from '@xyflow/react';
import { memo, type CSSProperties, type FC, type ReactElement } from 'react';
import type { SymbolDependencyKind } from '../../types/commit';
import type { SymbolEdgeType } from './symbolGraphUtils';

const TRIANGLE_HEIGHT = 14;
const TRIANGLE_HALF_WIDTH = 7;
const OPEN_ARROW_LENGTH = 11;
const OPEN_ARROW_HALF_WIDTH = 5;

const SymbolEdgeComponent: FC<EdgeProps<SymbolEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const stroke = data?.highlighted
    ? 'var(--gae-color-symbol-highlight)'
    : data?.dimmed
      ? 'var(--gae-color-symbol-dimmed)'
      : getEdgeColor(data?.kind ?? 'uses');
  const style = getEdgeStyle(data?.kind ?? 'uses', stroke, Boolean(data?.highlighted));
  const end = getMarkerEndPoint(targetX, targetY, targetPosition, data?.kind ?? 'uses');
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: end.x,
    targetY: end.y,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        className={[
          'symbol-edge',
          `symbol-edge-${data?.kind ?? 'uses'}`,
          data?.highlighted ? 'symbol-edge-highlighted' : '',
          data?.dimmed ? 'symbol-edge-dimmed' : '',
        ].filter(Boolean).join(' ')}
      />
      <EdgeLabelRenderer>
        <svg className="pointer-events-none absolute inset-0 overflow-visible">
          {renderMarker(data?.kind ?? 'uses', targetX, targetY, targetPosition, stroke, style.strokeWidth as number)}
        </svg>
      </EdgeLabelRenderer>
    </>
  );
};

function arePropsEqual(
  prev: EdgeProps<SymbolEdgeType>,
  next: EdgeProps<SymbolEdgeType>,
): boolean {
  return (
    prev.sourceX === next.sourceX &&
    prev.sourceY === next.sourceY &&
    prev.targetX === next.targetX &&
    prev.targetY === next.targetY &&
    prev.sourcePosition === next.sourcePosition &&
    prev.targetPosition === next.targetPosition &&
    (prev.data?.kind ?? 'uses') === (next.data?.kind ?? 'uses') &&
    Boolean(prev.data?.highlighted) === Boolean(next.data?.highlighted) &&
    Boolean(prev.data?.dimmed) === Boolean(next.data?.dimmed)
  );
}

export const SymbolEdge = memo(SymbolEdgeComponent, arePropsEqual);

function getEdgeStyle(kind: SymbolDependencyKind, stroke: string, highlighted: boolean): CSSProperties {
  const base: CSSProperties = {
    stroke,
    strokeWidth: highlighted ? 3 : 2,
    opacity: highlighted ? 1 : 0.72,
    fill: 'none',
    filter: highlighted ? 'drop-shadow(0 0 8px color-mix(in srgb, var(--gae-color-symbol-highlight) 44%, transparent))' : undefined,
    transition: [
      'stroke var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
      'stroke-width var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
      'opacity var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
      'filter var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
    ].join(', '),
  };

  if (kind === 'uses') {
    return { ...base, strokeWidth: highlighted ? 2.5 : 1.5, strokeDasharray: '4 4', strokeLinecap: 'round' };
  }
  if (kind === 'extends') {
    return { ...base, strokeWidth: highlighted ? 3.4 : 2.5 };
  }
  if (kind === 'implements') {
    return { ...base, strokeWidth: highlighted ? 3.4 : 2.5, strokeDasharray: '6 4', strokeLinecap: 'round' };
  }

  return base;
}

function getEdgeColor(kind: SymbolDependencyKind): string {
  return {
    calls: 'var(--gae-color-symbol-calls)',
    uses: 'var(--gae-color-symbol-uses)',
    extends: 'var(--gae-color-symbol-extends)',
    implements: 'var(--gae-color-symbol-implements)',
  }[kind];
}

function getMarkerEndPoint(targetX: number, targetY: number, targetPosition: Position | undefined, kind: SymbolDependencyKind): { x: number; y: number } {
  const offset = kind === 'extends' || kind === 'implements' ? TRIANGLE_HEIGHT : OPEN_ARROW_LENGTH;
  switch (targetPosition) {
    case 'left':
      return { x: targetX + offset, y: targetY };
    case 'right':
      return { x: targetX - offset, y: targetY };
    case 'top':
      return { x: targetX, y: targetY + offset };
    case 'bottom':
      return { x: targetX, y: targetY - offset };
    default:
      return { x: targetX - offset, y: targetY };
  }
}

function renderMarker(kind: SymbolDependencyKind, x: number, y: number, position: Position | undefined, stroke: string, strokeWidth: number): ReactElement {
  return kind === 'extends' || kind === 'implements'
    ? renderTriangleMarker(x, y, position, stroke, strokeWidth)
    : renderOpenArrowMarker(x, y, position, stroke, strokeWidth);
}

function renderTriangleMarker(x: number, y: number, position: Position | undefined, stroke: string, strokeWidth: number): ReactElement {
  const points = getTrianglePoints(x, y, position);
  return <polygon points={points} fill="var(--gae-color-surface-primary)" stroke={stroke} strokeWidth={strokeWidth} />;
}

function renderOpenArrowMarker(x: number, y: number, position: Position | undefined, stroke: string, strokeWidth: number): ReactElement {
  const points = getOpenArrowPoints(x, y, position);
  return <polyline points={points} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
}

function getTrianglePoints(x: number, y: number, position: Position | undefined): string {
  switch (position) {
    case 'left':
      return `${x},${y} ${x + TRIANGLE_HEIGHT},${y - TRIANGLE_HALF_WIDTH} ${x + TRIANGLE_HEIGHT},${y + TRIANGLE_HALF_WIDTH}`;
    case 'right':
      return `${x},${y} ${x - TRIANGLE_HEIGHT},${y - TRIANGLE_HALF_WIDTH} ${x - TRIANGLE_HEIGHT},${y + TRIANGLE_HALF_WIDTH}`;
    case 'top':
      return `${x},${y} ${x - TRIANGLE_HALF_WIDTH},${y + TRIANGLE_HEIGHT} ${x + TRIANGLE_HALF_WIDTH},${y + TRIANGLE_HEIGHT}`;
    case 'bottom':
      return `${x},${y} ${x - TRIANGLE_HALF_WIDTH},${y - TRIANGLE_HEIGHT} ${x + TRIANGLE_HALF_WIDTH},${y - TRIANGLE_HEIGHT}`;
    default:
      return `${x},${y} ${x - TRIANGLE_HEIGHT},${y - TRIANGLE_HALF_WIDTH} ${x - TRIANGLE_HEIGHT},${y + TRIANGLE_HALF_WIDTH}`;
  }
}

function getOpenArrowPoints(x: number, y: number, position: Position | undefined): string {
  switch (position) {
    case 'left':
      return `${x + OPEN_ARROW_LENGTH},${y - OPEN_ARROW_HALF_WIDTH} ${x},${y} ${x + OPEN_ARROW_LENGTH},${y + OPEN_ARROW_HALF_WIDTH}`;
    case 'right':
      return `${x - OPEN_ARROW_LENGTH},${y - OPEN_ARROW_HALF_WIDTH} ${x},${y} ${x - OPEN_ARROW_LENGTH},${y + OPEN_ARROW_HALF_WIDTH}`;
    case 'top':
      return `${x - OPEN_ARROW_HALF_WIDTH},${y + OPEN_ARROW_LENGTH} ${x},${y} ${x + OPEN_ARROW_HALF_WIDTH},${y + OPEN_ARROW_LENGTH}`;
    case 'bottom':
      return `${x - OPEN_ARROW_HALF_WIDTH},${y - OPEN_ARROW_LENGTH} ${x},${y} ${x + OPEN_ARROW_HALF_WIDTH},${y - OPEN_ARROW_LENGTH}`;
    default:
      return `${x - OPEN_ARROW_LENGTH},${y - OPEN_ARROW_HALF_WIDTH} ${x},${y} ${x - OPEN_ARROW_LENGTH},${y + OPEN_ARROW_HALF_WIDTH}`;
  }
}
