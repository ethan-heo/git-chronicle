# Screen: S06_SettingsScreen

## Related Features

- [F06_AISettings](../../features/F06_ai_settings/spec.md)
- [F07_SavePathSettings](../../features/F07_save_path_settings/spec.md)

---

## Purpose

AI CLI 등록·활성화·비활성화와 AI 정리 결과물 저장 경로를 설정하는 화면.

---

## Entry Condition

어느 화면에서나 우측 상단 설정(⚙) 아이콘 클릭 시 진입. `previousScreen`에 현재 화면 ID 저장 후 진입.

---

## Parent Screen

어느 화면에서나 진입 가능 (어디서든 접근):

- [S01_CommitListScreen](../S01_commit_list/blueprint.md)
- [S02_HistoryViewScreen](../S02_history_view/blueprint.md)
- [S03_CodeViewerScreen](../S03_code_viewer/blueprint.md)
- [S04_AISummaryViewerScreen](../S04_ai_summary_viewer/blueprint.md)
- [S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md)

---

## Child Screens

없음

---

## Layout Structure

```
S06_SettingsScreen
├─ TopHeader ("설정")
│   └─ BackButton → previousScreen 복귀
├─ AIProviderSection (AI 등록 영역)
│   ├─ AIProviderButton [Claude]
│   │   └─ CLIInstallLink (조건부)
│   ├─ AIProviderButton [Gemini]
│   │   └─ CLIInstallLink (조건부)
│   └─ AIProviderButton [Codex]
│       └─ CLIInstallLink (조건부)
└─ SavePathSection (저장 경로 영역)
    ├─ SavePathSelector
    │   ├─ SavePathDisplay (경로 설정 시)
    │   └─ [플레이스홀더] (미설정 시)
    └─ SavePathDeleteButton (경로 설정 시)
```

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) |
| `AIProviderSection` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md) |
| `AIProviderButton` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md) |
| `CLIInstallLink` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md) |
| `SavePathSection` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md) |
| `SavePathSelector` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md) |
| `SavePathDisplay` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md) |
| `SavePathDeleteButton` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md) |
| `Toast` | [global_components](../../core/global_components.md#toast) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `default` | 항상 | 설정 폼 표시 |
| AI 등록 중 | `AIProviderButton` 로딩 | 해당 버튼 `registering` 상태 |
| AI 등록 실패 | CLI 미설치 | `CLIInstallLink` 표시 |
| 경로 미설정 | `savePath === null` | `SavePathSelector` 플레이스홀더 |
| 경로 설정됨 | `savePath !== null` | `SavePathDisplay` + `SavePathDeleteButton` |

---

## Interaction Flow

```
[⚙ 아이콘 클릭 (어느 화면에서나)]
    → previousScreen 저장
    → S06 진입
    → AI 등록 영역
        → 비활성 버튼 클릭 → CLI 버전 확인
            → 성공 → 활성화, 나머지 비활성화
            → 실패 → CLIInstallLink 표시
        → 활성 버튼 클릭 → 비활성화
    → 저장 경로 영역
        → SavePathSelector 클릭 → 디렉토리 다이얼로그
            → 경로 선택 → savePath 업데이트
        → SavePathDeleteButton 클릭 → savePath = null
    → BackButton → previousScreen 복귀
```

---

## Responsive Rules

- `AIProviderButton` 세 개는 세로 방향으로 배치
- `SavePathDisplay`는 긴 경로 말줄임표 처리 + 툴팁
