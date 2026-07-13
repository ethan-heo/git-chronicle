import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { Compartment, EditorState, RangeSetBuilder, StateField, type Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  Decoration,
  EditorView,
  WidgetType,
  drawSelection,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder as cmPlaceholder,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { getMarkdownHighlighter, resolveLanguageTag } from '../../shared/highlighter/shikiHighlighter';
import { prewarmMermaidDiagram, renderedDiagramCache } from './MermaidBlock';

interface MarkdownLiveEditorProps {
  value: string;
  onChange: (value: string) => void;
  onOpenUrl?: (url: string) => void;
  placeholder: string;
}

interface MarkdownLiveEditorHostElement extends HTMLDivElement {
  __cmView?: EditorView;
}

interface CodeHighlightBlock {
  key: string;
  tokensByLine: HighlightLineTokens[] | null;
}

type HighlightLineTokens = Array<{ content: string; color?: string }>;

interface ParsedCodeBlock {
  key: string;
  language: string | null;
  fenceStartLine: number;
  fenceEndLine: number;
  closingFenceFrom: number | null;
  contentFrom: number;
  contentTo: number;
  lines: string[];
}

type TableColumnAlign = 'left' | 'center' | 'right' | null;

interface ParsedTableBlock {
  key: string;
  headerLine: number;
  alignLine: number;
  bodyStartLine: number;
  bodyEndLine: number;
  headerCells: string[];
  aligns: TableColumnAlign[];
  rows: string[][];
}

interface PendingDecoration {
  from: number;
  to: number;
  decoration: Decoration;
}

const themeCompartment = new Compartment();
const previewCompartment = new Compartment();
const placeholderCompartment = new Compartment();

export const MarkdownLiveEditor: FC<MarkdownLiveEditorProps> = ({ value, onChange, onOpenUrl, placeholder }) => {
  const hostRef = useRef<MarkdownLiveEditorHostElement | null>(null);
  const onChangeRef = useRef(onChange);
  const onOpenUrlRef = useRef(onOpenUrl);
  const placeholderRef = useRef(placeholder);
  const highlightedBlocksRef = useRef<Record<string, HighlightLineTokens[] | null>>({});
  const initialValueRef = useRef(value);
  const lastKnownContentRef = useRef(value);
  const [highlightedBlocks, setHighlightedBlocks] = useState<Record<string, HighlightLineTokens[] | null>>({});
  const [mermaidReadyTick, setMermaidReadyTick] = useState(0);

  onChangeRef.current = onChange;
  onOpenUrlRef.current = onOpenUrl;
  placeholderRef.current = placeholder;
  highlightedBlocksRef.current = highlightedBlocks;

  const blocks = useMemo(() => parseCodeBlocks(value), [value]);

  useEffect(() => {
    let cancelled = false;

    const shikiBlocks = blocks.filter((block) => block.language && block.language !== 'mermaid' && resolveLanguageTag(block.language));
    if (shikiBlocks.length === 0) {
      setHighlightedBlocks({});
      return () => {
        cancelled = true;
      };
    }

    void getMarkdownHighlighter()
      .then(async (highlighter) => {
        const results = await Promise.all(
          shikiBlocks.map(async (block): Promise<CodeHighlightBlock> => {
            const language = resolveLanguageTag(block.language ?? undefined);
            if (!language || language === 'text') {
              return { key: block.key, tokensByLine: null };
            }

            try {
              const tokenResult = await highlighter.codeToTokens(block.lines.join('\n'), {
                lang: language,
                theme: 'dark-plus',
                tokenizeMaxLineLength: 500,
              });
              return {
                key: block.key,
                tokensByLine: tokenResult.tokens.map((lineTokens, index) => normalizeTokens(lineTokens, block.lines[index] ?? '')),
              };
            } catch {
              return { key: block.key, tokensByLine: null };
            }
          }),
        );

        if (cancelled) {
          return;
        }

        setHighlightedBlocks(
          Object.fromEntries(results.map((result) => [result.key, result.tokensByLine])),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setHighlightedBlocks({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [blocks]);

  useEffect(() => {
    let cancelled = false;

    const pendingMermaidBlocks = blocks.filter(
      (block) => block.language === 'mermaid' && block.contentTo > block.contentFrom && !renderedDiagramCache.has(`cm-mermaid-${block.key}`),
    );

    if (pendingMermaidBlocks.length === 0) {
      return;
    }

    void Promise.all(
      pendingMermaidBlocks.map((block) => prewarmMermaidDiagram(`cm-mermaid-${block.key}`, block.lines.join('\n'))),
    ).then(() => {
      if (!cancelled) {
        setMermaidReadyTick((tick) => tick + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [blocks]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const editorTheme = EditorView.theme({
      '&': {
        height: '100%',
        backgroundColor: 'var(--gae-color-surface-primary)',
        color: 'var(--gae-color-text-primary)',
        fontSize: 'var(--gae-font-size-sm)',
        caretColor: '#ffffff',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'var(--gae-font-family-mono)',
        lineHeight: '1.7',
      },
      '.cm-content': {
        minHeight: '100%',
        padding: '24px 24px 20px',
        caretColor: 'var(--gae-color-text-primary)',
      },
      '.cm-line': {
        padding: '0',
      },
      '.cm-gutters': {
        border: '0',
        backgroundColor: 'transparent',
        color: 'var(--gae-color-text-secondary)',
      },
      '.cm-activeLine, .cm-activeLineGutter': {
        backgroundColor: 'transparent',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'color-mix(in srgb, var(--gae-color-text-link) 22%, transparent) !important',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#ffffff',
      },
      '&.cm-focused': {
        outline: 'none',
      },
    });

    const view = new EditorView({
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          markdown(),
          keymap.of([
            { key: 'ArrowUp', run: (v) => moveVerticalLineAvoidingLayoutAmbiguity(v, false) },
            { key: 'ArrowDown', run: (v) => moveVerticalLineAvoidingLayoutAmbiguity(v, true) },
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (!update.docChanged) {
              return;
            }

            const nextValue = update.state.doc.toString();
            lastKnownContentRef.current = nextValue;
            onChangeRef.current(nextValue);
          }),
          themeCompartment.of(editorTheme),
          placeholderCompartment.of(
            cmPlaceholder(placeholderRef.current),
          ),
          previewCompartment.of(
            createLivePreviewExtension({
              getHighlightedBlocks: () => highlightedBlocksRef.current,
              openUrl: (url) => onOpenUrlRef.current?.(url),
            }),
          ),
          EditorView.contentAttributes.of({
            'aria-label': placeholderRef.current,
          }),
        ],
      }),
      parent: host,
    });

    host.__cmView = view;
    lastKnownContentRef.current = initialValueRef.current;

    return () => {
      delete host.__cmView;
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const view = hostRef.current?.__cmView;
    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();
    if (value === currentValue || value === lastKnownContentRef.current) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
    lastKnownContentRef.current = value;
  }, [value]);

  useEffect(() => {
    const view = hostRef.current?.__cmView;
    if (!view) {
      return;
    }

    view.dispatch({
      effects: placeholderCompartment.reconfigure(cmPlaceholder(placeholder)),
    });
  }, [placeholder]);

  useEffect(() => {
    const view = hostRef.current?.__cmView;
    if (!view) {
      return;
    }

    view.dispatch({
      effects: previewCompartment.reconfigure(
        createLivePreviewExtension({
          getHighlightedBlocks: () => highlightedBlocks,
          openUrl: (url) => onOpenUrl?.(url),
        }),
      ),
    });
    // mermaidReadyTick은 값 자체를 쓰지 않지만, prewarm이 끝날 때마다 이 effect를 다시 돌려
    // 방금 캐시가 채워진 mermaid 블록의 데코레이션을 다시 계산하기 위한 트리거로 사용한다.
  }, [highlightedBlocks, onOpenUrl, mermaidReadyTick]);

  return <div ref={hostRef} data-testid="markdown-live-editor-host" className="markdown-live-editor h-full min-h-0" />;
};

function createLivePreviewExtension({
  getHighlightedBlocks,
  openUrl,
}: {
  getHighlightedBlocks: () => Record<string, HighlightLineTokens[] | null>;
  openUrl: (url: string) => void;
}): Extension {
  const decorationsField = StateField.define<DecorationSet>({
    create(state) {
      return buildDecorations(state, getHighlightedBlocks());
    },
    update(decorations, transaction) {
      if (transaction.docChanged || transaction.selection) {
        return buildDecorations(transaction.state, getHighlightedBlocks());
      }

      return decorations;
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  return [
    decorationsField,
    EditorView.atomicRanges.of((view) => buildAtomicRanges(view.state)),
    EditorView.domEventHandlers({
      mousedown(event, view) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const checkbox = target.closest<HTMLElement>('[data-markdown-checkbox-from]');
        if (checkbox) {
          event.preventDefault();
          const from = Number(checkbox.dataset.markdownCheckboxFrom);
          const checked = checkbox.dataset.markdownCheckboxChecked === 'true';
          view.dispatch({
            changes: {
              from: from + 1,
              to: from + 2,
              insert: checked ? ' ' : 'x',
            },
          });
          return;
        }

        const link = target.closest<HTMLElement>('[data-markdown-link]');
        if (!link) {
          return;
        }

        if (!event.metaKey && !event.ctrlKey) {
          return;
        }

        event.preventDefault();
        const url = link.dataset.markdownLink;
        if (url) {
          openUrl(url);
        }
      },
    }),
  ];
}

// mermaid/table 위젯처럼 여러 줄을 하나의 block:true replace 데코레이션으로 접는 경우,
// EditorView.decorations에만 등록하고 EditorView.atomicRanges에 같은 범위를 등록하지 않으면
// CodeMirror의 moveVertically()가 이 범위를 하나의 단위로 건너뛰어야 한다는 사실을 모른다.
// 그 결과 접힌 범위 아래에 있는 모든 줄에서(그 범위와 맞닿지 않은 줄까지 포함해) 방향키 위
// 이동이 줄 높이 좌표 계산에 실패해 항상 접힌 범위 바로 앞 줄로 순간이동하는 문제가 생긴다.
// buildAtomicRanges()가 이 함수와 동일한 기준으로 계산한 범위를 atomicRanges에 등록해 해결한다.
function getFoldedMermaidRange(block: ParsedCodeBlock, activeLines: Set<number>): { from: number; to: number } | null {
  if (block.language !== 'mermaid' || block.contentTo <= block.contentFrom) {
    return null;
  }
  if (hasActiveLine(activeLines, block.fenceStartLine, block.fenceEndLine)) {
    return null;
  }
  if (!renderedDiagramCache.has(`cm-mermaid-${block.key}`)) {
    return null;
  }

  return { from: block.contentFrom, to: block.closingFenceFrom ?? block.contentTo };
}

function getFoldedTableRange(block: ParsedTableBlock, doc: EditorState['doc'], activeLines: Set<number>): { from: number; to: number } | null {
  if (hasActiveLine(activeLines, block.headerLine, block.bodyEndLine)) {
    return null;
  }

  return { from: doc.line(block.headerLine).from, to: doc.line(block.bodyEndLine).to };
}

function buildAtomicRanges(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const activeLines = getActiveLines(state);
  const ranges: Array<{ from: number; to: number }> = [];

  for (const block of parseCodeBlocks(state.doc.toString())) {
    const range = getFoldedMermaidRange(block, activeLines);
    if (range && range.to > range.from) {
      ranges.push(range);
    }
  }

  for (const block of parseTableBlocks(state.doc.toString())) {
    const range = getFoldedTableRange(block, state.doc, activeLines);
    if (range && range.to > range.from) {
      ranges.push(range);
    }
  }

  ranges
    .sort((left, right) => left.from - right.from)
    .forEach((range) => {
      builder.add(range.from, range.to, Decoration.replace({}));
    });

  return builder.finish();
}

function buildDecorations(state: EditorState, highlightedBlocks: Record<string, HighlightLineTokens[] | null>): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const pending: PendingDecoration[] = [];
  const doc = state.doc;
  const activeLines = getActiveLines(state);
  const codeBlocks = parseCodeBlocks(doc.toString());
  const tableBlocks = parseTableBlocks(doc.toString());
  const codeLineNumbers = new Set<number>();
  const tableLineNumbers = new Set<number>();

  for (const block of codeBlocks) {
    for (let lineNumber = block.fenceStartLine; lineNumber <= block.fenceEndLine; lineNumber += 1) {
      codeLineNumbers.add(lineNumber);
    }

    const isActive = hasActiveLine(activeLines, block.fenceStartLine, block.fenceEndLine);
    if (isActive) {
      continue;
    }

    if (block.language === 'mermaid' && block.contentTo > block.contentFrom) {
      // 다이어그램이 아직 렌더링되지 않았다면 위젯으로 접지 않는다. 미리 캐시를 채워두지 않고
      // 접었다가 렌더링이 끝난 뒤 위젯 높이가 그 자리에서 커지면, CodeMirror가 이후 줄들의 높이
      // 캐시를 제대로 갱신하지 못해 방향키 커서 이동이 엉뚱한 줄로 튀는 문제가 생긴다.
      if (renderedDiagramCache.has(`cm-mermaid-${block.key}`)) {
        const mermaidReplaceTo = block.closingFenceFrom ?? block.contentTo;
        pending.push({
          from: block.contentFrom,
          to: mermaidReplaceTo,
          decoration: Decoration.replace({
            block: true,
            widget: new MermaidWidget(block.key, block.lines.join('\n')),
          }),
        });
      }
      continue;
    }

    const tokensByLine = highlightedBlocks[block.key];
    if (!tokensByLine) {
      continue;
    }

    for (let index = 0; index < tokensByLine.length; index += 1) {
      const lineNumber = block.fenceStartLine + 1 + index;
      if (lineNumber >= block.fenceEndLine) {
        continue;
      }

      const line = doc.line(lineNumber);
      let cursor = line.from;
      for (const token of tokensByLine[index] ?? []) {
        const tokenLength = token.content.length;
        if (tokenLength === 0) {
          continue;
        }

        pending.push({
          from: cursor,
          to: cursor + tokenLength,
          decoration: Decoration.mark({
            attributes: token.color ? { style: `color: ${token.color};` } : undefined,
          }),
        });
        cursor += tokenLength;
      }
    }
  }

  for (const block of tableBlocks) {
    for (let lineNumber = block.headerLine; lineNumber <= block.bodyEndLine; lineNumber += 1) {
      tableLineNumbers.add(lineNumber);
    }

    if (hasActiveLine(activeLines, block.headerLine, block.bodyEndLine)) {
      continue;
    }

    const headerLine = doc.line(block.headerLine);
    const bodyEndLine = doc.line(block.bodyEndLine);
    pending.push({
      from: headerLine.from,
      to: bodyEndLine.to,
      decoration: Decoration.replace({
        block: true,
        widget: new TableWidget(block),
      }),
    });
  }

  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber += 1) {
    if (codeLineNumbers.has(lineNumber) || tableLineNumbers.has(lineNumber)) {
      continue;
    }

    const line = doc.line(lineNumber);
    decorateLine(pending, line.from, line.text, activeLines.has(lineNumber));
  }

  pending
    .sort((left, right) => (left.from === right.from ? left.to - right.to : left.from - right.from))
    .forEach((entry) => {
      builder.add(entry.from, entry.to, entry.decoration);
    });

  return builder.finish();
}

function decorateLine(pending: PendingDecoration[], lineFrom: number, text: string, isActive: boolean): void {
  if (!text) {
    return;
  }

  const hrMatch = text.match(/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/);
  if (hrMatch) {
    if (isActive) {
      return;
    }

    // MermaidWidget과 달리 block:true를 주지 않는다. 이 줄은 어차피 한 줄 전체를 위젯으로
    // 대체하므로 block:true 없이도 정상적으로 렌더링되는데, block:true를 주면 CodeMirror
    // 6.43.6의 posAtCoords/moveVertically가 이 위젯보다 아래에 있는 모든 줄에서 세로 방향
    // 커서 이동 좌표를 잘못 계산해, 거리와 무관하게 항상 위젯 바로 앞 줄로 커서가 튄다
    // (moveVerticalLineAvoidingLayoutAmbiguity의 mermaid collapsingBlock 주석과 같은 결함).
    pending.push({ from: lineFrom, to: lineFrom + text.length, decoration: Decoration.replace({ widget: new HorizontalRuleWidget() }) });
    return;
  }

  const headingMatch = text.match(/^(\s{0,3}#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const markerLength = headingMatch[1].length + 1;
    const level = headingMatch[1].trim().length;
    const headingDecoration = Decoration.mark({ class: `cm-md-heading cm-md-heading-${level}` });

    // 커서가 헤딩 줄에 있어도 원문 `#` 마커만 드러내고 헤딩 폰트 스타일은 유지한다.
    pending.push({
      from: lineFrom,
      to: lineFrom + markerLength,
      decoration: isActive ? headingDecoration : hiddenSyntaxDecoration,
    });
    pending.push({ from: lineFrom + markerLength, to: lineFrom + text.length, decoration: headingDecoration });

    if (!isActive) {
      decorateInline(pending, lineFrom + markerLength, headingMatch[2]);
    }
    return;
  }

  if (isActive) {
    return;
  }

  const blockquoteMatch = text.match(/^(\s*>\s?)(.*)$/);
  if (blockquoteMatch) {
    const markerLength = blockquoteMatch[1].length;
    pending.push({ from: lineFrom, to: lineFrom + markerLength, decoration: hiddenSyntaxDecoration });
    pending.push({ from: lineFrom + markerLength, to: lineFrom + text.length, decoration: Decoration.mark({ class: 'cm-md-blockquote' }) });
    decorateInline(pending, lineFrom + markerLength, blockquoteMatch[2]);
    return;
  }

  const checkboxMatch = text.match(/^(\s*[-*+]\s+)\[( |x|X)\]\s+(.*)$/);
  if (checkboxMatch) {
    const checkboxFrom = lineFrom + checkboxMatch[1].length;
    pending.push({
      from: checkboxFrom,
      to: checkboxFrom + 3,
      decoration: Decoration.replace({
        widget: new CheckboxWidget(checkboxFrom, checkboxMatch[2].toLowerCase() === 'x'),
      }),
    });
    const contentFrom = checkboxFrom + 4;
    pending.push({ from: contentFrom, to: lineFrom + text.length, decoration: Decoration.mark({ class: 'cm-md-list-item' }) });
    decorateInline(pending, contentFrom, checkboxMatch[3]);
    return;
  }

  const orderedListMatch = text.match(/^(\s*)(\d+\.)\s+(.*)$/);
  if (orderedListMatch) {
    const markerFrom = lineFrom + orderedListMatch[1].length;
    pending.push({
      from: markerFrom,
      to: markerFrom + orderedListMatch[2].length + 1,
      decoration: Decoration.replace({ widget: new ListMarkerWidget(`${orderedListMatch[2]} `) }),
    });
    const contentFrom = markerFrom + orderedListMatch[2].length + 1;
    pending.push({ from: contentFrom, to: lineFrom + text.length, decoration: Decoration.mark({ class: 'cm-md-list-item' }) });
    decorateInline(pending, contentFrom, orderedListMatch[3]);
    return;
  }

  const unorderedListMatch = text.match(/^(\s*)([-*+])\s+(.*)$/);
  if (unorderedListMatch) {
    const markerFrom = lineFrom + unorderedListMatch[1].length;
    pending.push({
      from: markerFrom,
      to: markerFrom + unorderedListMatch[2].length + 1,
      decoration: Decoration.replace({ widget: new ListMarkerWidget('• ') }),
    });
    const contentFrom = markerFrom + unorderedListMatch[2].length + 1;
    pending.push({ from: contentFrom, to: lineFrom + text.length, decoration: Decoration.mark({ class: 'cm-md-list-item' }) });
    decorateInline(pending, contentFrom, unorderedListMatch[3]);
    return;
  }

  decorateInline(pending, lineFrom, text);
}

function decorateInline(pending: PendingDecoration[], lineFrom: number, text: string): void {
  forEachInlineMatch(text, (match, start) => {
    const absoluteStart = lineFrom + start;

    if (match.kind === 'link') {
      const labelFrom = absoluteStart + 1;
      const labelTo = labelFrom + match.label.length;
      const closeFrom = labelTo;
      const suffixTo = absoluteStart + match.raw.length;

      pending.push({ from: absoluteStart, to: labelFrom, decoration: hiddenSyntaxDecoration });
      pending.push({ from: closeFrom, to: suffixTo, decoration: hiddenSyntaxDecoration });
      pending.push({
        from: labelFrom,
        to: labelTo,
        decoration: Decoration.mark({
          class: 'cm-md-link',
          attributes: {
            'data-markdown-link': match.url,
          },
        }),
      });
      return;
    }

    pending.push({
      from: absoluteStart,
      to: absoluteStart + match.markerLength,
      decoration: hiddenSyntaxDecoration,
    });
    pending.push({
      from: absoluteStart + match.markerLength + match.content.length,
      to: absoluteStart + match.raw.length,
      decoration: hiddenSyntaxDecoration,
    });
    pending.push({
      from: absoluteStart + match.markerLength,
      to: absoluteStart + match.markerLength + match.content.length,
      decoration: Decoration.mark({ class: match.className }),
    });
  });
}

function applyPattern(
  text: string,
  lineFrom: number,
  pattern: RegExp,
  occupied: Array<[number, number]>,
  decorate: (match: RegExpExecArray, absoluteStart: number) => void,
): void {
  pattern.lastIndex = 0;

  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const relativeStart = match.index;
    const relativeEnd = relativeStart + match[0].length;
    if (occupied.some(([start, end]) => relativeStart < end && relativeEnd > start)) {
      continue;
    }

    occupied.push([relativeStart, relativeEnd]);
    decorate(match, lineFrom + relativeStart);
  }
}

function getActiveLines(state: EditorState): Set<number> {
  const lines = new Set<number>();

  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber += 1) {
      lines.add(lineNumber);
    }
  }

  return lines;
}

function hasActiveLine(activeLines: Set<number>, fromLine: number, toLine: number): boolean {
  for (let lineNumber = fromLine; lineNumber <= toLine; lineNumber += 1) {
    if (activeLines.has(lineNumber)) {
      return true;
    }
  }

  return false;
}

// CodeMirror의 내부 posAtCoords()는 세로 방향 커서 이동 시 픽셀 좌표만으로 목표 위치를 찾는데,
// 두 가지 경우에 그 좌표 계산이 실제 문서 위치와 어긋나는 결함이 있다(CodeMirror 6.43.6 기준).
// 1) block:true 위젯(mermaid 다이어그램)을 건너뛸 때 위젯 바로 다음 실제 줄과의 경계를 잘못
//    판정해 커서가 엉뚱한 줄로 튄다.
// 2) 이동할 줄이 폭 0인 hiddenSyntaxDecoration으로 문법 기호(헤딩 `#`, 인용구 `>`, **굵게**,
//    *기울임*, `링크`, `인라인 코드`, ~~취소선~~ 등)를 줄 맨 앞에서 숨기고 있을 때, 그 폭 0 구간의
//    시작과 끝이 화면상 같은 x좌표에 놓여 posAtCoords가 어느 위치인지 구분하지 못하고 항상 구간
//    끝(문법 기호 바로 뒤)으로 커서를 보낸다. 그 결과 인용구 등 바로 아래 줄에서 위로 이동하면
//    커서가 줄 맨 앞이 아니라 숨겨진 기호 뒤로 튄다.
// 두 경우 모두 픽셀 좌표 기반 기본 알고리즘을 우회하고, 우리가 이미 알고 있는 논리적 줄 구조로
// 직접 다음 줄과 컬럼을 계산해 문제를 피한다. 두 상황에 해당하지 않는 일반적인 이동(줄바꿈된 긴
// 줄 사이 이동 등)에는 관여하지 않고 CodeMirror 기본 동작에 맡긴다.
function moveVerticalLineAvoidingLayoutAmbiguity(view: EditorView, forward: boolean): boolean {
  const range = view.state.selection.main;
  if (!range.empty) {
    return false;
  }

  const doc = view.state.doc;
  const currentLine = doc.lineAt(range.head);
  const column = range.head - currentLine.from;
  let targetLineNumber = currentLine.number + (forward ? 1 : -1);

  if (targetLineNumber < 1 || targetLineNumber > doc.lines) {
    return false;
  }

  const blocks = parseCodeBlocks(doc.toString());
  const tableBlocks = parseTableBlocks(doc.toString());
  // 커서가 이미 블록 내부 줄(헤더~바디 끝, 펜스 시작~끝)에 있다면 그 블록은 isActive로 이미
  // 펼쳐진 상태다. 이때는 진입 보정을 적용하지 않고 일반 줄 이동에 맡겨야 한다. 그렇지 않으면
  // 블록 내부에서 위/아래로 이동할 때마다 매번 "진입"으로 오인해 헤더/바디 끝 줄로 순간이동해
  // 중간 줄(정렬 구분자, 표 행 등)이 전부 건너뛰어진다.
  const collapsingBlock = blocks.find(
    (block) =>
      block.language === 'mermaid' &&
      block.contentTo > block.contentFrom &&
      renderedDiagramCache.has(`cm-mermaid-${block.key}`) &&
      targetLineNumber > block.fenceStartLine &&
      targetLineNumber < block.fenceEndLine &&
      (currentLine.number < block.fenceStartLine || currentLine.number > block.fenceEndLine),
  );

  if (collapsingBlock) {
    targetLineNumber = forward ? collapsingBlock.fenceEndLine : collapsingBlock.fenceStartLine;
  } else {
    const collapsingTableBlock = tableBlocks.find(
      (block) =>
        targetLineNumber >= block.headerLine &&
        targetLineNumber <= block.bodyEndLine &&
        (currentLine.number < block.headerLine || currentLine.number > block.bodyEndLine),
    );
    if (collapsingTableBlock) {
      // 방향키는 항상 한 줄씩만 이동하므로, 블록 밖에서 안으로 "진입"하는 시점의 targetLineNumber는
      // 이미 진입 방향에 가장 가까운 경계 줄(아래로 진입하면 헤더 줄, 위로 진입하면 마지막 row 줄)과
      // 같다. 여기서 반대쪽 경계로 재할당하면 표 전체를 한 번에 건너뛰어 버리므로, 같은 방향의
      // 경계 줄을 그대로 사용해 CodeMirror의 기본 픽셀 좌표 계산만 우회한다.
      targetLineNumber = forward ? collapsingTableBlock.headerLine : collapsingTableBlock.bodyEndLine;
    } else {
      const hiddenPrefixLength = getLeadingHiddenMarkerLength(doc.line(targetLineNumber).text);
      const needsHiddenPrefixCorrection = hiddenPrefixLength > 0 && column <= hiddenPrefixLength;

      // mermaid/table을 하나의 block:true 위젯으로 접는 것(여러 문서 줄을 한 range로 replace)은
      // CodeMirror 6.43.6에서 내부 높이 맵(heightMap)이 실제 DOM 높이와 어긋나게 만드는 별도
      // 결함이 있다 — 위젯 실측 높이가 반영된 뒤에도 절대 스스로 복구되지 않고, 그 블록보다
      // 아래에 있는 모든 줄에서(그 블록과 맞닿지 않은, 훨씬 떨어진 줄까지 포함해) 위 방향키가
      // 블록 바로 앞 줄로 순간이동한다(EditorView.atomicRanges를 등록해도 moveVertically 내부의
      // posAtCoords가 이 높이 맵을 그대로 쓰기 때문에 해결되지 않았다). mermaid/table 블록이
      // 문서 어디에든 존재하면 CodeMirror의 픽셀 좌표 기반 이동을 아예 신뢰할 수 없으므로, 화면에
      // 줄바꿈되지 않은(단일 시각적 줄인) 일반 줄 이동도 여기서 논리 줄/컬럼으로 직접 계산한다.
      // 줄바꿈된 긴 줄 내부에서의 시각적 줄 이동만 CodeMirror 기본 동작에 맡긴다.
      if (!needsHiddenPrefixCorrection && isLineWrapped(view, currentLine.from)) {
        return false;
      }
    }
  }

  const targetLine = doc.line(targetLineNumber);
  const targetPos = Math.min(targetLine.from + column, targetLine.to);

  view.dispatch({
    selection: { anchor: targetPos },
    scrollIntoView: true,
    userEvent: 'select',
  });
  return true;
}

// 줄이 뷰포트 너비 안에서 여러 시각적 줄로 감싸져 있는지(line wrapping) 실제 DOM 사각형
// 개수로 판정한다. CodeMirror의 내부 높이 맵은 이 문서에서 신뢰할 수 없으므로(위
// moveVerticalLineAvoidingLayoutAmbiguity의 주석 참고), 높이 맵을 참조하는 API 대신
// getClientRects()로 실측한다.
function isLineWrapped(view: EditorView, pos: number): boolean {
  const domPos = view.domAtPos(pos);
  const node = domPos.node instanceof Element ? domPos.node : domPos.node.parentElement;
  const lineElement = node?.closest('.cm-line');
  if (!lineElement) {
    return false;
  }

  return lineElement.getClientRects().length > 1;
}

// 어떤 줄이 비활성 상태(커서가 그 줄에 없음)일 때 hiddenSyntaxDecoration으로 줄 맨 앞부터
// 몇 글자를 숨기는지 계산한다. decorateLine과 동일한 규칙을 재사용해 판정 로직이 어긋나지
// 않도록 한다. 체크박스·목록처럼 위젯으로 치환되는 마커는 폭이 0이 아니므로 대상에서 제외된다.
function getLeadingHiddenMarkerLength(text: string): number {
  const probe: PendingDecoration[] = [];
  decorateLine(probe, 0, text, false);

  let length = 0;
  for (const entry of probe) {
    if (entry.from === 0 && entry.decoration === hiddenSyntaxDecoration) {
      length = Math.max(length, entry.to);
    }
  }
  return length;
}

function parseCodeBlocks(content: string): ParsedCodeBlock[] {
  const lines = content.split('\n');
  const blocks: ParsedCodeBlock[] = [];
  let offset = 0;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const fenceMatch = line.match(/^```([^\s`]+)?\s*$/);
    if (!fenceMatch) {
      offset += line.length + 1;
      index += 1;
      continue;
    }

    const language = fenceMatch[1]?.toLowerCase() ?? null;
    const fenceStartLine = index + 1;
    const fenceStartOffset = offset;
    const contentStartOffset = offset + line.length + 1;
    const contentLines: string[] = [];

    index += 1;
    offset += line.length + 1;

    while (index < lines.length && !/^```\s*$/.test(lines[index])) {
      contentLines.push(lines[index]);
      offset += lines[index].length + 1;
      index += 1;
    }

    const closingLine = lines[index] ?? '';
    const hasClosingFence = index < lines.length;
    const fenceEndLine = Math.min(index + 1, lines.length);
    const contentEndOffset = Math.max(contentStartOffset, offset - 1);
    const closingFenceFrom = hasClosingFence ? offset : null;

    if (hasClosingFence) {
      offset += closingLine.length + 1;
      index += 1;
    }

    blocks.push({
      key: `${fenceStartOffset}-${language ?? 'plain'}-${contentLines.join('\n')}`,
      language,
      fenceStartLine,
      fenceEndLine,
      closingFenceFrom,
      contentFrom: contentStartOffset,
      contentTo: contentEndOffset,
      lines: contentLines,
    });
  }

  return blocks;
}

function parseTableBlocks(content: string): ParsedTableBlock[] {
  const lines = content.split('\n');
  const blocks: ParsedTableBlock[] = [];
  let index = 0;

  while (index < lines.length - 1) {
    const headerCells = parseTableRow(lines[index]);
    if (!headerCells) {
      index += 1;
      continue;
    }

    const aligns = parseTableAlignmentRow(lines[index + 1]);
    if (!aligns || aligns.length !== headerCells.length) {
      index += 1;
      continue;
    }

    const rows: string[][] = [];
    let bodyIndex = index + 2;
    while (bodyIndex < lines.length) {
      const rowCells = parseTableRow(lines[bodyIndex]);
      if (!rowCells) {
        break;
      }

      if (rowCells.length !== headerCells.length) {
        rows.length = 0;
        bodyIndex = index + 1;
        break;
      }

      rows.push(rowCells);
      bodyIndex += 1;
    }

    if (bodyIndex === index + 1) {
      index += 1;
      continue;
    }

    const bodyEndLine = Math.max(index + 2, bodyIndex) ;
    blocks.push({
      key: `${index}-${lines.slice(index, bodyIndex).join('\n')}`,
      headerLine: index + 1,
      alignLine: index + 2,
      bodyStartLine: index + 3,
      bodyEndLine,
      headerCells,
      aligns,
      rows,
    });
    index = bodyIndex;
  }

  return blocks;
}

function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null;
  }

  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function parseTableAlignmentRow(line: string): TableColumnAlign[] | null {
  const cells = parseTableRow(line);
  if (!cells || cells.length === 0) {
    return null;
  }

  const aligns: TableColumnAlign[] = [];
  for (const cell of cells) {
    if (!/^:?-{3,}:?$/.test(cell)) {
      return null;
    }

    const startsWithColon = cell.startsWith(':');
    const endsWithColon = cell.endsWith(':');
    if (startsWithColon && endsWithColon) {
      aligns.push('center');
    } else if (endsWithColon) {
      aligns.push('right');
    } else if (startsWithColon) {
      aligns.push('left');
    } else {
      aligns.push(null);
    }
  }

  return aligns;
}

function normalizeTokens(tokens: Array<{ content: string; color?: string }> | undefined, fallback: string): HighlightLineTokens {
  if (!tokens || tokens.length === 0) {
    return [{ content: fallback }];
  }

  return tokens.map((token) => ({
    content: token.content,
    color: token.color,
  }));
}

// mark + CSS display:none 방식은 숨겨진 span이 DOM에 남아 CodeMirror의 좌표<->포지션 매핑을
// 왜곡시켜 위/아래 방향키 커서 이동이 엉뚱한 줄로 튀는 문제를 일으킨다. 실제로 콘텐츠를 렌더링
// 트리에서 제거하는 replace 데코레이션을 사용해야 커서 이동 좌표 계산이 올바르게 이뤄진다.
const hiddenSyntaxDecoration = Decoration.replace({});

type InlineMatch =
  | { kind: 'link'; raw: string; label: string; url: string }
  | { kind: 'strong' | 'strike' | 'code' | 'emphasis'; raw: string; content: string; markerLength: number; className: string };

function forEachInlineMatch(text: string, decorate: (match: InlineMatch, start: number) => void): void {
  const occupied: Array<[number, number]> = [];

  applyPattern(text, 0, /\[([^\]]+)\]\(([^)]+)\)/g, occupied, (match, start) => {
    decorate(
      {
        kind: 'link',
        raw: match[0],
        label: match[1],
        url: match[2],
      },
      start,
    );
  });

  applyPattern(text, 0, /\*\*([^*\n]+)\*\*/g, occupied, (match, start) => {
    decorate(
      {
        kind: 'strong',
        raw: match[0],
        content: match[1],
        markerLength: 2,
        className: 'cm-md-strong',
      },
      start,
    );
  });

  applyPattern(text, 0, /~~([^~\n]+)~~/g, occupied, (match, start) => {
    decorate(
      {
        kind: 'strike',
        raw: match[0],
        content: match[1],
        markerLength: 2,
        className: 'cm-md-strike',
      },
      start,
    );
  });

  applyPattern(text, 0, /`([^`\n]+)`/g, occupied, (match, start) => {
    decorate(
      {
        kind: 'code',
        raw: match[0],
        content: match[1],
        markerLength: 1,
        className: 'cm-md-inline-code',
      },
      start,
    );
  });

  applyPattern(text, 0, /(?<!\*)\*([^*\n]+)\*(?!\*)/g, occupied, (match, start) => {
    decorate(
      {
        kind: 'emphasis',
        raw: match[0],
        content: match[1],
        markerLength: 1,
        className: 'cm-md-emphasis',
      },
      start,
    );
  });
}

class CheckboxWidget extends WidgetType {
  constructor(
    private readonly from: number,
    private readonly checked: boolean,
  ) {
    super();
  }

  eq(other: CheckboxWidget): boolean {
    return this.from === other.from && this.checked === other.checked;
  }

  toDOM(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'cm-md-checkbox';
    element.contentEditable = 'false';
    element.dataset.markdownCheckboxFrom = String(this.from);
    element.dataset.markdownCheckboxChecked = String(this.checked);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.checked;
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');

    element.append(input);
    return element;
  }
}

class ListMarkerWidget extends WidgetType {
  constructor(private readonly label: string) {
    super();
  }

  eq(other: ListMarkerWidget): boolean {
    return this.label === other.label;
  }

  toDOM(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'cm-md-list-marker';
    element.textContent = this.label;
    element.contentEditable = 'false';
    return element;
  }
}

class HorizontalRuleWidget extends WidgetType {
  // CheckboxWidget/ListMarkerWidget/MermaidWidget처럼 eq()를 둬서, 셀렉션만 바뀌어 내용은
  // 그대로인 buildDecorations() 재계산에서도 CodeMirror가 이 위젯의 DOM을 불필요하게
  // 파괴·재생성하지 않도록 한다(WidgetType 기본 eq()는 항상 false를 반환한다).
  eq(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'cm-md-hr';
    element.contentEditable = 'false';
    return element;
  }
}

class MermaidWidget extends WidgetType {
  constructor(
    private readonly cacheKey: string,
    private readonly code: string,
  ) {
    super();
  }

  eq(other: MermaidWidget): boolean {
    return this.cacheKey === other.cacheKey && this.code === other.code;
  }

  toDOM(view: EditorView): HTMLElement {
    const element = document.createElement('div');
    element.className = 'cm-md-mermaid-widget';
    element.contentEditable = 'false';

    // buildDecorations()는 renderedDiagramCache에 이미 렌더링된 SVG가 있을 때만 이 위젯을
    // 만든다(prewarmMermaidDiagram 참고). 캐시된 SVG를 innerHTML로 동기 삽입해 위젯이 처음
    // DOM에 붙는 순간 이미 최종 크기여야 한다는 것을 보장한다.
    const svg = renderedDiagramCache.get(`cm-mermaid-${this.cacheKey}`) ?? '';
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'note-preview-mermaid';
    contentWrapper.innerHTML = svg;
    element.append(contentWrapper);

    // 방향키 커서 이동 자체는 moveVerticalLineAvoidingMermaid()가 CodeMirror의 픽셀 좌표
    // 계산을 우회해서 처리하지만, 스크롤 위치 계산 등 다른 용도로도 줄 높이 캐시는 정확해야
    // 하므로 위젯이 붙은 직후 명시적으로 재측정을 예약해 둔다.
    view.requestMeasure();

    return element;
  }
}

class TableWidget extends WidgetType {
  constructor(private readonly block: ParsedTableBlock) {
    super();
  }

  eq(other: TableWidget): boolean {
    return JSON.stringify(this.block) === JSON.stringify(other.block);
  }

  toDOM(view: EditorView): HTMLElement {
    const element = document.createElement('div');
    element.className = 'cm-md-table-widget';
    element.contentEditable = 'false';

    const table = document.createElement('table');
    table.className = 'cm-md-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    this.block.headerCells.forEach((cell, index) => {
      headerRow.append(createTableCell('th', cell, this.block.aligns[index]));
    });
    thead.append(headerRow);
    table.append(thead);

    const tbody = document.createElement('tbody');
    this.block.rows.forEach((row) => {
      const tr = document.createElement('tr');
      row.forEach((cell, index) => {
        tr.append(createTableCell('td', cell, this.block.aligns[index]));
      });
      tbody.append(tr);
    });
    table.append(tbody);

    element.append(table);
    view.requestMeasure();
    return element;
  }
}

function createTableCell(tagName: 'th' | 'td', text: string, align: TableColumnAlign): HTMLElement {
  const cell = document.createElement(tagName);
  cell.className = ['cm-md-table-cell', align ? `cm-md-table-cell-${align}` : ''].filter(Boolean).join(' ');
  if (align) {
    cell.style.textAlign = align;
  }
  cell.append(renderInlineContent(text));
  return cell;
}

function renderInlineContent(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const matches: Array<{ start: number; match: InlineMatch }> = [];

  forEachInlineMatch(text, (match, start) => {
    matches.push({ start, match });
  });

  matches.sort((left, right) => left.start - right.start);
  let cursor = 0;
  for (const entry of matches) {
    if (cursor < entry.start) {
      fragment.append(document.createTextNode(text.slice(cursor, entry.start)));
    }

    if (entry.match.kind === 'link') {
      const link = document.createElement('span');
      link.className = 'cm-md-link';
      link.dataset.markdownLink = entry.match.url;
      link.textContent = entry.match.label;
      fragment.append(link);
    } else {
      const span = document.createElement('span');
      span.className = entry.match.className;
      span.textContent = entry.match.content;
      fragment.append(span);
    }

    cursor = entry.start + entry.match.raw.length;
  }

  if (cursor < text.length) {
    fragment.append(document.createTextNode(text.slice(cursor)));
  }

  return fragment;
}
