import { useEffect, useId, useState, type FC } from 'react';
import mermaid from 'mermaid';
import { useTranslation } from 'react-i18next';

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

export const renderedDiagramCache = new Map<string, string>();

// mermaid's parser/renderer is not reentrant; concurrent render() calls race on
// shared DOM sandbox elements, so all renders across every MermaidBlock instance
// are chained through a single queue.
let renderQueue: Promise<void> = Promise.resolve();

// CodeMirror measures a block widget's height once when it first mounts. If the
// widget starts out at a "로딩 중" placeholder height and later resizes to the
// real diagram height, CodeMirror's internal line-height cache for content
// below the widget does not reliably catch up (even after explicit
// requestMeasure() calls), which throws off vertical cursor navigation. Warming
// the cache before the widget ever mounts means it renders at its final size
// on the very first paint, so no in-place resize ever happens.
export function prewarmMermaidDiagram(cacheKey: string, code: string): Promise<void> {
  if (renderedDiagramCache.has(cacheKey)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    renderQueue = renderQueue.then(async () => {
      if (renderedDiagramCache.has(cacheKey)) {
        resolve();
        return;
      }

      try {
        const { svg } = await mermaid.render(`note-mermaid-prewarm-${cacheKey.replace(/[^a-zA-Z0-9-]/g, '-')}`, code);
        renderedDiagramCache.set(cacheKey, svg);
      } catch {
        // MermaidBlock renders the failure UI itself once mounted; nothing further to do here.
      } finally {
        resolve();
      }
    });
  });
}

export const MermaidBlock: FC<MermaidBlockProps> = ({ cacheKey, code }) => {
  const { t } = useTranslation();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(() => renderedDiagramCache.get(cacheKey) ?? null);
  const [error, setError] = useState<string | null>(null);
  const diagramId = useId().replace(/:/g, '-');

  useEffect(() => {
    // prewarmMermaidDiagram()가 이미 이 cacheKey를 렌더링해 두었다면 다시 렌더링하지 않는다.
    // 캐시된 SVG로 마운트된 뒤 디바운스 후 또 렌더링해 DOM을 교체하면, 이미 자리 잡은
    // MermaidWidget 안에서 내용이 한 번 더 바뀌는 셈이라 CodeMirror의 줄 높이 캐시가 다시
    // 어긋나면서 방향키 커서 이동이 엉뚱한 줄로 튀는 문제가 재발한다.
    if (renderedDiagramCache.has(cacheKey)) {
      return;
    }

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
        <p className="note-preview-mermaid-error-title">{t('note.mermaid_render_failed')}</p>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (!svgMarkup) {
    return (
      <div className="note-preview-mermaid-loading" role="status" aria-live="polite">
        {t('note.mermaid_rendering')}
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
