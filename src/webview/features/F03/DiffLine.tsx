import type { FC } from 'react';
import type { DiffLineData, DiffLineType } from './types';

interface DiffLineProps {
  line: DiffLineData;
}

const LINE_PREFIX: Record<DiffLineType, string> = {
  added: '+',
  removed: '-',
  context: ' ',
};

export const DiffLine: FC<DiffLineProps> = ({ line }) => {
  return (
    <div className={`diff-line diff-line-${line.type}`} role="listitem">
      <span className="diff-line-number" aria-hidden="true">
        {line.oldLineNumber ?? ''}
      </span>
      <span className="diff-line-number" aria-hidden="true">
        {line.newLineNumber ?? ''}
      </span>
      <span className="diff-line-prefix" aria-hidden="true">
        {LINE_PREFIX[line.type]}
      </span>
      <code className="diff-line-content">
        {line.tokens.map((token, index) => (
          <span key={`${index}-${token.content}`} style={token.color ? { color: token.color } : undefined}>
            {token.content || ' '}
          </span>
        ))}
      </code>
    </div>
  );
};
