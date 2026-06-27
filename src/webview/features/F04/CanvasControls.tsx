import type { FC } from 'react';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const CanvasControls: FC<CanvasControlsProps> = ({ onZoomIn, onZoomOut, onFitView }) => {
  return (
    <div className="dependency-canvas-controls" role="toolbar" aria-label="캔버스 제어">
      <button type="button" aria-label="확대" title="확대" onClick={onZoomIn}>
        +
      </button>
      <button type="button" aria-label="축소" title="축소" onClick={onZoomOut}>
        -
      </button>
      <button type="button" aria-label="전체 화면 맞춤" title="맞춤" onClick={onFitView}>
        맞춤
      </button>
    </div>
  );
};
