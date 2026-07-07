interface PositionLike {
  start?: { offset?: number | null };
  end?: { offset?: number | null };
}

interface HastNodeLike {
  type: string;
  value?: string;
  position?: PositionLike;
  children?: HastNodeLike[];
  properties?: Record<string, unknown>;
  tagName?: string;
}

const BLOCK_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'blockquote']);
const TABLE_STRUCTURE_TAGS = new Set(['table', 'thead', 'tbody', 'tr']);

function getOffsets(position?: PositionLike): { start: number; end: number } | null {
  const start = position?.start?.offset;
  const end = position?.end?.offset;

  if (typeof start !== 'number' || typeof end !== 'number' || end < start) {
    return null;
  }

  return { start, end };
}

function resolveTextOffsets(content: string, child: HastNodeLike, parent: HastNodeLike | undefined): { start: number; end: number } | null {
  const directOffsets = getOffsets(child.position);

  if (directOffsets) {
    return directOffsets;
  }

  if (typeof child.value !== 'string' || child.value.length === 0 || !parent) {
    return null;
  }

  const parentOffsets = getOffsets(parent.position);

  if (!parentOffsets) {
    return null;
  }

  const parentRaw = content.slice(parentOffsets.start, parentOffsets.end);
  const localIndex = parentRaw.indexOf(child.value);

  if (localIndex < 0) {
    return null;
  }

  return {
    start: parentOffsets.start + localIndex,
    end: parentOffsets.start + localIndex + child.value.length,
  };
}

function isFencedCodeTextNode(parent: HastNodeLike | undefined): boolean {
  return parent?.tagName === 'code' && parent.position != null;
}

function annotateNode(content: string, node: HastNodeLike | undefined): void {
  if (!node) {
    return;
  }

  if (node.type === 'element' && node.tagName && BLOCK_TAGS.has(node.tagName)) {
    const offsets = getOffsets(node.position);

    if (offsets) {
      node.properties = {
        ...node.properties,
        'data-md-block-start': String(offsets.start),
        'data-md-block-end': String(offsets.end),
      };
    }
  }

  const children = node.children;

  if (!children || children.length === 0) {
    return;
  }

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (!child) {
      continue;
    }

    if (child.type === 'text') {
      if (node.tagName && TABLE_STRUCTURE_TAGS.has(node.tagName) && child.value?.trim() === '') {
        continue;
      }

      if (isFencedCodeTextNode(node) && !child.position) {
        continue;
      }

      const offsets = resolveTextOffsets(content, child, node);

      if (!offsets) {
        continue;
      }

      children[index] = {
        type: 'element',
        tagName: 'span',
        properties: {
          'data-md-start': String(offsets.start),
          'data-md-end': String(offsets.end),
        },
        children: [child],
      };
      continue;
    }

    annotateNode(content, child);
  }
}

export function rehypeAnnotateSourceOffsets(content: string) {
  return (tree: HastNodeLike): void => {
    annotateNode(content, tree);
  };
}
