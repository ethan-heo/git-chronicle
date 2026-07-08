import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { getMarkdownHighlighter, inferLanguageFromPath, type HighlightToken } from '../../shared/highlighter';
import { CopyMarkdownButton, codeRangeToMarkdown } from '../F11';
import './SymbolFileCodeViewer.css';

export interface LineRange {
  start: number;
  end: number;
}

interface SymbolFileCodeViewerProps {
  filePath: string;
  fileContent: string;
  language: string;
  highlightRange: LineRange | null;
  scrollToRange: LineRange | null;
  scrollRequestId: number;
}

export const SymbolFileCodeViewer: FC<SymbolFileCodeViewerProps> = ({ filePath, fileContent, language, highlightRange, scrollToRange, scrollRequestId }) => {
  const { t } = useTranslation();
  const pushToast = useAppStore((state) => state.pushToast);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewerRef = useRef<HTMLElement | null>(null);
  const pendingSelectionStartRef = useRef<number | null>(null);
  const hasDraggedSelectionRef = useRef(false);
  const lines = useMemo(() => fileContent.split('\n'), [fileContent]);
  const [tokensByLine, setTokensByLine] = useState<HighlightToken[][]>([]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [copyButtonPosition, setCopyButtonPosition] = useState<{ x: number; y: number } | null>(null);
  const selectedRange = useMemo(() => {
    if (selectionStart === null || selectionEnd === null) {
      return null;
    }

    return {
      start: Math.min(selectionStart, selectionEnd),
      end: Math.max(selectionStart, selectionEnd),
    };
  }, [selectionEnd, selectionStart]);

  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lines.length);
  }, [lines.length]);

  useEffect(() => {
    if (!isDraggingSelection) {
      return;
    }

    const handleMouseUp = (): void => {
      setIsDraggingSelection(false);
      pendingSelectionStartRef.current = null;
      hasDraggedSelectionRef.current = false;
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingSelection]);

  useEffect(() => {
    let cancelled = false;

    if (!fileContent) {
      setTokensByLine([]);
      return () => {
        cancelled = true;
      };
    }

    void getMarkdownHighlighter()
      .then((highlighter) =>
        highlighter.codeToTokens(fileContent, {
          lang: inferLanguageFromPath(language),
          theme: 'dark-plus',
          tokenizeMaxLineLength: 500,
        }),
      )
      .then((result) => {
        if (!cancelled) {
          setTokensByLine(result.tokens.map((lineTokens, index) => normalizeTokens(lineTokens, lines[index] ?? '')));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTokensByLine([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileContent, language, lines]);

  useLayoutEffect(() => {
    if (!scrollToRange) {
      return;
    }

    const targetLine = lineRefs.current[Math.max(0, scrollToRange.start - 1)];
    const viewer = viewerRef.current;

    if (!targetLine || !viewer) {
      return;
    }

    const viewerRect = viewer.getBoundingClientRect();
    const targetRect = targetLine.getBoundingClientRect();
    const nextTop = viewer.scrollTop + (targetRect.top - viewerRect.top) - viewerRect.height / 2 + targetRect.height / 2;
    viewer.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
  }, [scrollRequestId, scrollToRange]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {selectedRange && copyButtonPosition ? (
        <div
          className="absolute z-[3]"
          style={{
            left: `${copyButtonPosition.x}px`,
            top: `${copyButtonPosition.y}px`,
            transform: 'translate(8px, -50%)',
          }}
        >
          <CopyMarkdownButton
            className="opacity-100"
            onClick={() => {
              void navigator.clipboard.writeText(codeRangeToMarkdown(filePath, lines, selectedRange.start, selectedRange.end, language));
              pushToast('선택한 코드를 복사했습니다', 'success');
            }}
          />
        </div>
      ) : null}
      <section
        ref={viewerRef}
        className="flex-1 min-h-0 h-full overflow-auto py-md font-mono text-sm"
        aria-label={t('symbol_graph.code_viewer_aria')}
        tabIndex={0}
        onMouseDown={() => {
          setCopyButtonPosition(null);
        }}
      >
      <div className="min-w-full w-max">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isHighlighted = highlightRange ? lineNumber >= highlightRange.start && lineNumber <= highlightRange.end : false;
          const isSelected = selectedRange ? lineNumber >= selectedRange.start && lineNumber <= selectedRange.end : false;
          const tokens = tokensByLine[index] ?? [{ content: line }];

          return (
            <div
              key={`${lineNumber}-${line}`}
              ref={(element) => {
                lineRefs.current[index] = element;
              }}
              className={[
                'symbol-code-line relative z-0 grid min-w-full w-max grid-cols-[72px_minmax(0,1fr)] gap-5 px-xl leading-[1.75]',
                isHighlighted ? 'symbol-code-line-highlighted' : '',
                isSelected ? 'shadow-[inset_3px_0_0_var(--gae-color-focus)]' : '',
              ].filter(Boolean).join(' ')}
              style={
                isSelected
                  ? {
                      backgroundImage:
                        'linear-gradient(color-mix(in srgb, var(--gae-color-text-secondary) 18%, transparent), color-mix(in srgb, var(--gae-color-text-secondary) 18%, transparent))',
                    }
                  : undefined
              }
              onMouseDown={(event) => {
                event.preventDefault();
                pendingSelectionStartRef.current = lineNumber;
                hasDraggedSelectionRef.current = false;
                setIsDraggingSelection(true);
                setSelectionStart(null);
                setSelectionEnd(null);
                setCopyButtonPosition(null);
              }}
              onMouseEnter={() => {
                if (!isDraggingSelection) {
                  return;
                }

                const pendingStart = pendingSelectionStartRef.current;
                if (pendingStart === null) {
                  return;
                }

                if (!hasDraggedSelectionRef.current) {
                  hasDraggedSelectionRef.current = true;
                  setSelectionStart(pendingStart);
                }

                setSelectionEnd(lineNumber);
              }}
              onMouseUp={(event) => {
                const pendingStart = pendingSelectionStartRef.current;

                if (!hasDraggedSelectionRef.current || pendingStart === null) {
                  setIsDraggingSelection(false);
                  pendingSelectionStartRef.current = null;
                  hasDraggedSelectionRef.current = false;
                  setSelectionStart(null);
                  setSelectionEnd(null);
                  setCopyButtonPosition(null);
                  return;
                }

                if (!viewerRef.current) {
                  setIsDraggingSelection(false);
                  pendingSelectionStartRef.current = null;
                  hasDraggedSelectionRef.current = false;
                  return;
                }

                const rect = viewerRef.current.getBoundingClientRect();
                setIsDraggingSelection(false);
                setSelectionEnd(lineNumber);
                pendingSelectionStartRef.current = null;
                hasDraggedSelectionRef.current = false;
                setCopyButtonPosition({
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                });
              }}
            >
              <span className="pr-2 text-right text-muted select-none">{lineNumber}</span>
              <span className="block min-w-0 w-max whitespace-pre pl-2">
                {tokens.map((token, tokenIndex) => (
                  <span key={`${lineNumber}-${tokenIndex}`} style={token.color ? { color: token.color } : undefined}>
                    {token.content || ' '}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      </section>
    </section>
  );
};

function normalizeTokens(tokens: Array<{ content: string; color?: string }> | undefined, fallback: string): HighlightToken[] {
  if (!tokens || tokens.length === 0) {
    return [{ content: fallback }];
  }

  return tokens.map((token) => ({
    content: token.content,
    color: token.color,
  }));
}
