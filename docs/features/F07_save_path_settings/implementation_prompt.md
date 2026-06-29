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
| `src/extension/aiProviderService.ts` | `savePath` 영속성 (`setSavePath`, `loadAISettingsState`) |
| `src/extension/messageHandler.ts` | 경로 선택 다이얼로그 및 `SET_SAVE_PATH` / `CLEAR_SAVE_PATH` 메시지 처리 |
| `src/webview/features/F06/SavePathSection.tsx` | 저장 경로 설정 섹션 |
| `src/webview/features/F06/S06_SettingsScreen.tsx` | S06 화면에 SavePathSection 추가 |
| `src/extension/summaryFileService.ts` | 저장 디렉토리 자동 생성 및 `SummarySaveError` 처리 |

---

## TypeScript Interfaces

```typescript
interface SavePathSectionProps {
  savePath: string | null;
  onPathSelect: () => void;
  onPathDelete: () => void;
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

### `src/extension/messageHandler.ts` + `src/extension/aiProviderService.ts`

```typescript
async function handleSetSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const result = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: 'AI 정리 저장 폴더 선택',
    openLabel: '이 폴더에 저장',
  });

  const selectedPath = result?.[0]?.fsPath;
  if (!selectedPath) return;

  const state = await setSavePath(context, selectedPath);
  panel.webview.postMessage({ type: 'SAVE_PATH_SET', payload: state });
}

async function handleClearSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = await setSavePath(context, null);
  panel.webview.postMessage({ type: 'SAVE_PATH_CLEARED', payload: state });
}

export async function setSavePath(context: vscode.ExtensionContext, savePath: string | null): Promise<AISettingsState> {
  await context.workspaceState.update('gitChronicle.savePath', savePath ?? undefined);
  return loadAISettingsState(context);
}
```

### 메시지 핸들러

```typescript
case 'SET_SAVE_PATH': {
  await handleSetSavePath(panel, context);
  break;
}

case 'CLEAR_SAVE_PATH': {
  await handleClearSavePath(panel, context);
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
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  const tail = parts.at(-1) ?? path;
  const head = path.slice(0, Math.max(0, path.length - tail.length));

  return (
    <span className="save-path-display" aria-label={`현재 저장 경로: ${path}`}>
      <span className="save-path-display-head">{head}</span>
      <span className="save-path-display-tail">{tail}</span>
    </span>
  );
};
```

### `SavePathSection.tsx`

```tsx
export const SavePathSection: React.FC<SavePathSectionProps> = ({
  savePath, onPathSelect, onPathDelete
}) => (
  <section className="save-path-section" role="group" aria-label="저장 경로 설정">
    <div className="settings-section-heading">
      <h2>저장 경로</h2>
      <p>AI 정리 결과(.md)가 저장될 로컬 폴더입니다.</p>
    </div>
    <SavePathSelector savePath={savePath} onClick={onPathSelect} />
    {savePath ? <SavePathDeleteButton onClick={onPathDelete} /> : null}
  </section>
);
```

### `SavePathDeleteButton.tsx`

```tsx
export const SavePathDeleteButton: React.FC<SavePathDeleteButtonProps> = ({ onClick }) => (
  <button
    className="save-path-delete-btn"
    onClick={onClick}
    aria-label="저장 경로 삭제 (기존 파일은 삭제되지 않음)"
    title="경로 설정 삭제 (저장된 파일은 유지)"
  >
    ×
  </button>
);
```

### Webview 상태 연동

```typescript
// S06_SettingsScreen.tsx
const handleSelectPath = () => postMessage('SET_SAVE_PATH');

const handleDeletePath = () => postMessage('CLEAR_SAVE_PATH');

// Extension Host 응답 처리
case 'SAVE_PATH_SET':
case 'SAVE_PATH_CLEARED': {
  setAISummarySettings({
    savePath: data.payload.savePath,
    registeredProviders: data.payload.registeredProviders,
    activeAIProvider: data.payload.activeAIProvider,
  });
  break;
}
```

---

## Business Rules

1. 경로 선택은 항상 VSCode 다이얼로그 사용 (Webview에서 직접 파일시스템 접근 불가)
2. 브라우저 dev fallback에서는 실제 파일 다이얼로그 대신 데모 경로를 설정
3. 선택 다이얼로그 취소 시 기존 경로 유지 (아무 변화 없음)
4. 삭제 후 즉시 `unset` 상태 전환 (확인 다이얼로그 없음)
5. 경로 자체는 설정 시점에 디렉토리를 자동 생성하지 않음 (F05/F05b/F08 저장 시점에서 처리)
6. 경로 설정 후 `hasSavedSummary` 재계산은 다음 S02 진입 시 수행
7. 저장 디렉토리 생성 또는 파일 쓰기 실패 시 `SummarySaveError`를 `AI_SUMMARY_ERROR`로 전달하고 "저장 경로를 생성할 수 없습니다. 권한을 확인하세요"를 표시
8. `savePath`는 `ExtensionContext.workspaceState`에 저장되어 프로젝트마다 분리된다

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
