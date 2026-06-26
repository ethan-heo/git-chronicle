# Screen: S03_CodeViewerScreen

## Related Features

- [F03_CodeViewer](../../features/F03_code_viewer/spec.md)

---

## Purpose

선택된 파일의 Git diff를 unified diff 형식 + Shiki 신텍스 하이라이팅으로 표시하는 읽기 전용 뷰어 화면.

---

## Entry Condition

다음 화면에서 [코드 보기] 버튼 클릭 시 진입. `selectedFile` 전역 상태 설정 후 진입.

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md) — 파일 트리 노드 호버 → [코드 보기]
- [S05_DependencyCanvasScreen](../S05_dependency_canvas/blueprint.md) — 캔버스 노드 호버 → [코드 보기]

---

## Parent Screen

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md) (주 진입 경로)
- [S05_DependencyCanvasScreen](../S05_dependency_canvas/blueprint.md) (보조 진입 경로)

---

## Child Screens

없음

---

## Layout Structure

```
S03_CodeViewerScreen
├─ TopHeader ({커밋 메시지} > {파일 경로})
│   ├─ BackButton → 이전 화면 복귀
│   └─ SettingsIcon (⚙) → S06
└─ DiffViewer (스크롤 영역)
    ├─ DeletedFileNotice (조건부, 삭제된 파일)
    └─ DiffLine × N
       OR BinaryFileNotice
```

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) |
| `DiffViewer` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) |
| `DiffLine` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) |
| `BinaryFileNotice` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) |
| `DeletedFileNotice` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | diff 로드 중 | `LoadingState` |
| `binary` | 이진 파일 | `BinaryFileNotice` |
| `deleted` | 삭제된 파일 | `DeletedFileNotice` + 삭제 전 코드 |
| `populated` | 일반 diff | `DiffViewer` |
| `error` | 로드 실패 | `ErrorState` |

---

## Interaction Flow

```
[S02 또는 S05에서 [코드 보기] 클릭]
    → selectedFile 설정
    → diff 로드
    → DiffViewer 표시 (또는 BinaryFileNotice / DeletedFileNotice)
    → BackButton → 이전 화면 복귀
    → ⚙ → S06
```

---

## Responsive Rules

- `DiffViewer`는 가로 스크롤 지원 (긴 라인 잘림 방지)
- 라인 번호 컬럼은 좁은 너비에서 숨기기 가능
