import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FileStatusBadge } from '../../shared/components';
import './LegendPanel.css';

export const LegendPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <aside
      className="dependency-legend-panel absolute right-3 bottom-3 z-[6] w-[178px] rounded-md border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_94%,transparent)] p-[10px] shadow-[0_4px_18px_rgba(0,0,0,0.34)] max-sm:w-[150px]"
      aria-label={t('dependency.legend_aria')}
    >
      <div className="mb-2 text-[11px] font-bold text-text">{t('dependency.legend_aria')}</div>
      <div className="flex flex-col gap-1.5">
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
