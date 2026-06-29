import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SymbolFileCodeViewer } from './SymbolFileCodeViewer';

interface SymbolCodePanelProps {
  isOpen: boolean;
  filePath: string;
  fileContent: string;
  language: string;
  highlightRange: { start: number; end: number } | null;
  scrollToRange: { start: number; end: number } | null;
  scrollRequestId: number;
  onClose: () => void;
}

export const SymbolCodePanel: FC<SymbolCodePanelProps> = ({ isOpen, filePath, fileContent, language, highlightRange, scrollToRange, scrollRequestId, onClose }) => {
  const { t } = useTranslation();

  return (
    <aside className={['symbol-code-panel', isOpen ? 'symbol-code-panel-open' : 'symbol-code-panel-closed'].filter(Boolean).join(' ')} aria-hidden={!isOpen}>
      <header className="symbol-code-panel-header">
        <div className="symbol-code-panel-title">
          <div className="symbol-code-panel-file">{filePath}</div>
          <div className="symbol-code-panel-subtitle">{t('symbol_graph.code_panel_title')}</div>
        </div>
        <button className="symbol-code-panel-close" type="button" onClick={onClose} aria-label={t('symbol_graph.code_panel_close_aria')} title={t('symbol_graph.code_panel_close_aria')}>
          ×
        </button>
      </header>
      <SymbolFileCodeViewer fileContent={fileContent} language={language} highlightRange={highlightRange} scrollToRange={scrollToRange} scrollRequestId={scrollRequestId} />
    </aside>
  );
};
