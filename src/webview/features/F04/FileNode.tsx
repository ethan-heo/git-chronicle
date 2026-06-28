import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FileActionButtons, FileStatusBadge, SavedBadge } from '../../shared/components';
import { getSourceHandleId, getTargetHandleId, type FileNodeType } from './graph';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

export const FileNode: FC<NodeProps<FileNodeType>> = ({ data, selected }) => {
  const { t } = useTranslation();
  const title = data.canAnalyze ? `${data.directory}${data.label}` : 'JS/TS 외 파일은 노드로만 표시됩니다.';

  return (
    <div
      className={[
        'dependency-file-node',
        !data.canAnalyze ? 'dependency-file-node-no-analysis' : '',
        data.file.status === 'D' ? 'dependency-file-node-deleted' : '',
        selected ? 'dependency-file-node--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      aria-label={data.label}
      title={title}
      tabIndex={0}
    >
      {handlePositions.map(({ face, position }) => (
        <Handle key={getTargetHandleId(face)} id={getTargetHandleId(face)} className="dependency-node-handle" type="target" position={position} />
      ))}
      <div className="dependency-file-node-main">
        <FileStatusBadge status={data.file.status} />
        <div className="dependency-file-node-text">
          <span className="dependency-file-node-name">{data.label}</span>
          <span className="dependency-file-node-dir">{data.directory}</span>
        </div>
      </div>
      <div className="dependency-file-node-meta">
        {data.file.hasSavedSummary ? <SavedBadge /> : null}
        {!data.canAnalyze ? <span className="dependency-no-analysis-label">분석 불가</span> : null}
      </div>
      <div className="dependency-file-node-actions nodrag nopan">
        <FileActionButtons
          onCodeView={() => data.onCodeView(data.file)}
          onAISummary={() => data.onAISummary(data.file)}
          onSymbolGraph={data.onSymbolGraph && data.isSymbolGraphSupported ? () => data.onSymbolGraph?.(data.file) : undefined}
        />
      </div>
      {handlePositions.map(({ face, position }) => (
        <Handle key={getSourceHandleId(face)} id={getSourceHandleId(face)} className="dependency-node-handle" type="source" position={position} />
      ))}
    </div>
  );
};
