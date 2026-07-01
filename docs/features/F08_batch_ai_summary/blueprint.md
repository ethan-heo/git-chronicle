# Feature Blueprint: F08_BatchAISummary

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

모든 변경 파일에 대해 F05_AISummaryFile을 순차 자동 실행하고, 전 화면에서 고정 표시되는 프로그레스 바로 진행 상황을 관리한다.

---

## Inputs

- `changedFiles: ChangedFile[]` — 전역 상태
- `activeAIProvider: AIProviderName | null`
- `savePath: string | null`

---

## Outputs

- `isBatchRunning: boolean` 업데이트
- `batchTotal`, `batchCompleted`, `batchFailedCount` 업데이트
- `changedFiles[].hasSavedSummary` 업데이트 (파일별 완료 시)
- `Toast` 알림

---

## Components

- `BatchProgressBar`
- `BatchCancelButton`

---

## Component Definitions

### Component: BatchProgressBar

#### Purpose
일괄 생성 진행 상황을 `n / 전체` 텍스트와 progress bar로 표시하는 화면 상단 고정 컴포넌트. 화면 전환과 무관하게 항상 표시.

#### Data
- `batchTotal: number`
- `batchCompleted: number`
- `isBatchRunning: boolean`
- `isBatchCancelling: boolean`

#### Props
```typescript
interface BatchProgressBarProps {
  batchTotal: number;
  batchCompleted: number;
  isBatchRunning: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}
```

#### Interaction
없음 (표시 전용. 취소는 `BatchCancelButton`이 담당)

#### States
- `running`: 진행 중 (progress bar 애니메이션)
- `cancelling`: 취소 요청됨 (현재 파일 완료 후 중단 안내, 취소 버튼 비활성)
- `hidden`: `isBatchRunning === false`

#### Accessibility
- `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={batchTotal}`, `aria-valuenow={batchCompleted}`
- `aria-label="AI 정리 일괄 생성 진행 중"`

#### Reusability
**전역 고정 컴포넌트.** 화면 최상단에 항상 마운트. 모든 Screen 위에 오버레이. `isBatchRunning`이 false이면 렌더링 스킵.

---

### Component: BatchCancelButton

#### Purpose
일괄 생성을 중단하는 [취소] 버튼. `BatchProgressBar` 내 포함.

#### Data
- `isBatchRunning: boolean`

#### Props
```typescript
interface BatchCancelButtonProps {
  onCancel: () => void;
}
```

#### Interaction
- 클릭 시 `isBatchCancelling = true` → Extension Host의 현재 배치 실행에 취소 플래그 설정, 다음 파일 처리 중단 (현재 처리 중인 파일은 완료까지 기다림)
- 취소 후 완료된 파일 수 Toast 표시

#### States
- `default`: 활성 (취소 가능)

#### Accessibility
- `aria-label="AI 정리 일괄 생성 취소"`

#### Reusability
F08_BatchAISummary 전용. BatchProgressBar 내에서만 사용.

---

## Component Tree

```
F08_BatchAISummary
└─ BatchProgressBar [전역 고정]
    ├─ ProgressBar (시각적 바)
    ├─ "{batchCompleted} / {batchTotal}" 텍스트
    └─ BatchCancelButton
```

진입점 (F08 외부):
```
S02_HistoryViewScreen
└─ CommitActionBar
    └─ PrimaryButton [전체 파일 AI 정리] ← F08 시작 트리거
```

---

## Variants

### BatchProgressBar
- `running`: 진행 중 (progress bar 애니메이션 + BatchCancelButton 표시)
- `hidden`: `isBatchRunning === false` (렌더링 스킵)

---

## Layout Rules

```
[전역 레이아웃 - 화면 상단 고정]
BatchProgressBar (isBatchRunning === true 시 표시)
├─ ProgressBar 시각적 바
├─ "{batchCompleted} / {batchTotal}" 텍스트
└─ BatchCancelButton

[S02_HistoryViewScreen 내]
CommitActionBar
└─ PrimaryButton [전체 파일 AI 정리] ← 일괄 생성 시작 진입점
```

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 일괄 생성 시작 | [전체 파일 AI 정리] 클릭 | `isBatchRunning = true`, 순차 처리 시작 |
| 파일 완료 | 개별 파일 AI 정리 완료 | `batchCompleted++`, `hasSavedSummary` 업데이트, `SavedBadge` 표시 |
| 파일 실패 | 개별 파일 AI 정리 실패 | `batchFailedCount++`, 다음 파일로 진행 |
| 파일 스킵 | `hasSavedSummary === true` | 처리 없이 `batchCompleted++` |
| 취소 | `BatchCancelButton` 클릭 | `isBatchCancelling = true`, Extension Host의 현재 배치 실행에 취소 플래그 설정, 다음 처리 중단 |
| 전체 완료 | `batchCompleted === batchTotal` | `isBatchRunning = false`, Toast 표시 |
| 취소 완료 | 취소 후 현재 파일 처리 완료 | `isBatchRunning = false`, Toast 표시 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `idle` | `isBatchRunning === false` | `BatchProgressBar` 숨김 |
| `running` | `isBatchRunning === true` | `BatchProgressBar` 표시 |
| `cancelled` | `isBatchCancelling === true` | 취소 중 (`BatchProgressBar` 유지) |

---

## Empty States

없음 (전제 조건: `changedFiles.length > 0`)

---

## Error States

- 시작 불가 (AI 미설정): `Toast` (error): "AI가 설정되지 않았습니다"
- 시작 불가 (경로 미설정): `Toast` (error): "저장 경로를 먼저 설정해주세요"
- 완료 후 실패 있음: `Toast` (warning): "완료되었습니다. 실패 N개"

---

## Loading States

| 상태 | 표현 방식 | 위치 |
|------|---------|------|
| 일괄 생성 진행 중 | `BatchProgressBar [running]` | 화면 최상단 고정 |
| 개별 파일 처리 중 | `BatchProgressBar` progress 값 실시간 업데이트 | 동일 |

---

## Responsive Rules

- `BatchProgressBar`는 화면 너비에 맞게 전체 폭으로 표시
- 좁은 너비에서 `"{batchCompleted} / {batchTotal}"` 텍스트와 `BatchCancelButton`은 한 줄에 유지

---

## Reusable Components

- [`Toast`](../../core/global_components.md#toast)
- [`SavedBadge`](../../core/global_components.md#savedbadge)

---

## MCP Optimization Rules

- `BatchProgressBar`는 전역 Frame — 모든 Screen 레이아웃 최상단에 배치
- `BatchProgressBar`는 Variant Component로 등록 (running/hidden)
- `BatchCancelButton`은 BatchProgressBar 내부 Component
- position: sticky/fixed — 화면 스크롤 시에도 항상 상단 고정
- Auto Layout: BatchProgressBar는 Horizontal (ProgressBar + 텍스트 + 취소 버튼)

---

## Figma Naming Rules

```
BatchProgressBar [running]
├─ ProgressBar
├─ "{n} / {total}" 텍스트
└─ BatchCancelButton

BatchProgressBar [hidden]
```
