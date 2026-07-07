import { useEffect, useId, useState, type FC } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  suppressErrorRendering: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1f6feb',
    primaryTextColor: '#d4d4d4',
    primaryBorderColor: '#3794ff',
    lineColor: '#8c8c8c',
    secondaryColor: '#252526',
    tertiaryColor: '#2a2a2b',
    background: '#1e1e1e',
    mainBkg: '#252526',
    secondBkg: '#2a2a2b',
    tertiaryBkg: '#1e1e1e',
    clusterBkg: '#252526',
    clusterBorder: '#3794ff',
    fontFamily: 'var(--gae-font-family-base)',
    fontSize: '13px',
    textColor: '#d4d4d4',
  },
});

interface MermaidBlockProps {
  cacheKey: string;
  code: string;
}

const RENDER_DEBOUNCE_MS = 300;

const renderedDiagramCache = new Map<string, string>();

// mermaid's parser/renderer is not reentrant; concurrent render() calls race on
// shared DOM sandbox elements, so all renders across every MermaidBlock instance
// are chained through a single queue.
let renderQueue: Promise<void> = Promise.resolve();

export const MermaidBlock: FC<MermaidBlockProps> = ({ cacheKey, code }) => {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(() => renderedDiagramCache.get(cacheKey) ?? null);
  const [error, setError] = useState<string | null>(null);
  const diagramId = useId().replace(/:/g, '-');

  useEffect(() => {
    let isDisposed = false;

    const renderDiagram = async (): Promise<void> => {
      try {
        const { svg } = await mermaid.render(`note-mermaid-${diagramId}`, code);
        if (isDisposed) {
          return;
        }

        renderedDiagramCache.set(cacheKey, svg);
        setSvgMarkup(svg);
        setError(null);
      } catch (renderError) {
        if (isDisposed) {
          return;
        }

        const fallbackSvg = renderedDiagramCache.get(cacheKey) ?? null;
        setSvgMarkup(fallbackSvg);
        setError(renderError instanceof Error ? renderError.message : 'Mermaid diagram could not be rendered.');
      }
    };

    const timer = window.setTimeout(() => {
      renderQueue = renderQueue.then(renderDiagram);
    }, RENDER_DEBOUNCE_MS);

    return () => {
      isDisposed = true;
      window.clearTimeout(timer);
    };
  }, [cacheKey, code, diagramId]);

  if (error) {
    return (
      <div className="note-preview-mermaid-error" role="alert">
        <p className="note-preview-mermaid-error-title">Mermaid 렌더링에 실패했습니다.</p>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (!svgMarkup) {
    return (
      <div className="note-preview-mermaid-loading" role="status" aria-live="polite">
        Mermaid 다이어그램을 렌더링하는 중...
      </div>
    );
  }

  return (
    <div
      className="note-preview-mermaid"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};
