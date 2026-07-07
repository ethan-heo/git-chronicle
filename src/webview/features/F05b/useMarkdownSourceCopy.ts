import { useEffect, type RefObject } from 'react';

const SOURCE_OFFSET_SELECTOR = 'span[data-md-start][data-md-end]';
const BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, pre, blockquote, th, td, .ai-summary-mermaid-block';

function isNodeWithinContainer(container: HTMLElement, node: Node): boolean {
  return container === node || container.contains(node);
}

function parseOffset(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRenderedTextOffsetWithinSpan(span: HTMLSpanElement, node: Node, offset: number): number | null {
  const range = span.ownerDocument.createRange();
  range.selectNodeContents(span);

  try {
    range.setEnd(node, offset);
  } catch {
    return null;
  }

  return range.toString().length;
}

function findClosestCopyBlock(container: HTMLElement, node: Node): HTMLElement | null {
  const element = node instanceof HTMLElement ? node : node.parentElement;

  if (!element) {
    return null;
  }

  const block = element.closest<HTMLElement>(BLOCK_SELECTOR);
  return block && container.contains(block) ? block : null;
}

function getBlockEdgeOffset(block: HTMLElement, boundary: 'start' | 'end'): number | null {
  const blockOffset = parseOffset(boundary === 'start' ? block.dataset.mdBlockStart : block.dataset.mdBlockEnd);

  if (blockOffset !== null) {
    return blockOffset;
  }

  const spans = Array.from(block.querySelectorAll<HTMLSpanElement>(SOURCE_OFFSET_SELECTOR));

  if (spans.length === 0) {
    return null;
  }

  const span = boundary === 'start' ? spans[0] : spans[spans.length - 1];
  return parseOffset(boundary === 'start' ? span.dataset.mdStart : span.dataset.mdEnd);
}

function isAtBlockBoundary(block: HTMLElement, node: Node, offset: number, boundary: 'start' | 'end'): boolean {
  const range = block.ownerDocument.createRange();
  range.selectNodeContents(block);

  try {
    if (boundary === 'start') {
      range.setEnd(node, offset);
      return range.toString().length === 0;
    }

    range.setStart(node, offset);
    return range.toString().length === 0;
  } catch {
    return false;
  }
}

function resolveBoundaryOffset(span: HTMLSpanElement, node: Node, offset: number, boundary: 'start' | 'end'): number | null {
  const sourceStart = parseOffset(span.dataset.mdStart);
  const sourceEnd = parseOffset(span.dataset.mdEnd);

  if (sourceStart === null || sourceEnd === null || sourceEnd < sourceStart) {
    return null;
  }

  const fallback = boundary === 'start' ? sourceStart : sourceEnd;

  if (!isNodeWithinContainer(span, node)) {
    return fallback;
  }

  const renderedOffset = getRenderedTextOffsetWithinSpan(span, node, offset);

  if (renderedOffset === null) {
    return fallback;
  }

  return Math.min(sourceStart + renderedOffset, sourceEnd);
}

export function getMarkdownSliceFromSelection(container: HTMLElement, content: string, selection: Selection | null): string | null {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!isNodeWithinContainer(container, range.startContainer) || !isNodeWithinContainer(container, range.endContainer)) {
    return null;
  }

  const startBlock = findClosestCopyBlock(container, range.startContainer);
  const endBlock = findClosestCopyBlock(container, range.endContainer);
  const spans = Array.from(container.querySelectorAll<HTMLSpanElement>(SOURCE_OFFSET_SELECTOR)).filter((span) => range.intersectsNode(span));

  if (spans.length === 0) {
    const wholeBlockStart = startBlock ? getBlockEdgeOffset(startBlock, 'start') : null;
    const wholeBlockEnd = endBlock ? getBlockEdgeOffset(endBlock, 'end') : null;

    if (wholeBlockStart === null || wholeBlockEnd === null || wholeBlockEnd < wholeBlockStart) {
      return null;
    }

    return content.slice(wholeBlockStart, wholeBlockEnd);
  }

  const blockStart = startBlock && isAtBlockBoundary(startBlock, range.startContainer, range.startOffset, 'start')
    ? getBlockEdgeOffset(startBlock, 'start')
    : null;
  const blockEnd = endBlock && isAtBlockBoundary(endBlock, range.endContainer, range.endOffset, 'end')
    ? getBlockEdgeOffset(endBlock, 'end')
    : null;

  const start = blockStart ?? resolveBoundaryOffset(spans[0], range.startContainer, range.startOffset, 'start');
  const end = blockEnd ?? resolveBoundaryOffset(spans[spans.length - 1], range.endContainer, range.endOffset, 'end');

  if (start === null || end === null || end < start) {
    return null;
  }

  return content.slice(start, end);
}

export function writeMarkdownSelectionToClipboardData(clipboardData: DataTransfer, slice: string): void {
  clipboardData.setData('text/plain', slice);
  clipboardData.setData('text/markdown', slice);
  clipboardData.setData('text', slice);
}

export function useMarkdownSourceCopy(containerRef: RefObject<HTMLElement | null>, content: string): void {
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !content) {
      return;
    }

    const handleCopy = (event: ClipboardEvent): void => {
      const slice = getMarkdownSliceFromSelection(container, content, window.getSelection());

      if (!slice || !event.clipboardData) {
        return;
      }

      event.preventDefault();
      writeMarkdownSelectionToClipboardData(event.clipboardData, slice);
    };

    document.addEventListener('copy', handleCopy, true);
    return () => {
      document.removeEventListener('copy', handleCopy, true);
    };
  }, [content, containerRef]);
}
