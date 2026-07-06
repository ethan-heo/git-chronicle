import type { ReactNode } from 'react';
import type { FC } from 'react';
import type { Commit } from '../../types/commit';

interface WorkspaceHeadingProps {
  commit: Commit;
  context: string;
  endSlot?: ReactNode;
}

export const WorkspaceHeading: FC<WorkspaceHeadingProps> = ({
  commit,
  context,
  endSlot,
}) => {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line bg-panel px-6 py-5">
      <div className="min-w-0">
        <h1 className="m-0 overflow-hidden text-lg font-bold text-text text-ellipsis whitespace-nowrap">
          {commit.message}
        </h1>
        <p className="mt-2 mb-0 overflow-hidden text-sm text-muted text-ellipsis whitespace-nowrap">
          {context}
        </p>
      </div>
      {endSlot ? <div className="flex items-center gap-1">{endSlot}</div> : null}
    </header>
  );
};
