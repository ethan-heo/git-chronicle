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
- [S04_AISummaryViewerScreen](../S05_ai_summary_viewer/blueprint.md)
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

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `AIProviderSection` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md#component-aiprovidersection) | `src/webview/features/F06/AIProviderSection.tsx` |
| `AIProviderButton` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md#component-aiproviderbutton) | `src/webview/features/F06/AIProviderButton.tsx` |
| `ModelSelectorGroup` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md#component-modelselectorgroup) | `src/webview/features/F06/AIProviderButton.tsx` (내부 조건부 렌더링) |
| `CLIInstallLink` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md#component-cliinstalllink) | `src/webview/features/F06/AIProviderButton.tsx` (내부 조건부 렌더링) |
| `SavePathSection` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md#component-savepathsection) | `src/webview/features/F06/SavePathSection.tsx` |
| `SavePathSelector` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md#component-savepathselector) | `src/webview/features/F06/SavePathSection.tsx` (내부 조건부 렌더링) |
| `SavePathDisplay` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md#component-savepathdisplay) | `src/webview/features/F06/SavePathSection.tsx` (내부 조건부 렌더링) |
| `SavePathDeleteButton` | [F07 blueprint](../../features/F07_save_path_settings/blueprint.md#component-savepathdeletebutton) | `src/webview/features/F06/SavePathSection.tsx` (내부 조건부 렌더링) |
| `Toast` | [global_components](../../core/global_components.md#toast) | `src/webview/shared/components/Toast.tsx` |

> `SavePathSection`은 F07이 정의하는 4개 하위 컴포넌트 계약을 단일 파일로 구현한다. `AIProviderButton`도 `ModelSelectorGroup`/`CLIInstallLink`를 별도 파일로 분리하지 않고 내부에서 함께 렌더링한다.

---

## Screen States

AI 등록 상태는 [F06_ai_settings/blueprint.md](../../features/F06_ai_settings/blueprint.md)의, 저장 경로 상태는 [F07_save_path_settings/blueprint.md](../../features/F07_save_path_settings/blueprint.md)의 State Model이 유일한 출처다. 두 섹션은 서로 독립적으로 렌더링되며 화면 전용 조합 상태는 없다.

인터랙션 흐름은 AI 등록의 경우 F06 blueprint.md의, 저장 경로의 경우 F07 blueprint.md의 Interaction Model을 참고한다. 화면 진입/복귀 흐름은 위 Entry Condition과 Layout Structure를 참고한다.

---

## Responsive Rules

- `AIProviderButton` 세 개는 세로 방향으로 배치
- `SavePathDisplay`는 긴 경로 말줄임표 처리 + 툴팁
