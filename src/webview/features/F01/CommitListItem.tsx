import { memo, type KeyboardEvent, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { Commit } from '../../types/commit';
import { useAppStore } from '../../store/appStore';
import { CopyMarkdownButton } from '../F11';
import { commitToMarkdown } from '../F11';
import { CommitActionButtons } from './CommitActionButtons';

interface CommitListItemProps {
  commit: Commit;
  isSelected: boolean;
  onClick: (commit: Commit) => void;
  onOpenAISummary: () => void;
  onOpenFileCanvas: () => void;
  isAIViewActive: boolean;
  isFileCanvasActive: boolean;
  isSelectModeActive?: boolean;
  isCheckedForGroup?: boolean;
  onToggleCheckForGroup?: (hash: string) => void;
}

const CommitListItemComponent: FC<CommitListItemProps> = ({
  commit,
  isSelected,
  onClick,
  onOpenAISummary,
  onOpenFileCanvas,
  isAIViewActive,
  isFileCanvasActive,
  isSelectModeActive = false,
  isCheckedForGroup = false,
  onToggleCheckForGroup,
}) => {
  const { t, i18n } = useTranslation();
  const pushToast = useAppStore((state) => state.pushToast);

  const handleRowActivate = (): void => {
    if (isSelectModeActive) {
      onToggleCheckForGroup?.(commit.hash);
      return;
    }

    onClick(commit);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowActivate();
    }
  };

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(commitToMarkdown(commit));
    pushToast(t('toast.commit_markdown_copied'), 'success');
  };

  return (
    <div
      className={[
        'group relative flex min-h-12 cursor-pointer items-center gap-2 border-l-2 px-2.5 py-[5px] transition-colors',
        isSelected
          ? 'border-l-accent bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_16%,var(--gae-color-surface))]'
          : 'border-l-transparent hover:bg-hover',
        'focus-visible:outline-1 focus-visible:outline-focus focus-visible:outline-offset-[-1px]',
      ].join(' ')}
      role="listitem"
      tabIndex={0}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`${commit.message} by ${commit.author} on ${formatDate(commit.date, i18n.language)}`}
      onClick={handleRowActivate}
      onKeyDown={handleKeyDown}
    >
      {isSelectModeActive ? (
        <input
          type="checkbox"
          className="size-3.5 shrink-0 cursor-pointer accent-(--color-accent)"
          checked={isCheckedForGroup}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggleCheckForGroup?.(commit.hash)}
          aria-label={t('commit.selection_checkbox_aria', { message: commit.message })}
          title={t('commit.selection_checkbox_aria', { message: commit.message })}
        />
      ) : null}
      <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="absolute top-0 right-0 inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {isSelected ? (
            <CommitActionButtons
              isAIViewActive={isAIViewActive}
              isFileCanvasActive={isFileCanvasActive}
              onOpenAISummary={onOpenAISummary}
              onOpenFileCanvas={onOpenFileCanvas}
            />
          ) : null}
          <CopyMarkdownButton
            className="opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              void handleCopy();
            }}
          />
        </div>
        <span className={['overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap', isSelected ? 'text-text font-semibold' : 'text-text'].join(' ')}>
          {commit.message}
        </span>
        <span className={['flex min-w-0 flex-wrap items-center gap-[7px] text-[11px] leading-[1.35]', isSelected ? 'text-text' : 'text-muted'].join(' ')}>
          <span className={['font-mono text-[11px]', isSelected ? 'text-accent' : 'text-link'].join(' ')}>{commit.shortHash}</span>
          <span>{commit.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={commit.date}>{formatDate(commit.date, i18n.language)}</time>
        </span>
      </div>
    </div>
  );
};

export const CommitListItem = memo(CommitListItemComponent);

function formatDate(date: string, language: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  if (language.startsWith('ko')) {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(parsedDate)
      .replaceAll(' ', '');
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsedDate);
}
