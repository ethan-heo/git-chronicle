import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SymbolFileCodeViewer } from './SymbolFileCodeViewer';
import './SymbolCodePanel.css';

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
    <aside
      className={[
        'symbol-code-panel flex min-h-0 min-w-0 flex-col overflow-hidden bg-transparent',
        isOpen ? 'symbol-code-panel-open opacity-100 pointer-events-auto' : 'symbol-code-panel-closed opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      <header className="flex items-center justify-between gap-md border-b border-line bg-panel px-[18px] py-[14px]">
        <div className="min-w-0">
          <div className="overflow-hidden text-sm font-bold whitespace-nowrap text-ellipsis">{filePath}</div>
          <div className="mt-1.5 text-xs text-muted">{t('symbol_graph.code_panel_title')}</div>
        </div>
        <button className="rounded-sm bg-transparent px-1.5 py-0.5 text-[20px] leading-none text-muted transition-colors hover:bg-hover hover:text-text" type="button" onClick={onClose} aria-label={t('symbol_graph.code_panel_close_aria')} title={t('symbol_graph.code_panel_close_aria')}>
          ×
        </button>
      </header>
      <div className="min-h-0 flex-1 bg-transparent">
        <SymbolFileCodeViewer filePath={filePath} fileContent={fileContent} language={language} highlightRange={highlightRange} scrollToRange={scrollToRange} scrollRequestId={scrollRequestId} />
      </div>
    </aside>
  );
};
