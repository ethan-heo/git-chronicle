import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FileStatusBadge } from '../../shared/components';
import './LegendPanel.css';

interface LegendPanelProps {
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
}

export const LegendPanel: FC<LegendPanelProps> = ({
  isMinimized = false,
  onToggleMinimized,
}) => {
  const { t } = useTranslation();
  return (
    <aside
      className={[
        'dependency-legend-panel absolute right-3 bottom-3 z-[6] rounded-md border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_94%,transparent)] shadow-[0_4px_18px_rgba(0,0,0,0.34)]',
        isMinimized ? 'min-w-0 w-auto px-2 py-1.5' : 'w-[178px] p-[10px] max-sm:w-[150px]',
      ].filter(Boolean).join(' ')}
      aria-label={t('dependency.legend_aria')}
    >
      <div className={['flex items-center justify-between', isMinimized ? 'gap-1.5' : 'gap-2'].join(' ')}>
        <div className={['font-bold text-text', isMinimized ? 'text-[10px]' : 'text-[11px]'].join(' ')}>
          {t('dependency.legend_title')}
        </div>
        <button
          type="button"
          className={['inline-flex items-center justify-center rounded-full border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_88%,transparent)] text-text transition-colors hover:border-focus hover:text-text', isMinimized ? 'h-5 w-5 text-[13px]' : 'h-[22px] w-[22px] text-[14px]'].join(' ')}
          onClick={onToggleMinimized}
          aria-label={isMinimized ? t('dependency.legend_toggle_expand') : t('dependency.legend_toggle_collapse')}
          aria-expanded={!isMinimized}
        >
          {isMinimized ? '+' : '−'}
        </button>
      </div>
      {!isMinimized ? (
        <>
          <div className="mt-[10px] flex flex-col gap-1.5">
            <LegendStatus status="M" label={t('dependency.status_modified')} />
            <LegendStatus status="A" label={t('dependency.status_added')} />
            <LegendStatus status="D" label={t('dependency.status_deleted')} />
            <LegendStatus status="R" label={t('dependency.status_renamed')} />
          </div>
          <div className="my-[9px] h-px bg-line" />
          <div className="mt-[7px] flex items-center gap-2 text-[11px] text-muted">
            <span className="dependency-legend-line inline-flex h-[1.5px] w-[34px] shrink-0 bg-muted" />
            <span>import</span>
          </div>
          <div className="mt-[7px] flex items-center gap-2 text-[11px] text-muted">
            <span className="dependency-legend-line dependency-legend-line-dashed inline-flex h-[1.5px] w-[34px] shrink-0" />
            <span>require</span>
          </div>
          <div className="mt-[7px] flex items-center gap-2 text-[11px] text-muted">
            <span className="h-[18px] w-[34px] shrink-0 rounded-sm border border-dashed border-line" />
            <span>{t('dependency.empty')}</span>
          </div>
        </>
      ) : null}
    </aside>
  );
};

interface LegendStatusProps {
  status: 'M' | 'A' | 'D' | 'R';
  label: string;
}

const LegendStatus: FC<LegendStatusProps> = ({ status, label }) => (
  <div className="flex items-center gap-1.5 text-[11px] text-muted">
    <FileStatusBadge status={status} />
    <span>{label}</span>
  </div>
);
