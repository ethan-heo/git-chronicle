import type { FC } from 'react';

interface SavePathSectionProps {
  savePath: string | null;
  onPathSelect: () => void;
  onPathDelete: () => void;
}

export const SavePathSection: FC<SavePathSectionProps> = ({ savePath, onPathSelect, onPathDelete }) => {
  const hasPath = Boolean(savePath);

  return (
    <section className="save-path-section" role="group" aria-label="저장 경로 설정">
      <div className="settings-section-heading">
        <div>
          <h2>저장 경로</h2>
          <p>AI 정리 결과(.md)가 저장될 로컬 폴더입니다.</p>
        </div>
      </div>
      {hasPath ? (
        <div className="save-path-selector save-path-selector-set">
          <button className="save-path-display-button" type="button" aria-label="저장 경로 선택" onClick={onPathSelect}>
            <FolderIcon />
            <span className="save-path-display" aria-label={`현재 저장 경로: ${savePath}`} title={savePath ?? undefined}>
              {savePath}
            </span>
            <span className="save-path-change-label">변경</span>
          </button>
          <button className="save-path-delete-button" type="button" aria-label="저장 경로 삭제" title="저장 경로 삭제" onClick={onPathDelete}>
            <TrashIcon />
          </button>
        </div>
      ) : (
        <button className="save-path-selector save-path-selector-unset" type="button" aria-label="저장 경로 선택" onClick={onPathSelect}>
          <FolderIcon />
          <span>저장 폴더 선택...</span>
          <span className="save-path-empty-label">미설정</span>
        </button>
      )}
    </section>
  );
};

const FolderIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2 4.5C2 3.7 2.6 3 3.4 3h2.8l1.3 1.6h5.1c.8 0 1.4.7 1.4 1.5v6c0 .8-.6 1.5-1.4 1.5H3.4C2.6 13.6 2 13 2 12.1V4.5Z" />
  </svg>
);

const TrashIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5" />
  </svg>
);
