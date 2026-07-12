import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
import { MermaidBlock } from './MermaidBlock';

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
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
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
  }, [highlightedBlocks, onOpenUrl]);

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
      const mermaidReplaceTo = block.closingFenceFrom ?? block.contentTo;
      pending.push({
        from: block.contentFrom,
        to: mermaidReplaceTo,
        decoration: Decoration.replace({
          block: true,
          widget: new MermaidWidget(block.key, block.lines.join('\n')),
        }),
      });
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
    if (activeLines.has(lineNumber) || codeLineNumbers.has(lineNumber)) {
      continue;
    }

    const line = doc.line(lineNumber);
    decorateLine(pending, line.from, line.text);
  }

  pending
    .sort((left, right) => (left.from === right.from ? left.to - right.to : left.from - right.from))
    .forEach((entry) => {
      builder.add(entry.from, entry.to, entry.decoration);
    });

  return builder.finish();
}

function decorateLine(pending: PendingDecoration[], lineFrom: number, text: string): void {
  if (!text) {
    return;
  }

  const hrMatch = text.match(/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/);
  if (hrMatch) {
    pending.push({ from: lineFrom, to: lineFrom + text.length, decoration: Decoration.replace({ block: true, widget: new HorizontalRuleWidget() }) });
    return;
  }

  const headingMatch = text.match(/^(\s{0,3}#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const markerLength = headingMatch[1].length + 1;
    pending.push({ from: lineFrom, to: lineFrom + markerLength, decoration: hiddenSyntaxDecoration });
    const level = headingMatch[1].trim().length;
    pending.push({ from: lineFrom + markerLength, to: lineFrom + text.length, decoration: Decoration.mark({ class: `cm-md-heading cm-md-heading-${level}` }) });
    decorateInline(pending, lineFrom + markerLength, headingMatch[2]);
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

const hiddenSyntaxDecoration = Decoration.mark({ class: 'cm-md-hidden-syntax' });

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

  toDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'cm-md-mermaid-widget';
    element.contentEditable = 'false';
    const root = createRoot(element);
    root.render(<MermaidBlock cacheKey={`cm-mermaid-${this.cacheKey}`} code={this.code} />);
    (element as HTMLElement & { __reactRoot?: Root }).__reactRoot = root;
    return element;
  }

  destroy(dom: HTMLElement): void {
    const root = (dom as HTMLElement & { __reactRoot?: Root }).__reactRoot;
    if (!root) {
      return;
    }

    queueMicrotask(() => {
      root.unmount();
    });
  }
}
