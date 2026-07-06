import { ReactFlowProvider } from '@xyflow/react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DependencyGraph } from '../../src/webview/features/F04/DependencyGraph';
import type { ChangedFile } from '../../src/webview/types/commit';

class ResizeObserverMock {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

describe('DependencyGraph rendering', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    if (originalResizeObserver) {
      vi.stubGlobal('ResizeObserver', originalResizeObserver);
      return;
    }

    vi.unstubAllGlobals();
  });

  it('keeps a full-height canvas container so React Flow can mount inside the workspace panel', () => {
    const files: ChangedFile[] = [{ path: 'src/App.tsx', status: 'M' }];

    render(
      <div style={{ height: '480px' }}>
        <ReactFlowProvider>
          <DependencyGraph
            files={files}
            dependencyEdges={[]}
            isLoading={false}
            error={null}
            onRetry={() => undefined}
            onFileCodeView={() => undefined}
          />
        </ReactFlowProvider>
      </div>,
    );

    const graphRegion = screen.getByLabelText('dependency.graph_aria');
    expect(graphRegion).toHaveClass('h-full');
    expect(document.querySelector('.react-flow')).not.toBeNull();
  });
});
