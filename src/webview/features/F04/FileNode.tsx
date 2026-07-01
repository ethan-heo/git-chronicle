import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FileActionButtons, FileStatusBadge, SavedBadge } from '../../shared/components';
import { getSourceHandleId, getTargetHandleId, type FileNodeType } from './graph';
import './FileNode.css';

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
        'dependency-file-node group relative box-border w-full min-h-[62px] rounded-md border border-line bg-panel px-[10px] py-2 text-text shadow-[0_2px_8px_rgba(0,0,0,0.28)] transition-[border-color,box-shadow,opacity] duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:border-focus hover:shadow-[0_6px_20px_rgba(0,0,0,0.44)] focus-visible:border-focus focus-visible:shadow-[0_6px_20px_rgba(0,0,0,0.44)]',
        !data.canAnalyze ? 'dependency-file-node-no-analysis' : '',
        data.file.status === 'D' ? 'dependency-file-node-deleted' : '',
        selected ? 'dependency-file-node--selected border-focus shadow-[0_6px_20px_rgba(0,0,0,0.44)]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      aria-label={data.label}
      title={title}
      tabIndex={0}
    >
      {handlePositions.map(({ face, position }) => (
        <Handle
          key={getTargetHandleId(face)}
          id={getTargetHandleId(face)}
          className="h-2 w-2 border border-line bg-elevated opacity-0 pointer-events-none"
          type="target"
          position={position}
        />
      ))}
      <div className="flex min-w-0 items-center gap-[7px]">
        <FileStatusBadge status={data.file.status} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="dependency-file-node-name overflow-wrap-anywhere font-mono text-[12px] font-bold leading-[1.35] whitespace-normal text-text">
            {data.label}
          </span>
          <span className="overflow-hidden text-[10px] whitespace-nowrap text-ellipsis text-muted">{data.directory}</span>
        </div>
      </div>
      <div className="mt-1.5 flex min-h-[18px] items-center gap-[5px]">
        {data.file.hasSavedSummary ? <SavedBadge /> : null}
        {!data.canAnalyze ? <span className="rounded-full bg-[color-mix(in_srgb,var(--gae-color-text-secondary)_16%,transparent)] px-[7px] py-[2px] text-[10px] text-muted">분석 불가</span> : null}
      </div>
      <div className="dependency-file-node-actions nodrag nopan absolute right-2 bottom-[-30px] z-10 rounded-sm border border-line bg-elevated p-1 shadow-[0_4px_16px_rgba(0,0,0,0.36)] opacity-0 pointer-events-none translate-y-[-3px] transition-[opacity,transform] duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <FileActionButtons
          onCodeView={() => data.onCodeView(data.file)}
          onAISummary={() => data.onAISummary(data.file)}
          onSymbolGraph={data.onSymbolGraph && data.isSymbolGraphSupported ? () => data.onSymbolGraph?.(data.file) : undefined}
        />
      </div>
      {handlePositions.map(({ face, position }) => (
        <Handle
          key={getSourceHandleId(face)}
          id={getSourceHandleId(face)}
          className="h-2 w-2 border border-line bg-elevated opacity-0 pointer-events-none"
          type="source"
          position={position}
        />
      ))}
    </div>
  );
};
