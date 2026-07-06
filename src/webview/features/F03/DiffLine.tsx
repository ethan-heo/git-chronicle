import type { FC } from 'react';
import type { DiffLineData, DiffLineType } from './types';

interface DiffLineProps {
  line: DiffLineData;
  isSelected?: boolean;
}

const LINE_PREFIX: Record<DiffLineType, string> = {
  added: '+',
  removed: '-',
  context: ' ',
};

export const DiffLine: FC<DiffLineProps> = ({ line, isSelected = false }) => {
  const prefixColorClassName =
    line.type === 'added' ? 'text-added' : line.type === 'removed' ? 'text-deleted' : 'text-muted';
  const backgroundClassName =
    line.type === 'added'
      ? 'diff-line-added bg-[var(--gae-color-diff-added)]'
      : line.type === 'removed'
        ? 'diff-line-removed bg-[var(--gae-color-diff-removed)]'
        : 'diff-line-context';

  return (
    <div
      className={`grid min-h-5 grid-cols-[48px_48px_18px_minmax(0,1fr)] whitespace-pre max-[320px]:grid-cols-[18px_minmax(0,1fr)] ${backgroundClassName} ${isSelected ? 'shadow-[inset_3px_0_0_var(--gae-color-focus)]' : ''}`}
      style={
        isSelected
          ? {
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--gae-color-text-secondary) 18%, transparent), color-mix(in srgb, var(--gae-color-text-secondary) 18%, transparent))',
            }
          : undefined
      }
      role="listitem"
    >
      <span className="border-r border-r-[color-mix(in_srgb,var(--color-line)_58%,transparent)] px-[9px] text-right [font-variant-numeric:tabular-nums] text-[var(--vscode-editorLineNumber-foreground,var(--color-muted))] select-none max-[320px]:hidden" aria-hidden="true">
        {line.oldLineNumber ?? ''}
      </span>
      <span className="border-r border-r-[color-mix(in_srgb,var(--color-line)_58%,transparent)] px-[9px] text-right [font-variant-numeric:tabular-nums] text-[var(--vscode-editorLineNumber-foreground,var(--color-muted))] select-none max-[320px]:hidden" aria-hidden="true">
        {line.newLineNumber ?? ''}
      </span>
      <span className={`text-center select-none ${prefixColorClassName}`} aria-hidden="true">
        {LINE_PREFIX[line.type]}
      </span>
      <code className="min-w-0 px-[4px] pr-[14px] font-inherit">
        {line.tokens.map((token, index) => (
          <span key={`${index}-${token.content}`} style={token.color ? { color: token.color } : undefined}>
            {token.content || ' '}
          </span>
        ))}
      </code>
    </div>
  );
};
