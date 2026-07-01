import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SymbolKindBadge } from './SymbolKindBadge';
import './SymbolLegendPanel.css';

interface Props {
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
}

export const SymbolLegendPanel: FC<Props> = ({ isMinimized = false, onToggleMinimized }) => {
  const { t } = useTranslation();

  return (
    <aside
      className={[
        'symbol-legend-panel absolute right-3 bottom-3 z-[6] rounded-md border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_94%,transparent)] shadow-[0_4px_18px_rgba(0,0,0,0.34)]',
        isMinimized ? 'min-w-0 w-auto px-2 py-1.5' : 'w-[220px] p-[10px] max-sm:w-[min(220px,calc(100vw-16px))]',
      ].filter(Boolean).join(' ')}
      aria-label={t('symbol_graph.legend_aria')}
    >
      <div className={['flex items-center justify-between', isMinimized ? 'gap-1.5' : 'gap-2'].join(' ')}>
        <div className={['font-bold text-text', isMinimized ? 'text-[10px]' : 'text-[11px]'].join(' ')}>{t('symbol_graph.legend_title')}</div>
        <button
          type="button"
          className={['inline-flex items-center justify-center rounded-full border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_88%,transparent)] text-text transition-colors hover:border-[var(--gae-color-symbol-highlight)] hover:text-[var(--gae-color-symbol-highlight)]', isMinimized ? 'h-5 w-5 text-[13px]' : 'h-[22px] w-[22px] text-[14px]'].join(' ')}
          onClick={onToggleMinimized}
          aria-label={isMinimized ? t('symbol_graph.legend_toggle_expand') : t('symbol_graph.legend_toggle_collapse')}
          aria-expanded={!isMinimized}
        >
          {isMinimized ? '+' : '−'}
        </button>
      </div>
      {!isMinimized && (
        <>
          <div className="mt-[10px] mb-1.5 text-[10px] font-semibold tracking-[0.02em] text-muted uppercase">{t('symbol_graph.legend_label_title')}</div>
          <LegendRow badge={<SymbolKindBadge kind="function" />} label={t('symbol_graph.legend_label_kind')} />
          <LegendRow badge={<span className="inline-flex h-5 min-w-[56px] items-center justify-center rounded-full border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_85%,transparent)] px-2 font-mono text-[10px] text-text">name</span>} label={t('symbol_graph.legend_label_name')} />
          <LegendRow badge={<span className="inline-flex h-5 min-w-[56px] items-center justify-center rounded-full border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_85%,transparent)] px-2 font-mono text-[10px] text-text">L12-28</span>} label={t('symbol_graph.legend_label_range')} />
          <LegendRow badge={<span className="inline-flex h-5 min-w-[56px] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--gae-color-symbol-highlight)_18%,transparent)] px-2 text-[10px] font-bold text-[var(--gae-color-symbol-highlight)] uppercase">export</span>} label={t('symbol_graph.legend_label_export')} />
          <div className="my-[9px] h-px bg-line" />
          <div className="mt-[10px] mb-1.5 text-[10px] font-semibold tracking-[0.02em] text-muted uppercase">{t('symbol_graph.legend_section_kind')}</div>
          <LegendRow badge={<SymbolKindBadge kind="function" />} label={t('symbol_graph.kind_function')} />
          <LegendRow badge={<SymbolKindBadge kind="class" />} label={t('symbol_graph.kind_class')} />
          <LegendRow badge={<SymbolKindBadge kind="interface" />} label={t('symbol_graph.kind_interface')} />
          <LegendRow badge={<SymbolKindBadge kind="type" />} label={t('symbol_graph.kind_type')} />
          <LegendRow badge={<SymbolKindBadge kind="variable" />} label={t('symbol_graph.kind_variable')} />
          <LegendRow badge={<SymbolKindBadge kind="constant" />} label={t('symbol_graph.kind_constant')} />
          <LegendRow badge={<SymbolKindBadge kind="enum" />} label={t('symbol_graph.kind_enum')} />
          <LegendRow badge={<SymbolKindBadge kind="import" />} label={t('symbol_graph.legend.kind.import')} />
          <div className="my-[9px] h-px bg-line" />
          <LegendRow badge={<span className="symbol-edge-sample symbol-edge-sample-calls" />} label={t('symbol_graph.edge_calls')} />
          <LegendRow badge={<span className="symbol-edge-sample symbol-edge-sample-uses" />} label={t('symbol_graph.edge_uses')} />
          <LegendRow badge={<span className="symbol-edge-sample symbol-edge-sample-extends" />} label={t('symbol_graph.edge_extends')} />
          <LegendRow badge={<span className="symbol-edge-sample symbol-edge-sample-implements" />} label={t('symbol_graph.edge_implements')} />
        </>
      )}
    </aside>
  );
};

const LegendRow: FC<{ badge: ReactNode; label: string }> = ({ badge, label }) => (
  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
    {badge}
    <span>{label}</span>
  </div>
);
