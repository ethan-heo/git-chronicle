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

const BLOCK_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'pre', 'blockquote', 'th', 'td']);

function getOffsets(position?: PositionLike): { start: number; end: number } | null {
  const start = position?.start?.offset;
  const end = position?.end?.offset;

  if (typeof start !== 'number' || typeof end !== 'number' || end < start) {
    return null;
  }

  return { start, end };
}

function annotateNode(node: HastNodeLike | undefined): void {
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
      const offsets = getOffsets(child.position);

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

    annotateNode(child);
  }
}

export function rehypeAnnotateSourceOffsets() {
  return (tree: HastNodeLike): void => {
    annotateNode(tree);
  };
}
