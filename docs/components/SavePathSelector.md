# Component: SavePathSelector

S06_SettingsScreen의 저장 경로 설정 패널에서 AI 정리 결과물 저장 경로를 선택·표시·삭제하는 컴포넌트.

---

## Props

```typescript
interface SavePathSelectorProps {
  savePath: string | null;          // 현재 설정된 저장 경로. null이면 미설정
  onSelectPath: () => void;         // [경로 선택] 버튼 클릭 → 디렉토리 다이얼로그 열기
  onClearPath: () => void;          // [삭제] 버튼 클릭 → 경로 초기화
}
```

---

## 렌더링 구조

```
SavePathSelector
├── [savePath = null]  (미설정 상태)
│   ├── "저장 경로가 설정되지 않았습니다" 안내 텍스트
│   └── [경로 선택] PrimaryButton
└── [savePath 설정됨]
    ├── 경로 텍스트 (전체 경로 표시, overflow 시 tooltip)
    ├── [변경] Button
    └── [삭제] Button (경고 색상)
```

---

## States

| 상태 | 조건 | 표시 |
|------|------|------|
| `unset` | `savePath = null` | 안내 문구 + [경로 선택] |
| `set` | `savePath` 존재 | 경로 텍스트 + [변경] + [삭제] |

---

## Business Rules

- [경로 선택] 또는 [변경] 클릭: Extension Host에 `SET_SAVE_PATH` 메시지 전송 → `vscode.window.showOpenDialog({ canSelectFolders: true })` 실행 → 선택된 경로를 `SAVE_PATH_SET` 메시지로 수신.
- [삭제] 클릭: Extension Host에 `CLEAR_SAVE_PATH` 메시지 전송 → `savePath = null` 설정. **기존 파일은 삭제하지 않는다.**
- 경로가 너무 길면 `title` 속성으로 전체 경로를 툴팁으로 제공한다.
- 저장 경로가 미설정 상태에서 AI 정리 시도 시: "저장 경로를 먼저 설정해주세요" 토스트 + 설정 화면(S06) 자동 진입.
- 경로 자동 생성: Extension Host에서 `fs.mkdirSync({ recursive: true })`로 경로가 없으면 자동 생성.

---

## CSS

```css
.save-path-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
}
.save-path-display {
  font-size: 12px;
  font-family: var(--vscode-editor-font-family, monospace);
  color: var(--vscode-editor-foreground);
  word-break: break-all;
  padding: 6px 8px;
  background: var(--vscode-input-background);
  border-radius: 3px;
}
.save-path-actions {
  display: flex;
  gap: 6px;
}
.save-path-clear-btn {
  color: var(--vscode-errorForeground);
  border-color: var(--vscode-errorForeground);
}
```

---

## Accessibility

- 경로 표시 영역: `title="{전체 경로}"` 툴팁으로 잘린 경로 확인 가능.
- [경로 선택] 버튼: `aria-label="저장 경로 선택"`.
- [변경] 버튼: `aria-label="저장 경로 변경"`.
- [삭제] 버튼: `aria-label="저장 경로 초기화 (기존 파일은 삭제되지 않음)"`.

---

## References

- [F07_SavePathSettings spec.md](../features/F07_save_path_settings/spec.md)
- [S06_SettingsScreen blueprint.md](../screens/S06_settings/blueprint.md)
- [PrimaryButton.md](./PrimaryButton.md)
- [Toast.md](./Toast.md)
