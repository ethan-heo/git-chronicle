import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarSection } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import type { Branch } from '../../types/commit';
import { BranchList } from './BranchList';
import { FetchBranchesButton } from './FetchBranchesButton';

interface BranchesSectionProps {
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const BranchesSection: FC<BranchesSectionProps> = ({ isActive, isExpanded, onToggleExpanded }) => {
  const { t } = useTranslation();
  const branches = useAppStore((state) => state.branches);
  const isLoadingBranches = useAppStore((state) => state.isLoadingBranches);
  const hasLoadedBranches = useAppStore((state) => state.hasLoadedBranches);
  const branchesError = useAppStore((state) => state.branchesError);
  const isFetchingBranches = useAppStore((state) => state.isFetchingBranches);
  const filterBranch = useAppStore((state) => state.filterBranch);
  const loadBranches = useAppStore((state) => state.loadBranches);
  const setFilter = useAppStore((state) => state.setFilter);
  const handleBranchesLoaded = useAppStore((state) => state.handleBranchesLoaded);
  const handleBranchesLoadFailed = useAppStore((state) => state.handleBranchesLoadFailed);

  useEffect(() => {
    if (!isActive || hasLoadedBranches) {
      return;
    }

    loadBranches();
  }, [hasLoadedBranches, isActive, loadBranches]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: { branches?: Branch[]; message?: string; refresh?: boolean };
      }>,
    ): void => {
      if (event.data.type === 'BRANCHES_LOADED') {
        handleBranchesLoaded({
          branches: event.data.payload?.branches ?? [],
          refresh: event.data.payload?.refresh ?? false,
        });
        return;
      }

      if (event.data.type === 'BRANCHES_LOAD_FAILED') {
        handleBranchesLoadFailed({
          message: event.data.payload?.message,
          refresh: event.data.payload?.refresh ?? false,
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleBranchesLoadFailed, handleBranchesLoaded, isActive]);

  const selectedBranchName = filterBranch ?? branches.find((branch) => branch.isCurrent)?.name ?? null;

  return (
    <SidebarSection
      title={t('branch.title')}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
      badge={branches.length > 0 ? (
        <strong className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium leading-none text-text">
          {branches.length}
        </strong>
      ) : undefined}
      actions={<FetchBranchesButton isLoading={isFetchingBranches} onClick={() => loadBranches({ refresh: true })} />}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <BranchList
          branches={branches}
          isLoading={isLoadingBranches}
          error={branchesError}
          selectedBranchName={selectedBranchName}
          onSelectBranch={(branch) => setFilter({ filterBranch: branch.name })}
          onRetry={() => loadBranches()}
        />
      </div>
    </SidebarSection>
  );
};
