# Component: CommitListItem

커밋 목록에서 개별 커밋 정보(해시·메시지·작성자·날짜)를 하나의 행으로 표시하는 컴포넌트. F01_CommitLog 전용.
S01 목록이 재진입될 때도 이 항목들은 기존 목록과 함께 다시 렌더링되며, 상위 `CommitList`가 저장한 스크롤 위치를 복원한다.

---

## Props

```typescript
interface CommitListItemProps {
  commit: Commit;
  onClick: (commit: Commit) => void;
}

interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;    // ISO 8601
}
```

---

## States

| 상태 | 조건 | 시각 표현 |
|------|------|---------|
| `default` | 기본 | 일반 배경 |
| `hover` | 마우스 오버 | `var(--vscode-list-hoverBackground)` |

---

## Implementation

```tsx
export const CommitListItem: React.FC<CommitListItemProps> = ({ commit, onClick }) => {
  const formattedDate = new Date(commit.date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  return (
    <div
      className="commit-list-item"
      role="listitem"
      tabIndex={0}
      aria-label={`${commit.message} - ${commit.author} - ${formattedDate}`}
      onClick={() => onClick(commit)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(commit); }}
    >
      <span className="commit-hash">{commit.shortHash}</span>
      <span className="commit-message">{commit.message}</span>
      <span className="commit-meta">
        <span className="commit-author">{commit.author}</span>
        <span className="commit-date">{formattedDate}</span>
      </span>
    </div>
  );
};
```

---

## CSS

```css
.commit-list-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-bottom: 1px solid var(--vscode-panel-border);
}
.commit-list-item:hover {
  background: var(--vscode-list-hoverBackground);
}
.commit-hash {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  min-width: 56px;
  flex-shrink: 0;
}
.commit-message {
  flex: 1;
  font-size: 13px;
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.commit-meta {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}
```

---

## References

- [F01 blueprint.md](../features/F01_commit_log/blueprint.md)
- [F01 implementation_prompt.md](../features/F01_commit_log/implementation_prompt.md)
