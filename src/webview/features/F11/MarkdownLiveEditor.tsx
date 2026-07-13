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

function buildDecorations(state: EditorState, highlightedBlocks: Record<string, HighlightLineTokens[] | null>): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const pending: PendingDecoration[] = [];
  const doc = state.doc;
  const activeLines = getActiveLines(state);
  const codeBlocks = parseCodeBlocks(doc.toString());
  const codeLineNumbers = new Set<number>();

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

  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber += 1) {
    if (codeLineNumbers.has(lineNumber)) {
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
  const occupied: Array<[number, number]> = [];

  applyPattern(text, lineFrom, /\[([^\]]+)\]\(([^)]+)\)/g, occupied, (match, start) => {
    const label = match[1];
    const url = match[2];
    const openLength = 1;
    const labelFrom = start + openLength;
    const labelTo = labelFrom + label.length;
    const closeFrom = labelTo;
    const suffixTo = start + match[0].length;

    pending.push({ from: start, to: labelFrom, decoration: hiddenSyntaxDecoration });
    pending.push({ from: closeFrom, to: suffixTo, decoration: hiddenSyntaxDecoration });
    pending.push({
      from: labelFrom,
      to: labelTo,
      decoration: Decoration.mark({
        class: 'cm-md-link',
        attributes: {
          'data-markdown-link': url,
        },
      }),
    });
  });

  applyPattern(text, lineFrom, /\*\*([^*\n]+)\*\*/g, occupied, (match, start) => {
    const content = match[1];
    const contentFrom = start + 2;
    const contentTo = contentFrom + content.length;
    pending.push({ from: start, to: contentFrom, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentTo, to: start + match[0].length, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentFrom, to: contentTo, decoration: Decoration.mark({ class: 'cm-md-strong' }) });
  });

  applyPattern(text, lineFrom, /~~([^~\n]+)~~/g, occupied, (match, start) => {
    const content = match[1];
    const contentFrom = start + 2;
    const contentTo = contentFrom + content.length;
    pending.push({ from: start, to: contentFrom, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentTo, to: start + match[0].length, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentFrom, to: contentTo, decoration: Decoration.mark({ class: 'cm-md-strike' }) });
  });

  applyPattern(text, lineFrom, /`([^`\n]+)`/g, occupied, (match, start) => {
    const content = match[1];
    const contentFrom = start + 1;
    const contentTo = contentFrom + content.length;
    pending.push({ from: start, to: contentFrom, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentTo, to: start + match[0].length, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentFrom, to: contentTo, decoration: Decoration.mark({ class: 'cm-md-inline-code' }) });
  });

  applyPattern(text, lineFrom, /(?<!\*)\*([^*\n]+)\*(?!\*)/g, occupied, (match, start) => {
    const content = match[1];
    const contentFrom = start + 1;
    const contentTo = contentFrom + content.length;
    pending.push({ from: start, to: contentFrom, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentTo, to: start + match[0].length, decoration: hiddenSyntaxDecoration });
    pending.push({ from: contentFrom, to: contentTo, decoration: Decoration.mark({ class: 'cm-md-emphasis' }) });
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
  const collapsingBlock = blocks.find(
    (block) =>
      block.language === 'mermaid' &&
      block.contentTo > block.contentFrom &&
      renderedDiagramCache.has(`cm-mermaid-${block.key}`) &&
      targetLineNumber > block.fenceStartLine &&
      targetLineNumber < block.fenceEndLine,
  );

  if (collapsingBlock) {
    targetLineNumber = forward ? collapsingBlock.fenceEndLine : collapsingBlock.fenceStartLine;
  } else {
    const hiddenPrefixLength = getLeadingHiddenMarkerLength(doc.line(targetLineNumber).text);
    if (hiddenPrefixLength === 0 || column > hiddenPrefixLength) {
      return false;
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
