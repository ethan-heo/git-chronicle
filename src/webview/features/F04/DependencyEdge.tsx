import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react';
import type { FC } from 'react';
import type { DependencyEdgeType } from './graph';

export const DependencyEdge: FC<EdgeProps<DependencyEdgeType>> = ({ id, sourceX, sourceY, targetX, targetY, markerEnd, data }) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const kind = data?.kind ?? 'import';
  const highlighted = Boolean(data?.highlighted);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={`dependency-edge dependency-edge-${kind}${highlighted ? ' dependency-edge-highlighted' : ''}`}
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
