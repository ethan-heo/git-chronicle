import type { FC } from 'react';

interface SavePathSectionProps {
  savePath: string | null;
  onPathSelect: () => void;
  onPathDelete: () => void;
}

export const SavePathSection: FC<SavePathSectionProps> = ({ savePath, onPathSelect, onPathDelete }) => {
  const hasPath = Boolean(savePath);
  const displayPath = savePath ? splitDisplayPath(savePath) : null;

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
          <button
            className="save-path-display-button"
            type="button"
            aria-label={`저장 경로: ${savePath}. 클릭하여 변경`}
            title={savePath ?? undefined}
            onClick={onPathSelect}
          >
            <FolderIcon />
            <span className="save-path-display" aria-label={`현재 저장 경로: ${savePath}`}>
              <span className="save-path-display-head">{displayPath?.head}</span>
              <span className="save-path-display-tail">{displayPath?.tail}</span>
            </span>
            <span className="save-path-change-label">변경</span>
          </button>
          <button
            className="save-path-delete-button"
            type="button"
            aria-label="저장 경로 삭제 (기존 파일은 삭제되지 않음)"
            title="경로 설정 삭제 (저장된 파일은 유지)"
            onClick={onPathDelete}
          >
            <TrashIcon />
          </button>
          <p className="save-path-helper save-path-helper-set">
            <CheckIcon />
            <span>
              커밋 단위 정리는 <code>_commit_summary.md</code>로 저장됩니다.
            </span>
          </p>
        </div>
      ) : (
        <button className="save-path-selector save-path-selector-unset" type="button" aria-label="저장 경로 선택" onClick={onPathSelect}>
          <FolderIcon />
          <span>경로를 선택하세요</span>
          <span className="save-path-empty-label">미설정</span>
          <span className="save-path-helper">폴더를 지정하면 AI 정리 시 결과 파일이 이 위치에 자동 저장됩니다.</span>
        </button>
      )}
    </section>
  );
};

function splitDisplayPath(path: string): { head: string; tail: string } {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  const tail = parts.at(-1) ?? path;
  const head = path.slice(0, Math.max(0, path.length - tail.length));

  return {
    head,
    tail,
  };
}

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

const CheckIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 8.4 6.3 11.5 13 4.5" />
  </svg>
);
