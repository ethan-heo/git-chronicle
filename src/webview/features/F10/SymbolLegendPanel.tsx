import type { FC } from 'react';

export const SymbolLegendPanel: FC = () => (
  <aside className="symbol-legend-panel" aria-label="노드 그래프 범례">
    <div className="symbol-legend-title">노드 범례</div>
    <div className="symbol-legend-section-title">노드 라벨 의미</div>
    <div className="symbol-legend-row">
      <span className="symbol-kind-badge symbol-kind-badge-function">fn</span>
      <span>노드 종류</span>
    </div>
    <div className="symbol-legend-row">
      <span className="symbol-legend-swatch symbol-legend-swatch-name">name</span>
      <span>노드 이름</span>
    </div>
    <div className="symbol-legend-row">
      <span className="symbol-legend-swatch symbol-legend-swatch-range">L12–28</span>
      <span>라인 범위</span>
    </div>
    <div className="symbol-legend-row">
      <span className="symbol-legend-export">export</span>
      <span>외부에 공개된 노드</span>
    </div>
    <div className="symbol-legend-divider" />
    <div className="symbol-legend-section-title">노드 종류</div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-function">fn</span><span>function</span></div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-class">cls</span><span>class</span></div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-interface">ifc</span><span>interface</span></div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-type">typ</span><span>type</span></div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-variable">var</span><span>variable</span></div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-constant">cst</span><span>constant</span></div>
    <div className="symbol-legend-row"><span className="symbol-kind-badge symbol-kind-badge-enum">enm</span><span>enum</span></div>
    <div className="symbol-legend-divider" />
    <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-calls" /><span>calls</span></div>
    <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-uses" /><span>uses</span></div>
    <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-extends" /><span>extends</span></div>
    <div className="symbol-legend-row"><span className="symbol-edge-sample symbol-edge-sample-implements" /><span>implements</span></div>
  </aside>
);
