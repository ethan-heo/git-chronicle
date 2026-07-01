import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import type { FC } from 'react';
import type { DependencyEdgeType } from './graph';

export const DependencyEdge: FC<EdgeProps<DependencyEdgeType>> = ({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
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
          strokeWidth: highlighted ? 2.4 : 1.6,
          opacity: dimmed ? 0.2 : 1,
          stroke: highlighted ? 'var(--gae-color-text-link)' : 'var(--gae-color-text-secondary)',
          strokeDasharray: kind === 'require' ? '5 5' : undefined,
          transition: 'opacity var(--gae-motion-duration-fast) var(--gae-motion-easing-default)',
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
