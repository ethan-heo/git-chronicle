import type { FC } from 'react';
import { SymbolFileCodeViewer } from './SymbolFileCodeViewer';

interface SymbolCodePanelProps {
  isOpen: boolean;
  filePath: string;
  fileContent: string;
  language: string;
  highlightRange: { start: number; end: number } | null;
  scrollToRange: { start: number; end: number } | null;
  onClose: () => void;
}

export const SymbolCodePanel: FC<SymbolCodePanelProps> = ({ isOpen, filePath, fileContent, language, highlightRange, scrollToRange, onClose }) => {
  return (
    <aside className={['symbol-code-panel', isOpen ? 'symbol-code-panel-open' : 'symbol-code-panel-closed'].filter(Boolean).join(' ')} aria-hidden={!isOpen}>
      <header className="symbol-code-panel-header">
        <div className="symbol-code-panel-title">
          <div className="symbol-code-panel-file">{filePath}</div>
          <div className="symbol-code-panel-subtitle">코드 보기</div>
        </div>
        <button className="symbol-code-panel-close" type="button" onClick={onClose} aria-label="코드 숨기기" title="코드 숨기기">
          ×
        </button>
      </header>
      <SymbolFileCodeViewer fileContent={fileContent} language={language} highlightRange={highlightRange} scrollToRange={scrollToRange} />
    </aside>
  );
};
