import type { FC } from 'react';
import type { Branch } from '../../types/commit';

interface BranchListItemProps {
  branch: Branch;
  isSelected: boolean;
  onClick: (branch: Branch) => void;
}

export const BranchListItem: FC<BranchListItemProps> = ({ branch, isSelected, onClick }) => {
  const showTracking = branch.scope === 'local' && Boolean(branch.upstream) && (branch.ahead > 0 || branch.behind > 0);

  return (
    <li className="relative">
      {isSelected ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-link" aria-hidden="true" /> : null}
      <button
        className="block w-full bg-transparent text-left"
        type="button"
        onClick={() => onClick(branch)}
        title={branch.name}
      >
        <div
          className={[
            'flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors duration-100 ease-in-out hover:bg-hover',
            isSelected ? 'bg-secondary text-text' : 'text-muted',
          ].join(' ')}
        >
          <span className={`min-w-0 flex-1 truncate ${isSelected ? 'font-medium text-text' : ''}`}>{branch.name}</span>
          {branch.scope === 'remote' ? (
            <span className="shrink-0 rounded-full border border-line bg-panel px-1.5 py-0.5 text-[10px] leading-none text-muted">
              REMOTE
            </span>
          ) : null}
          {branch.isCurrent ? (
            <span className="shrink-0 rounded-full border border-line bg-panel px-1.5 py-0.5 text-[10px] leading-none text-text">
              HEAD
            </span>
          ) : null}
          {showTracking ? (
            <span className="shrink-0 font-mono text-[10px] text-muted">
              ↑{branch.ahead} ↓{branch.behind}
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
};
