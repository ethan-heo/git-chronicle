# Feature Blueprint: F07_SavePathSettings

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

저장 경로 지정을 위한 디렉토리 선택 UI와 경로 표시·삭제 UI를 제공한다.

---

## Inputs

- `savePath: string | null` — 전역 상태

---

## Outputs

- `savePath` 업데이트 (전역 상태)

---

## Components

- `SavePathSection`
- `SavePathSelector`
- `SavePathDisplay`
- `SavePathDeleteButton`

---

## Component Definitions

### Component: SavePathSection

#### Purpose
저장 경로 설정 영역 전체를 묶는 섹션. 제목, 경로 선택 UI, 경로 표시, 삭제 버튼을 포함한다.

#### Data
- `savePath: string | null`

#### Props
```typescript
interface SavePathSectionProps {
  savePath: string | null;
  onPathSelect: (path: string) => void;
  onPathDelete: () => void;
}
```

#### Interaction
없음 (하위 컴포넌트가 처리)

#### States
- `unset`: 경로 미설정
- `set`: 경로 설정됨

#### Accessibility
- `role="group"`, `aria-label="저장 경로 설정"`

#### Reusability
F07_SavePathSettings 전용. S06_SettingsScreen에서만 사용.

---

### Component: SavePathSelector

#### Purpose
디렉토리 선택 다이얼로그를 열어 저장 경로를 설정하는 버튼/클릭 영역.

#### Data
- `savePath: string | null`

#### Props
```typescript
interface SavePathSelectorProps {
  savePath: string | null;
  onPathSelect: (path: string) => void;
}
```

#### Interaction
- 클릭 시 VSCode의 `vscode.window.showOpenDialog()` 호출 → 디렉토리 선택 → `savePath` 업데이트

#### States
- `unset`: "경로를 선택하세요" 플레이스홀더 표시
- `set`: 선택된 경로 표시 (`SavePathDisplay`로 위임)

#### Accessibility
- `role="button"`, `aria-label="저장 경로 선택"`

#### Reusability
F07_SavePathSettings 전용. SavePathSection 내에서만 사용. → 상세 문서: [components/SavePathSelector.md](../../components/SavePathSelector.md)

---

### Component: SavePathDisplay

#### Purpose
설정된 저장 경로 문자열을 표시하는 읽기 전용 텍스트.

#### Data
- `path: string`

#### Interaction
없음

#### States
없음

#### Accessibility
- `aria-label="현재 저장 경로: {path}"`

---

### Component: SavePathDeleteButton

#### Purpose
설정된 저장 경로를 제거하는 삭제 버튼. 경로가 설정된 경우에만 표시.

#### Data
- `isVisible: boolean` — `savePath !== null`일 때 true

#### Interaction
- 클릭 시 `savePath = null` 업데이트 (파일은 삭제하지 않음)

#### States
- `visible`, `hidden`

#### Accessibility
- `aria-label="저장 경로 삭제"`

---

## Component Tree

```
F07_SavePathSettings
└─ SavePathSection
    ├─ SavePathSelector
    │   ├─ SavePathDisplay (경로 설정 시)
    │   └─ [플레이스홀더] (미설정 시)
    └─ SavePathDeleteButton (경로 설정 시)
```

---

## Variants

### SavePathSection
- `unset`: 경로 미설정 (플레이스홀더 + 삭제 버튼 숨김)
- `set`: 경로 설정됨 (`SavePathDisplay` + `SavePathDeleteButton` 표시)

---

## Layout Rules

```
S06_SettingsScreen
├─ TopHeader
├─ AIProviderSection (F06 담당)
└─ SavePathSection (저장 경로 영역)
    ├─ SavePathSelector
    │   ├─ SavePathDisplay (경로 설정 시)
    │   └─ [플레이스홀더 텍스트] (미설정 시)
    └─ SavePathDeleteButton (경로 설정 시)
```

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 경로 선택 | `SavePathSelector` 클릭 | 디렉토리 다이얼로그 → 경로 저장 |
| 경로 삭제 | `SavePathDeleteButton` 클릭 | `savePath = null` (파일 유지) |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `unset` | `savePath === null` | `SavePathSelector` (플레이스홀더) + 삭제 버튼 숨김 |
| `set` | `savePath !== null` | `SavePathDisplay` + `SavePathDeleteButton` 표시 |

---

## Empty States

없음

---

## Error States

- 경로 자동 생성/파일 쓰기 실패: Extension Host가 `AI_SUMMARY_ERROR`를 보내고 AI 정리 화면의 `ErrorState`에 "저장 경로를 생성할 수 없습니다. 권한을 확인하세요" 표시

---

## Loading States

없음 (디렉토리 선택 다이얼로그는 VSCode 네이티브 UI가 처리)

---

## Responsive Rules

- `SavePathDisplay`는 긴 경로 문자열을 말줄임표(`...`)로 처리하고 마우스 오버 시 전체 경로 툴팁 표시

---

## Reusable Components

- [`Toast`](../../core/global_components.md#toast)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)

---

## Current Implementation Notes

- 현재 저장 경로 UI는 별도 `features/F07` 디렉토리가 아니라 `src/webview/features/F06/SavePathSection.tsx`에 구현되어 S06 설정 화면에서 사용된다.
- `SavePathSelector`, `SavePathDisplay`, `SavePathDeleteButton`은 문서상 하위 컴포넌트 개념이며, 현재 코드는 `SavePathSection.tsx` 내부에서 함께 렌더링한다.
- Extension Host 요청 메시지는 `SET_SAVE_PATH`, `CLEAR_SAVE_PATH`이고 응답 메시지는 `SAVE_PATH_SET`, `SAVE_PATH_CLEARED`이다.
- 저장 실패는 `src/extension/summaryFileService.ts`의 `SummarySaveError`로 표준화되며, `src/extension/messageHandler.ts`에서 `AI_SUMMARY_ERROR`로 Webview에 전달된다.
- Webview 브라우저 dev fallback에서는 실제 파일 다이얼로그 대신 데모 경로를 설정한다.

---

## MCP Optimization Rules

- `SavePathSection`은 독립 Frame으로 분리 (저장 경로 영역)
- `SavePathSection`은 Variant Component로 등록 (unset/set)
- `SavePathSelector`는 재사용 Component — unset/set Variant
- `SavePathDisplay`는 독립 Component (읽기 전용 텍스트)
- `SavePathDeleteButton`은 조건부 표시 — `savePath !== null` 시에만
- Auto Layout: `SavePathSection`은 Vertical

---

## Figma Naming Rules

```
SavePathSection [unset]
└─ SavePathSelector [unset]

SavePathSection [set]
├─ SavePathSelector [set]
│   └─ SavePathDisplay
└─ SavePathDeleteButton
```
