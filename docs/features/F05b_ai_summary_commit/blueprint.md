# Feature Blueprint: F05b_AISummaryCommit

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

커밋 전체 diff를 AI CLI로 전달하여 커밋 단위 종합 요약을 스트리밍으로 생성·표시·저장한다. 저장본이 있으면 즉시 표시하고, 재생성 아이콘 버튼 기능을 제공한다.

S02의 `code` 탭 안에서 파일 스코프 `AISummaryPanel`로도 재사용되며, 이 경우 diff/심볼 그래프와 함께 자유 분할 레이아웃 안에 배치되고 헤더의 닫기(X)로 숨길 수 있다.

---

## Inputs

- `selectedCommit: Commit` — 커밋 전체 diff 추출용 및 헤더 표시용
- `activeAIProvider: AIProviderName | null`
- `savePath: string | null`

---

## Outputs

- `currentSummaryContent: string` — 스트리밍 누적 텍스트 (전역 상태)
- 저장 파일: `{savePath}/{shortHash}_{sanitizedCommitMessage}/{커밋 정리 파일명}` (파일명 언어 분기는 [F07 저장 파일 Naming](../F07_save_path_settings/spec.md#저장-파일-naming) 참고)

---

## Components

- `AISummaryViewer`
- `SaveAsNotePopover`
- `PathAutocompleteInput`
- `HighlightedCode`
- `StreamingTextRenderer`
- `RegenerateButton`
- `TokenLimitWarning`
- `OverwriteConfirmDialog`

---

## Component Definitions

### Component: AISummaryViewer

#### Purpose
AI 정리 결과(마크다운)를 렌더링하는 주요 뷰어. 스트리밍 중에는 `StreamingTextRenderer`, 완료 후에는 react-markdown으로 전환.

#### Data
- `content: string`
- `isStreaming: boolean`
- `hasSavedVersion: boolean`

#### Props
```typescript
interface AISummaryViewerProps {
  content: string;
  error: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  hasSavedSummary: boolean;
  hasAIProvider: boolean;
  hasSavePath: boolean;
  savedPath: string | null;
  providerLabel: string | null;
  onGoToSettings: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onSave?: () => void;
  saveButtonRef?: RefObject<HTMLButtonElement | null>;
}
```

#### Interaction
- 스크롤 가능
- 수정 불가 (읽기 전용)
- 저장본이 없는 완료 상태에서는 헤더의 저장 아이콘 버튼을 누르면 해당 버튼 아래 `SaveAsNotePopover`가 열린다
- 완료된 마크다운 본문에서 드래그 선택 후 복사 시, 선택 범위에 대응하는 원본 마크다운 조각을 클립보드에 기록한다
- fenced 코드블록 위에는 hover 시 복사 버튼이 나타나며, 클릭 시 해당 코드블록의 원본 마크다운(```` 포함)을 복사하고 성공 토스트를 표시한다
- fenced 코드블록에 언어 태그가 있으면 `HighlightedCode`가 `shiki` 기반 문법 강조 결과를 `<code>` 내부 토큰 span으로 렌더링한다
- Mermaid 코드블록은 다이어그램 preview로 렌더링되며, preview 우측 상단 hover 복사 버튼 또는 preview 선택 복사 시 원본 Mermaid 마크다운 블록을 복사하고, 복사 버튼 클릭 시 성공 토스트를 표시한다

#### States
- `generating`: `StreamingTextRenderer` 표시
- `displaying`: react-markdown 렌더링
- `loading`: 저장본/설정 확인 중 AI 전용 로딩 프리뷰 표시
- `empty`: 아직 생성되지 않음

#### Accessibility
- `role="region"`, `aria-label="AI 정리 결과"`, `aria-live="polite"` (스트리밍 중)

#### Reusability
F05b_AISummaryCommit 전용.

### Component: SaveAsNotePopover

#### Purpose
AI 요약을 노트로 저장할 상대 경로를 입력받는 저장 버튼 앵커형 팝오버.

#### Data
- `entries: NoteEntry[]`
- `initialValue: string`
- `shouldWarnBeforeOverwrite: boolean`

#### Props
```typescript
interface SaveAsNotePopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  entries: NoteEntry[];
  initialValue: string;
  isOpen: boolean;
  onCancel: () => void;
  onChange: (value: string) => void;
  onConfirm: () => void;
  shouldWarnBeforeOverwrite: boolean;
}
```

#### Interaction
- 저장 버튼 바로 아래에 표시된다
- 팝오버 바깥 클릭 또는 `Escape`로 닫힌다
- 덮어쓰기 가능성이 있으면 경고 배너를 표시한다
- 경로 입력은 `PathAutocompleteInput`을 사용한다

#### Accessibility
- 공용 `Popover`의 `role="dialog"`와 `aria-labelledby`를 따른다

#### Reusability
F05b_AISummaryCommit 전용.

### Component: PathAutocompleteInput

#### Purpose
저장 경로 입력 중 입력한 키워드를 포함하는 기존 폴더 경로를 드롭다운 목록으로 보여주는 F05b 전용 콤보박스 입력 컴포넌트.

#### Data
- `value: string`
- `directorySuggestions: string[]`

#### Interaction
- 입력값이 비어있으면 목록을 표시하지 않는다. 키워드를 입력하면 대소문자 구분 없이 포함(substring)하는 폴더 경로만 입력 아래 목록으로 표시한다
- 일치한 부분 문자열은 목록에서 강조 표시된다
- `ArrowDown`/`ArrowUp`으로 목록 항목을 이동하고, `Enter` 또는 클릭으로 선택하면 해당 폴더 경로 전체가 입력값이 된다
- 활성 목록이 있을 때 `Escape`를 누르면 팝오버를 닫지 않고 목록만 숨긴다(이후 입력값이 바뀌면 다시 나타날 수 있다)
- 파일명은 자동완성하지 않고 폴더 경로만 제안한다

#### Reusability
F05b_AISummaryCommit 전용.

### Component: HighlightedCode

#### Purpose
언어 태그가 있는 fenced code block을 `shiki` 기반 토큰 색상으로 렌더링한다.

#### Data
- `cacheKey: string`
- `className?: string`
- `code: string`
- `language?: string`

#### Interaction
- 지원 언어면 비동기 하이라이트 결과를 캐시해 재사용한다
- 지원하지 않는 언어거나 하이라이트 실패 시 평문 `<code>`로 폴백한다

#### Reusability
F05b와 F11 프리뷰에서 공용 사용.

---

### Component: StreamingTextRenderer

#### Purpose
AI 스트리밍 출력을 실시간으로 타이핑 효과로 표시하는 컴포넌트.

#### Data
- `content: string` — 누적된 스트리밍 텍스트

#### Props
```typescript
interface StreamingTextRendererProps {
  content: string;
  isStreaming: boolean;
}
```

#### Interaction
없음 (표시 전용)

#### States
- `streaming`: 커서 표시 (`isStreaming === true`)
- `done`: 커서 숨김 (`isStreaming === false`)

#### Accessibility
- `aria-live="polite"` 부모로부터 상속

#### Reusability
F05b_AISummaryCommit 전용. AISummaryViewer 내에서만 사용.

---

### Component: RegenerateButton

#### Purpose
기존 저장본 덮어쓰기 재생성을 요청하는 아이콘 버튼.

#### Data
- `isVisible: boolean` — 저장본이 있을 때만 표시
- `isGenerating: boolean` — 생성 중이면 비활성화

#### Props
```typescript
interface RegenerateButtonProps {
  disabled: boolean;
  onClick: () => void;
}
```

#### Interaction
- `hasSavedSummary && content !== "" && !isGenerating`일 때 노출
- 재생성 아이콘 클릭 시 `OverwriteConfirmDialog` 표시

#### States
- `default`, `disabled` (생성 중)

#### Accessibility
- `aria-label="AI 정리 재생성"`

#### Reusability
F05b_AISummaryCommit 전용. S02_WorkspaceScreen 본문 `aiSummary` 패널에서 사용.

---

### Component: TokenLimitWarning

#### Purpose
diff 크기가 크다는 경고 배너. AI 호출은 계속 진행.

#### Data
없음

#### Props
```typescript
interface TokenLimitWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}
```

#### Interaction
- [접기] 클릭 시 현재 화면에서 경고 배너 숨김

#### Reusability
F05b_AISummaryCommit 전용. AISummaryViewer 상단 배너로 사용.

---

### Component: OverwriteConfirmDialog

#### Purpose
저장본이 있는 경우 재생성 시 덮어쓰기 확인을 요청하는 다이얼로그.

#### Data
- `onConfirm: () => void`
- `onCancel: () => void`

#### Props
```typescript
interface OverwriteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### Interaction
- [확인] 클릭: 재생성 시작
- [취소] 클릭: 다이얼로그 닫힘, 현재 저장본 유지

#### States
- `open`, `closed`

#### Accessibility
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

#### Reusability
F05b_AISummaryCommit 전용. RegenerateButton 클릭 시 표시.

---

## Variants

### AISummaryViewer
- `generating`: `StreamingTextRenderer` 표시
- `displaying.saved`: react-markdown + `RegenerateButton`
- `displaying.new`: 새로 생성 완료 상태
- `loading`: 상단 안내 문구 + 스켈레톤 프리뷰 카드
- `noAI`: AI 미설정 `EmptyState`
- `noPath`: 경로 미설정 `EmptyState`

### RegenerateButton
- `default`: 활성 상태
- `disabled`: AI 생성 중 비활성

### StreamingTextRenderer
- `streaming`: 블링킹 커서 표시
- `done`: 커서 숨김

---

## Layout Rules

- `AISummaryViewer`는 S02 본문 `aiSummary` 패널의 단일 메인 콘텐츠로 표시된다.
- `TokenLimitWarning`은 `AISummaryViewer` 상단에 배너로 표시된다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 패널 진입 | `aiSummary` 패널 활성화 | 저장본 존재 시 즉시 표시, 없으면 AI 생성 시작 |
| 저장 아이콘 | 클릭 | `SaveAsNotePopover` 표시 |
| 저장 팝오버 경로 입력 | 입력값을 포함하는 폴더가 있을 때 | 일치하는 폴더 목록이 드롭다운으로 표시됨 |
| 저장 팝오버 경로 목록 | `ArrowDown`/`ArrowUp` + `Enter` 또는 클릭 | 선택한 폴더 경로 전체로 입력값 교체 |
| 재생성 아이콘 | 클릭 | `OverwriteConfirmDialog` 표시 |
| [확인] | 다이얼로그 확인 | 동일 diff로 AI 재호출, 결과 덮어쓰기 |
| [취소] | 다이얼로그 취소 | 현재 저장본 유지 |
| [재시도] | `ErrorState` 버튼 클릭 | AI 재호출 |
| 드래그 복사 | 완료된 요약 본문에서 텍스트 선택 후 복사 | 렌더링 결과 대신 원본 마크다운 조각을 클립보드에 기록 |
| 코드블록 복사 | fenced 코드블록 hover 후 복사 버튼 클릭 | 해당 코드블록의 원본 마크다운(```` 포함)을 클립보드에 기록하고 성공 토스트를 표시 |
| Mermaid preview 복사 | Mermaid 다이어그램 preview의 복사 버튼 클릭 또는 preview 선택 후 복사 | 원본 ```` ```mermaid ```` 블록을 클립보드에 기록하고, 복사 버튼 클릭 시 성공 토스트를 표시 |
| 뒤로가기 | `BackButton` 클릭 | S-02 복귀 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `noAI` | `activeAIProvider === null` | `EmptyState` (AI 미설정) |
| `noPath` | `savePath === null` | `EmptyState` (경로 미설정) |
| `loading` | `isLoadingSummary === true` 또는 설정 로딩 중 | AI 전용 로딩 프리뷰 |
| `generating` | `isGeneratingSummary === true` | `StreamingTextRenderer` |
| `displaying.saved` | 저장본 존재 | react-markdown + `RegenerateButton` |
| `displaying.new` | 새로 생성 완료 | react-markdown + `RegenerateButton` |
| `error` | 타임아웃 또는 CLI 실패 | `ErrorState` |

---

## Empty States

- `EmptyState` (message: "AI가 설정되지 않았습니다", ctaLabel: "설정으로 이동")
- `EmptyState` (message: "저장 경로를 먼저 설정해주세요", ctaLabel: "설정으로 이동")

---

## Error States

- `ErrorState` (message: "생성에 실패했습니다", onRetry: AI 재호출)
- `ErrorState` (message: "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요")

---

## Loading States

| 상태 | 표현 방식 | 위치 |
|------|---------|------|
| AI 생성 중 | `StreamingTextRenderer [streaming]` | AISummaryViewer 내 실시간 타이핑 |
| 저장본 로드 중 | AI 전용 로딩 프리뷰 | AISummaryViewer 본문 영역 |

---

## Responsive Rules

- `AISummaryViewer`는 화면 너비에 맞게 마크다운 콘텐츠 폭 조정
- `TokenLimitWarning`은 좁은 너비에서 접기 가능

---

## Reusable Components

- [`EmptyState`](../../core/global_components.md#emptystate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)
