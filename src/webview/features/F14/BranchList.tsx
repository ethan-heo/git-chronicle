import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import type { Branch } from '../../types/commit';
import { BranchListItem } from './BranchListItem';

interface BranchListProps {
  branches: Branch[];
  isLoading: boolean;
  error: string | null;
  selectedBranchName: string | null;
  onSelectBranch: (branch: Branch) => void;
  onRetry: () => void;
}

export const BranchList: FC<BranchListProps> = ({
  branches,
  isLoading,
  error,
  selectedBranchName,
  onSelectBranch,
  onRetry,
}) => {
  const { t } = useTranslation();

  if (isLoading && branches.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6">
        <LoadingState size="sm" />
      </div>
    );
  }

  if (error && branches.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6 text-center">
        <EmptyState message={t('branch.empty')} />
      </div>
    );
  }

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5 py-1.5">
      {branches.map((branch) => (
        <BranchListItem
          key={branch.name}
          branch={branch}
          isSelected={branch.name === selectedBranchName}
          onClick={onSelectBranch}
        />
      ))}
    </ul>
  );
};
