# Naming Rules

> 모든 화면, 기능, 컴포넌트 이름은 이 규칙을 따른다. 규칙 외의 이름은 사용하지 않는다.

---

## Screen Naming

**패턴:** `S##_ScreenNameScreen`

| Screen ID | 이름 |
|-----------|------|
| S01 | S01_CommitListScreen |
| S02 | S02_WorkspaceScreen |
| S06 | S06_SettingsScreen |
| S07 | S07_NoteScreen |

> S03, S04, S05, S08은 현재 독립 화면으로 사용하지 않는다. S03/S04/S05/S08 콘텐츠는 S02_WorkspaceScreen 본문 패널로 통합되었다.

- 번호는 2자리 zero-padding (`S01`, `S02`, ...).
- 이름은 PascalCase, 반드시 `Screen` 접미사로 끝낸다.
- Figma 프레임 이름과 코드 컴포넌트 이름을 동일하게 유지한다.

---

## Feature Naming

**패턴:** `F##_FeatureName`

| Feature ID | 이름 |
|------------|------|
| F01 | F01_CommitLog |
| F02 | F02_ChangedFileTree |
| F03 | F03_CodeViewer |
| F04 | F04_DependencyCanvas |
| F05b | F05b_AISummaryCommit |
| F06 | F06_AISettings |
| F07 | F07_SavePathSettings |
| F09 | F09_AISummaryQA |
| F10 | F10_IntraFileSymbolDependencyCanvas |
| F11 | F11_NoteEditor |

- 번호는 2자리 zero-padding (`F01`, `F02`, ...).
- 알파벳 suffix는 소문자로 붙인다 (`F05b`).
- 이름은 PascalCase, Feature의 핵심 동작을 명사형으로 표현한다.

---

## Component Naming

**패턴:** `PascalCase`

### 예시

```
CommitListItem
CommitFilterPanel
DateRangeFilter
AuthorDropdown
KeywordSearchInput
FileTreeNode
FileStatusBadge
FileActionButtons
DependencyGraph
FileNode
DependencyEdge
LegendPanel
CanvasControls
AISummaryViewer
StreamingTextRenderer
RegenerateButton
AIProviderButton
SavePathSelector
```

---

## 금지 이름 목록

아래 이름은 Figma, 코드, 문서 어디에서도 사용하지 않는다.

| 금지 | 대체 방법 |
|------|-----------|
| `Frame 1` | 화면 목적을 나타내는 이름 사용 (`CommitListScreen`) |
| `Group 1` | 그룹의 역할을 나타내는 이름 사용 (`FilterSection`) |
| `Container` | 포함된 콘텐츠로 이름 표현 (`CommitListItem`) |
| `Wrapper` | 포함된 콘텐츠로 이름 표현 (`AISummaryViewer`) |
| `Box` | 포함된 콘텐츠로 이름 표현 (`StatusBadge`) |
| `Area` | 포함된 콘텐츠로 이름 표현 (`FilterPanel`) |
| `Div` | 의미 있는 이름 사용 |
| `Section` (단독) | 접두사 추가 (`FilterSection`, `ActionSection`) |
| `Inner`, `Outer` | 계층 구조로 표현 |

---

## 디렉토리 Naming

**패턴:** `snake_case`

```
docs/
  features/
    F01_commit_log/
    F02_changed_file_tree/
    F04_dependency_canvas/
  screens/
    S01_commit_list/
    S04_dependency_canvas/
```

- Feature/Screen ID는 대문자, 이름 부분은 소문자 snake_case.
- 파일명은 `spec.md`, `blueprint.md`로 고정.

---

## 저장 파일 Naming

AI 정리 결과물의 저장 디렉토리/파일 이름 패턴, sanitize 규칙, 하위 호환 경로는 [F07_save_path_settings/spec.md](../features/F07_save_path_settings/spec.md)의 "저장 파일 Naming" 섹션이 유일한 출처다.
