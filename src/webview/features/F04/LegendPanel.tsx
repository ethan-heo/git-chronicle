import type { FC } from 'react';

export const LegendPanel: FC = () => {
  return (
    <aside className="dependency-legend-panel" aria-label="그래프 범례">
      <div className="dependency-legend-title">범례</div>
      <div className="dependency-legend-list">
        <LegendStatus status="M" label="수정됨" className="file-status-badge-m" />
        <LegendStatus status="A" label="추가됨" className="file-status-badge-a" />
        <LegendStatus status="D" label="삭제됨" className="file-status-badge-d" />
        <LegendStatus status="R" label="이름 변경됨" className="file-status-badge-r" />
      </div>
      <div className="dependency-legend-divider" />
      <div className="dependency-legend-edge-row">
        <span className="dependency-legend-line" />
        <span>import 의존</span>
      </div>
      <div className="dependency-legend-edge-row">
        <span className="dependency-legend-line dependency-legend-line-dashed" />
        <span>require 의존</span>
      </div>
      <div className="dependency-legend-edge-row">
        <span className="dependency-legend-node-sample" />
        <span>분석 불가</span>
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
