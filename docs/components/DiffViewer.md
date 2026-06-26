# Component: DiffViewer

파일의 unified diff를 Shiki 신텍스 하이라이팅과 함께 표시하는 코드 뷰어 컴포넌트. F03_CodeViewer에서 사용한다.

---

## Props

```typescript
interface DiffViewerProps {
  diff: string;               // unified diff 텍스트 (git diff 출력 원본)
  filePath: string;           // 언어 감지용 파일 경로
  isBinary: boolean;          // 이진 파일 여부
  isDeleted: boolean;         // 삭제된 파일 여부
  isLoading: boolean;         // diff 로딩 중 여부
  error: string | null;       // 에러 메시지
}
```

---

## 렌더링 상태 분기

```
DiffViewer
├── [isLoading = true]  → LoadingState ("코드 변경이력을 불러오는 중...")
├── [error !== null]    → ErrorState + [재시도]
├── [isBinary = true]   → "Binary file — diff를 표시할 수 없습니다" 안내
├── [isDeleted = true]  → "삭제된 파일입니다" 배너 + 삭제 전 코드 표시 (Shiki)
└── [정상]              → unified diff Shiki 하이라이팅 렌더링
```

---

## Shiki 통합

- VSCode TextMate 문법 기반 하이라이팅.
- 언어 그래머는 `filePath`에서 확장자로 감지하여 동적 로드 (모든 언어를 번들에 포함하지 않음).
- diff 라인 색상:
  - `+` (추가): `var(--vscode-diffEditor-insertedTextBackground)` 배경
  - `-` (삭제): `var(--vscode-diffEditor-removedTextBackground)` 배경
  - ` ` (컨텍스트): 기본 배경

---

## States

| 상태 | 조건 | 표시 |
|------|------|------|
| `loading` | `isLoading = true` | LoadingState |
| `error` | `error !== null` | ErrorState + [재시도] |
| `binary` | `isBinary = true` | "Binary file" 안내 메시지 |
| `deleted` | `isDeleted = true` | 삭제 배너 + 코드 표시 |
| `normal` | 정상 | Shiki 하이라이팅 diff |

---

## Business Rules

- unified diff 형식 고정 (`git diff --unified`).
- 이진 파일: diff 표시 불가 메시지만 표시. 다운로드 링크 없음.
- 삭제 파일: "이 파일은 커밋에서 삭제되었습니다" 배너를 상단에 표시하고, 삭제 전 전체 내용을 코드로 표시.
- 줄 번호: 표시하지 않음 (추후 추가 검토).

---

## CSS

```css
.diff-viewer {
  overflow: auto;
  height: 100%;
  background: var(--vscode-editor-background);
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: var(--vscode-editor-font-size, 13px);
}
.diff-line-added {
  background: var(--vscode-diffEditor-insertedTextBackground);
}
.diff-line-removed {
  background: var(--vscode-diffEditor-removedTextBackground);
}
.diff-binary-notice,
.diff-deleted-notice {
  padding: 12px 16px;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}
```

---

## Accessibility

- 코드 영역: `role="region"`, `aria-label="{파일명} 코드 변경이력"`.
- 이진/삭제 안내 메시지: `role="alert"`.

---

## References

- [F03_CodeViewer spec.md](../features/F03_code_viewer/spec.md)
- [S03_CodeViewerScreen blueprint.md](../screens/S03_code_viewer/blueprint.md)
- [LoadingState.md](./LoadingState.md)
- [ErrorState.md](./ErrorState.md)
