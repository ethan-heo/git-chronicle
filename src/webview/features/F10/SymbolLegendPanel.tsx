import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
}

export const SymbolLegendPanel: FC<Props> = ({ isMinimized = false, onToggleMinimized }) => {
  const { t } = useTranslation();

  return (
    <aside className={['symbol-legend-panel', isMinimized ? 'symbol-legend-panel-minimized' : ''].filter(Boolean).join(' ')} aria-label={t('symbol_graph.legend_aria')}>
      <div className="symbol-legend-header">
        <div className="symbol-legend-title">{t('symbol_graph.legend_title')}</div>
        <button
          type="button"
          className="symbol-legend-toggle"
          onClick={onToggleMinimized}
          aria-label={isMinimized ? t('symbol_graph.legend_toggle_expand') : t('symbol_graph.legend_toggle_collapse')}
          aria-expanded={!isMinimized}
        >
          {isMinimized ? '+' : '−'}
        </button>
      </div>
      {!isMinimized && (
        <>
          <div className="symbol-legend-section-title">{t('symbol_graph.legend_label_title')}</div>
          <div className="symbol-legend-row">
            <span className="symbol-kind-badge symbol-kind-badge-function">fn</span>
            <span>{t('symbol_graph.legend_label_kind')}</span>
          </div>
          <div className="symbol-legend-row">
            <span className="symbol-legend-swatch symbol-legend-swatch-name">name</span>
            <span>{t('symbol_graph.legend_label_name')}</span>
          </div>
          <div className="symbol-legend-row">
            <span className="symbol-legend-swatch symbol-legend-swatch-range">L12–28</span>
            <span>{t('symbol_graph.legend_label_range')}</span>
          </div>
          <div className="symbol-legend-row">
            <span className="symbol-legend-export">export</span>
            <span>{t('symbol_graph.legend_label_export')}</span>
          </div>
          <div className="symbol-legend-divider" />
          <div className="symbol-legend-section-title">{t('symbol_graph.legend_section_kind')}</div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-function">fn</span><span>{t('symbol_graph.kind_function')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-class">cls</span><span>{t('symbol_graph.kind_class')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-interface">ifc</span><span>{t('symbol_graph.kind_interface')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-type">typ</span><span>{t('symbol_graph.kind_type')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-variable">var</span><span>{t('symbol_graph.kind_variable')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-constant">cst</span><span>{t('symbol_graph.kind_constant')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-enum">enm</span><span>{t('symbol_graph.kind_enum')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-import">imp</span><span>{t('symbol_graph.legend.kind.import')}</span></div>
          <div className="symbol-legend-divider" />
          <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-calls" /><span>{t('symbol_graph.edge_calls')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-uses" /><span>{t('symbol_graph.edge_uses')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-extends" /><span>{t('symbol_graph.edge_extends')}</span></div>
          <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-implements" /><span>{t('symbol_graph.edge_implements')}</span></div>
        </>
      )}
    </aside>
  );
};
