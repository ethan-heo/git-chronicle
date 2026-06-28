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
      />
      <EdgeLabelRenderer>
        <span
          className="dependency-edge-label"
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
