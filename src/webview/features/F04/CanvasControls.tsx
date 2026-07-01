import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const CanvasControls: FC<CanvasControlsProps> = ({ onZoomIn, onZoomOut, onFitView }) => {
  const { t } = useTranslation();
  const buttonClassName =
    'h-[30px] min-w-[34px] border-r border-line bg-transparent px-[10px] text-[12px] text-text transition-colors duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:bg-hover last:border-r-0';

  return (
    <div
      className="absolute top-3 right-3 z-[6] inline-flex overflow-hidden rounded-md border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_94%,transparent)] shadow-[0_4px_18px_rgba(0,0,0,0.34)] max-sm:right-2"
      role="toolbar"
      aria-label={t('dependency.canvas_aria')}
    >
      <button className={buttonClassName} type="button" aria-label={t('dependency.zoom_in')} title={t('dependency.zoom_in')} onClick={onZoomIn}>
        +
      </button>
      <button className={buttonClassName} type="button" aria-label={t('dependency.zoom_out')} title={t('dependency.zoom_out')} onClick={onZoomOut}>
        -
      </button>
      <button className={buttonClassName} type="button" aria-label={t('dependency.fit_view')} title={t('dependency.fit_view')} onClick={onFitView}>
        {t('dependency.fit_view')}
      </button>
    </div>
  );
};
