# Component: DiffViewer

파일의 unified diff를 Shiki 신텍스 하이라이팅과 함께 표시하는 코드 뷰어 컴포넌트. F03_CodeViewer에서 사용한다. 현재 구현은 파일 전체를 표시하고, 첫 변경 라인으로 자동 스크롤한다.

---

## Props

```typescript
interface DiffViewerProps {
  diffLines: DiffLineData[];  // parseDiff + Shiki token 적용 결과
  filePath: string;           // aria-label 및 언어 감지 기준
  isLoading: boolean;         // diff 로딩 중 여부
  error: string | null;       // 에러 메시지
  isBinaryFile: boolean;      // 이진 파일 여부
  isDeletedFile: boolean;     // 삭제된 파일 여부
  onRetry: () => void;        // 실패 시 재시도
}
```

---

## 렌더링 상태 분기

```
DiffViewer
├── [isLoading = true]  → LoadingState ("코드 변경이력을 불러오는 중...")
├── [error !== null]    → ErrorState + [재시도]
├── [isBinaryFile = true]   → "Binary file — diff를 표시할 수 없습니다" 안내
├── [isDeletedFile = true]  → "삭제된 파일입니다" 배너 + 삭제 전 코드 표시 (Shiki)
└── [정상]              → unified diff Shiki 하이라이팅 렌더링
```

---

## Shiki 통합

- VSCode TextMate 문법 기반 하이라이팅.
- `S03_CodeViewerScreen`에서 `highlightDiff.ts`를 lazy import한다.
- `highlightDiff.ts`는 Shiki fine-grained bundle을 사용해 지원 언어만 포함한다.
- 언어는 `filePath` 확장자로 감지한다. 미지원 확장자는 `text`로 fallback한다.
- diff 라인 색상:
  - `+` (추가): `var(--gae-color-diff-added)` 배경
  - `-` (삭제): `var(--gae-color-diff-removed)` 배경
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

- unified diff 형식 고정 (`git show --unified=99999`).
- 이진 파일: diff 표시 불가 메시지만 표시. 다운로드 링크 없음.
- 삭제 파일: "삭제된 파일입니다" 배너를 상단에 표시하고, 삭제 전 내용을 diff 라인으로 표시.
- 줄 번호: old/new 두 컬럼을 표시한다. 좁은 너비에서는 숨길 수 있다.
- Shiki 하이라이팅 실패 시 plain text 토큰으로 fallback한다.
- diff 로드가 완료되면 첫 번째 추가/삭제 라인으로 스크롤한다.

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
  background: var(--gae-color-diff-added);
}
.diff-line-removed {
  background: var(--gae-color-diff-removed);
}
.diff-line {
  display: grid;
  grid-template-columns: 48px 48px 18px minmax(0, 1fr);
  white-space: pre;
}
.diff-deleted-notice {
  padding: 12px 16px;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}
.diff-viewer-state {
  display: flex;
  align-items: center;
  justify-content: center;
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
