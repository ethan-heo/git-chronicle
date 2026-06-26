# Implementation Prompt: F07_SavePathSettings

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **디렉토리 선택**: Extension Host에서 `vscode.window.showOpenDialog({ canSelectFolders: true })`
- **디렉토리 생성**: 실제 폴더는 F05/F05b/F08에서 `fs.mkdirSync`로 자동 생성

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/savePathService.ts` | 경로 선택 다이얼로그 및 영속성 |
| `src/webview/features/F07/SavePathSection.tsx` | 저장 경로 설정 섹션 |
| `src/webview/features/F07/SavePathSelector.tsx` | 클릭 가능 경로 선택 영역 |
| `src/webview/features/F07/SavePathDisplay.tsx` | 경로 텍스트 표시 |
| `src/webview/features/F07/SavePathDeleteButton.tsx` | 경로 삭제 버튼 |
| `src/webview/screens/S06_SettingsScreen.tsx` | S06 화면에 SavePathSection 추가 |

---

## TypeScript Interfaces

```typescript
interface SavePathSectionProps {
  savePath: string | null;
  onSelectPath: () => void;
  onDeletePath: () => void;
}

interface SavePathSelectorProps {
  savePath: string | null;
  onClick: () => void;
}

interface SavePathDisplayProps {
  path: string;   // 전체 경로
}

interface SavePathDeleteButtonProps {
  onClick: () => void;
}
```

---

## Extension Host Implementation

### `src/extension/savePathService.ts`

```typescript
export async function selectSavePath(): Promise<string | undefined> {
  const result = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: 'AI 정리 저장 폴더 선택',
    openLabel: '이 폴더에 저장',
  });
  return result?.[0]?.fsPath;
}

export function persistSavePath(
  context: vscode.ExtensionContext,
  savePath: string | null
): void {
  context.globalState.update('savePath', savePath);
}

export function loadSavePath(context: vscode.ExtensionContext): string | null {
  return context.globalState.get('savePath', null);
}
```

### 메시지 핸들러

```typescript
case 'selectSavePath': {
  const selectedPath = await selectSavePath();
  if (selectedPath) {
    persistSavePath(context, selectedPath);
    panel.webview.postMessage({ command: 'savePathUpdated', savePath: selectedPath });
  }
  break;
}

case 'deleteSavePath': {
  persistSavePath(context, null);
  panel.webview.postMessage({ command: 'savePathUpdated', savePath: null });
  break;
}
```

---

## Webview Implementation

### `SavePathSelector.tsx`

```tsx
export const SavePathSelector: React.FC<SavePathSelectorProps> = ({ savePath, onClick }) => (
  <button
    className={`save-path-selector ${savePath ? 'save-path-selector--set' : 'save-path-selector--unset'}`}
    onClick={onClick}
    aria-label={savePath ? `저장 경로: ${savePath}. 클릭하여 변경` : '저장 경로 선택'}
  >
    {savePath
      ? <SavePathDisplay path={savePath} />
      : <span className="save-path-placeholder">경로를 선택하세요</span>
    }
  </button>
);
```

### `SavePathDisplay.tsx`

```tsx
export const SavePathDisplay: React.FC<SavePathDisplayProps> = ({ path }) => {
  // 긴 경로는 마지막 2개 세그먼트만 표시
  const parts = path.split('/');
  const displayPath = parts.length > 2
    ? `/.../${parts.slice(-2).join('/')}`
    : path;

  return (
    <span className="save-path-display" title={path}>
      {displayPath}
    </span>
  );
};
```

### `SavePathSection.tsx`

```tsx
export const SavePathSection: React.FC<SavePathSectionProps> = ({
  savePath, onSelectPath, onDeletePath
}) => (
  <section className="save-path-section">
    <h3 className="section-title">저장 경로</h3>
    <div className="save-path-row">
      <SavePathSelector savePath={savePath} onClick={onSelectPath} />
      {savePath && <SavePathDeleteButton onClick={onDeletePath} />}
    </div>
  </section>
);
```

### `SavePathDeleteButton.tsx`

```tsx
export const SavePathDeleteButton: React.FC<SavePathDeleteButtonProps> = ({ onClick }) => (
  <button
    className="save-path-delete-btn"
    onClick={onClick}
    aria-label="저장 경로 삭제"
    title="경로 삭제"
  >
    ×
  </button>
);
```

### Webview 상태 연동

```typescript
// S06_SettingsScreen.tsx
const handleSelectPath = () => {
  window.vscode.postMessage({ command: 'selectSavePath' });
};

const handleDeletePath = () => {
  window.vscode.postMessage({ command: 'deleteSavePath' });
};

// Extension Host 응답 처리
case 'savePathUpdated': {
  setSavePath(data.savePath);  // Zustand 전역 상태 업데이트
  break;
}
```

---

## Business Rules

1. 경로 선택은 항상 VSCode 다이얼로그 사용 (Webview에서 직접 파일시스템 접근 불가)
2. 선택 다이얼로그 취소 시 기존 경로 유지 (아무 변화 없음)
3. 삭제 후 즉시 `unset` 상태 전환 (확인 다이얼로그 없음)
4. 경로 자체는 저장 시점에 디렉토리를 자동 생성하지 않음 (F05/F08에서 처리)
5. 경로 설정 후 `hasSavedSummary` 재계산은 다음 S02 진입 시 수행

---

## CSS Variables to Use

```css
.save-path-selector {
  width: 100%;
  padding: 8px;
  border: 1px dashed var(--vscode-panel-border);
  border-radius: 3px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  cursor: pointer;
  text-align: left;
}
.save-path-selector--set {
  border-style: solid;
}
.save-path-placeholder {
  color: var(--vscode-input-placeholderForeground);
}
.save-path-display {
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.save-path-delete-btn {
  color: var(--vscode-descriptionForeground);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
}
```

---

## References

- [F07 spec.md](./spec.md)
- [F07 blueprint.md](./blueprint.md)
- [F06 implementation_prompt.md](../F06_ai_settings/implementation_prompt.md)
- [project/architecture.md](../../project/architecture.md)
- [project/state_management.md](../../project/state_management.md)
- [core/state_model.md](../../core/state_model.md)
