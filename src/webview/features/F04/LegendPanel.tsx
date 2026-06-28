import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const LegendPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <aside className="dependency-legend-panel" aria-label={t('dependency.legend_aria')}>
      <div className="dependency-legend-title">{t('dependency.legend_aria')}</div>
      <div className="dependency-legend-list">
        <LegendStatus status="M" label={t('dependency.status_modified')} className="file-status-badge-m" />
        <LegendStatus status="A" label={t('dependency.status_added')} className="file-status-badge-a" />
        <LegendStatus status="D" label={t('dependency.status_deleted')} className="file-status-badge-d" />
        <LegendStatus status="R" label={t('dependency.status_renamed')} className="file-status-badge-r" />
      </div>
      <div className="dependency-legend-divider" />
      <div className="dependency-legend-edge-row">
        <span className="dependency-legend-line" />
        <span>import</span>
      </div>
      <div className="dependency-legend-edge-row">
        <span className="dependency-legend-line dependency-legend-line-dashed" />
        <span>require</span>
      </div>
      <div className="dependency-legend-edge-row">
        <span className="dependency-legend-node-sample" />
        <span>{t('dependency.empty')}</span>
      </div>
    </aside>
  );
};

interface LegendStatusProps {
  status: string;
  label: string;
  className: string;
}

const LegendStatus: FC<LegendStatusProps> = ({ status, label, className }) => (
  <div className="dependency-legend-status">
    <span className={`file-status-badge ${className}`}>{status}</span>
    <span>{label}</span>
  </div>
);
