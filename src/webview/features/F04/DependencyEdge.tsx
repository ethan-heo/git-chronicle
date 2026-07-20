import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { memo, type FC } from 'react';
import type { DependencyEdgeType } from './graph';

const DependencyEdgeComponent: FC<EdgeProps<DependencyEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.32,
  });
  const kind = data?.kind ?? 'import';
  const highlighted = Boolean(data?.highlighted);
  const dimmed = Boolean(data?.dimmed);
  const className = [
    'dependency-edge',
    `dependency-edge-${kind}`,
    highlighted ? 'dependency-edge-highlighted' : '',
    dimmed ? 'dependency-edge-dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={className}
        style={{
          strokeWidth: highlighted ? 3 : 1.5,
          opacity: dimmed ? 0.18 : highlighted ? 1 : 0.62,
          stroke: highlighted
            ? 'var(--gae-color-accent-primary)'
            : 'color-mix(in srgb, var(--gae-color-text-secondary) 86%, transparent)',
          strokeDasharray: kind === 'require' ? '5 5' : undefined,
          filter: highlighted ? 'drop-shadow(0 0 8px color-mix(in srgb, var(--gae-color-accent-primary) 38%, transparent))' : undefined,
          transition: [
            'stroke var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
            'stroke-width var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
            'opacity var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
            'filter var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
          ].join(', '),
        }}
      />
      <EdgeLabelRenderer>
        <span
          className="pointer-events-none absolute rounded-full border border-line bg-elevated px-1.5 py-[3px] font-mono text-[9px] leading-none text-muted"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {kind}
        </span>
      </EdgeLabelRenderer>
    </>
  );
};

function arePropsEqual(
  prev: EdgeProps<DependencyEdgeType>,
  next: EdgeProps<DependencyEdgeType>,
): boolean {
  return (
    prev.sourceX === next.sourceX &&
    prev.sourceY === next.sourceY &&
    prev.targetX === next.targetX &&
    prev.targetY === next.targetY &&
    prev.sourcePosition === next.sourcePosition &&
    prev.targetPosition === next.targetPosition &&
    prev.markerEnd === next.markerEnd &&
    (prev.data?.kind ?? 'import') === (next.data?.kind ?? 'import') &&
    Boolean(prev.data?.highlighted) === Boolean(next.data?.highlighted) &&
    Boolean(prev.data?.dimmed) === Boolean(next.data?.dimmed)
  );
}

export const DependencyEdge = memo(DependencyEdgeComponent, arePropsEqual);
