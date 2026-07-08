import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FileStatusBadge } from '../../shared/components';
import { getSourceHandleId, getTargetHandleId, type FileNodeType } from './graph';
import './FileNode.css';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

const FileNodeComponent: FC<NodeProps<FileNodeType>> = ({ data, selected }) => {
  const { t } = useTranslation();
  const title = data.canAnalyze ? `${data.directory}${data.label}` : 'JS/TS 외 파일은 노드로만 표시됩니다.';

  return (
    <div
      className={[
        'dependency-file-node group flex w-full flex-col items-end gap-2',
        selected ? 'dependency-file-node--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'relative box-border w-full min-h-[62px] rounded-md border border-line bg-panel px-[10px] py-2 text-text shadow-[0_2px_8px_rgba(0,0,0,0.28)] transition-[border-color,box-shadow,opacity] duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:border-focus hover:shadow-[0_6px_20px_rgba(0,0,0,0.44)] focus-visible:border-focus focus-visible:shadow-[0_6px_20px_rgba(0,0,0,0.44)]',
          !data.canAnalyze ? 'dependency-file-node-no-analysis' : '',
          data.file.status === 'D' ? 'dependency-file-node-deleted' : '',
          selected ? 'border-focus shadow-[0_6px_20px_rgba(0,0,0,0.44)]' : '',
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
          {!data.canAnalyze ? <span className="rounded-full bg-[color-mix(in_srgb,var(--gae-color-text-secondary)_16%,transparent)] px-[7px] py-[2px] text-[10px] text-muted">분석 불가</span> : null}
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
      <button
        className="inline-flex size-[26px] items-center justify-center self-end rounded-md border border-line bg-secondary p-0 text-muted opacity-0 pointer-events-none transition-all duration-100 ease-in-out group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-secondary-hi hover:text-text"
        type="button"
        aria-label={t('shared.copy_markdown')}
        title={t('shared.copy_markdown')}
        onClick={(event) => {
          event.stopPropagation();
          data.onCopy(data.file);
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <rect x="5.25" y="3.25" width="7.5" height="9.5" rx="1.2" />
          <path d="M10.25 3.25V2.5a1.25 1.25 0 0 0-1.25-1.25h-5.5A1.25 1.25 0 0 0 2.25 2.5v8A1.25 1.25 0 0 0 3.5 11.75h1" />
        </svg>
      </button>
    </div>
  );
};

export const FileNode = memo(FileNodeComponent);
