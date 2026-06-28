import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const CanvasControls: FC<CanvasControlsProps> = ({ onZoomIn, onZoomOut, onFitView }) => {
  const { t } = useTranslation();
  return (
    <div className="dependency-canvas-controls" role="toolbar" aria-label={t('dependency.canvas_aria')}>
      <button type="button" aria-label={t('dependency.zoom_in')} title={t('dependency.zoom_in')} onClick={onZoomIn}>
        +
      </button>
      <button type="button" aria-label={t('dependency.zoom_out')} title={t('dependency.zoom_out')} onClick={onZoomOut}>
        -
      </button>
      <button type="button" aria-label={t('dependency.fit_view')} title={t('dependency.fit_view')} onClick={onFitView}>
        {t('dependency.fit_view')}
      </button>
    </div>
  );
};
