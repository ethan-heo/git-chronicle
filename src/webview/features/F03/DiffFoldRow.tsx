import type { FC } from 'react';

interface DiffFoldRowProps {
  hiddenCount: number;
  startLineLabel: string;
  endLineLabel: string;
  onExpand: () => void;
}

export const DiffFoldRow: FC<DiffFoldRowProps> = ({
  hiddenCount,
  startLineLabel,
  endLineLabel,
  onExpand,
}) => {
  return (
    <button
      type="button"
      className="grid min-h-5 w-full grid-cols-[48px_48px_18px_minmax(0,1fr)] items-center border-y border-[color-mix(in_srgb,var(--color-line)_58%,transparent)] bg-[color-mix(in_srgb,var(--color-panel)_84%,var(--vscode-editor-background,var(--color-surface)))] text-left text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-panel)_72%,var(--vscode-editor-background,var(--color-surface)))] focus-visible:outline-1 focus-visible:outline-focus max-[320px]:grid-cols-[18px_minmax(0,1fr)]"
      onClick={onExpand}
      role="listitem"
    >
      <span className="max-[320px]:hidden" aria-hidden="true" />
      <span className="max-[320px]:hidden" aria-hidden="true" />
      <span className="text-center select-none" aria-hidden="true">
        ⋯
      </span>
      <span className="truncate px-[4px] py-1 pr-[14px] max-[320px]:pr-[8px]">
        {`⋯ ${hiddenCount}줄 숨김 (라인 ${startLineLabel}-${endLineLabel})`}
      </span>
    </button>
  );
};
