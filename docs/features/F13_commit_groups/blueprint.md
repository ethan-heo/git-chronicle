# Feature Blueprint: F13_CommitGroups

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

커밋 목록에서 다중 선택 모드와 그룹 생성/편집/삭제 UI를 제공하고, 저장된 그룹을 커밋 목록 필터로 적용한다.

---

## Inputs

- `commitGroups: CommitGroup[]` — 현재 워크스페이스에 저장된 그룹 목록
- `filterGroupId: string | null` — F01 `FilterState`의 다섯 번째 필드(활성 그룹 필터)
- 선택 모드 진행 상태: `isSelectModeActive`, `selectedCommitHashesForGroup`, `editingGroupId`

---

## Outputs

- `commitGroups`: 그룹 생성/수정/삭제 시 갱신 (전역 상태 업데이트)
- `filterGroupId`: 그룹 필터 선택/해제 시 갱신 → 커밋 목록 재로드
- `isSelectModeActive` / `selectedCommitHashesForGroup` / `editingGroupId`: 선택 모드 진행 상태 업데이트

---

## Components

- `SelectModeToggleButton`
- `CommitSelectionActionBar`
- `CommitGroupFilterToggleButton`
- `CommitGroupFilterDropdown`
- `useCommitGroups` (훅)

> F01의 `CommitListItem`/`CommitList`는 체크박스 표시를 위한 `isSelectModeActive`/`isCheckedForGroup`/`onToggleCheckForGroup` prop을 추가로 받지만, 컴포넌트 소유권은 F01에 남는다. F13은 이 prop들을 조립 화면(`S02_WorkspaceScreen.tsx`)을 통해서만 전달하며 F01 파일을 직접 import하지 않는다.

---

## Component Definitions

### Component: SelectModeToggleButton

#### Purpose
`CommitsSection` 헤더에서 선택 모드를 켜고 끄는 아이콘 버튼이다.

#### Data
- `isActive: boolean`

#### Props
```typescript
interface SelectModeToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}
```

#### Interaction
- 클릭 시 선택 모드를 토글한다. 켜지는 순간 이전 선택/편집 상태는 초기화된다.

#### States
- `default`, `active`(체크된 배경/텍스트 강조)

#### Accessibility
- `aria-label`로 열기/닫기 상태를 제공하고 `aria-pressed`로 활성 여부를 노출한다.

#### Reusability
F13 전용. `CommitsSection` 헤더에서만 사용한다.

---

### Component: CommitSelectionActionBar

#### Purpose
선택 모드가 활성일 때 커밋 목록 상단에 표시되며, 선택된 개수와 그룹 이름 입력, 저장/취소 액션을 제공한다.

#### Data
- `selectedCount: number`
- `isEditing: boolean`
- `initialName?: string`

#### Props
```typescript
interface CommitSelectionActionBarProps {
  selectedCount: number;
  isEditing: boolean;
  initialName?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}
```

#### Interaction
- 이름 입력 후 Enter 또는 저장 버튼 클릭 시 `onSave(name)` 호출. 이름이 비어있거나 선택된 커밋이 없으면 저장 버튼이 비활성화된다.
- `isEditing`이 `true`이면 저장 버튼 라벨이 "그룹 저장", `false`이면 "새 그룹 만들기"로 전환된다.
- 취소 버튼은 선택 모드를 종료하고 선택 상태를 초기화한다.

#### States
- `creating` (`isEditing === false`), `editing` (`isEditing === true`)

#### Accessibility
- 입력창에 `aria-label` 제공, 마운트 시 자동 포커스한다.

#### Reusability
F13 전용. `CommitsSection`의 `CommitList` 상단에서만 사용한다.

---

### Component: CommitGroupFilterToggleButton

#### Purpose
`CommitsSection` 헤더에서 그룹 필터 팝오버를 열고 닫는 아이콘 버튼이다. `FilterToggleButton`(F01, 날짜/작성자/키워드)과 나란히 배치되는 별도 팝오버 트리거다.

#### Data
- `isOpen: boolean`
- `isActive: boolean` (그룹 필터가 현재 적용 중인지)

#### Props
```typescript
interface CommitGroupFilterToggleButtonProps {
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}
```

#### Interaction
- 클릭 시 그룹 필터 팝오버를 연다/닫는다.
- 그룹 필터가 활성 중이면 배지 점(dot)을 표시한다.

#### States
- `default`, `active`(팝오버가 열려 있거나 그룹 필터 적용 중)

#### Accessibility
- `aria-expanded`로 팝오버 열림 상태를 노출한다.

#### Reusability
F13 전용. `CommitsSection` 헤더에서만 사용한다.

---

### Component: CommitGroupFilterDropdown

#### Purpose
저장된 그룹 목록을 팝오버 콘텐츠로 표시하고, 그룹 선택(필터 적용)·편집 진입·삭제를 제공한다.

#### Data
- `groups: CommitGroup[]`
- `selectedGroupId: string | null`

#### Props
```typescript
interface CommitGroupFilterDropdownProps {
  groups: CommitGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onEditGroup: (group: CommitGroup) => void;
  onDeleteGroup: (id: string) => void;
}
```

#### Interaction
- 목록 최상단 "전체" 옵션 클릭 시 `onSelectGroup(null)`로 필터를 해제한다.
- 그룹 행 클릭 시 `onSelectGroup(id)`. 이미 선택된 그룹을 다시 클릭하면 해제된다.
- 각 행의 편집(연필) 아이콘은 호버 시에만 노출되며 `onEditGroup(group)`을 호출하고 팝오버를 닫는다.
- 각 행의 삭제(휴지통) 아이콘은 인라인 재클릭 확인 방식이다(첫 클릭은 확인 상태로 전환, 두 번째 클릭에서 `onDeleteGroup(id)` 호출). 포커스를 잃으면 확인 상태가 취소된다.

#### States
- `empty` (`groups.length === 0`): 안내 텍스트 표시
- `populated`: 그룹 행 목록 표시

#### Accessibility
- `role="listbox"` / 각 옵션은 `role="option"` + `aria-selected`.

#### Reusability
F13 전용. `CommitGroupFilterToggleButton`이 여는 팝오버 콘텐츠로만 사용한다.

---

## Variants

### CommitGroupFilterDropdown
- `empty`: "저장된 그룹이 없습니다" 안내
- `populated`: 그룹 행 목록, 각 행은 `default` / `hover`(편집·삭제 아이콘 노출) / `deleteConfirming` 상태를 가진다

### CommitSelectionActionBar
- `creating`: "새 그룹 만들기" 저장 라벨
- `editing`: "그룹 저장" 저장 라벨, `initialName`으로 입력값 프리필

---

## Layout Rules

- `SelectModeToggleButton`과 `CommitGroupFilterToggleButton`은 `CommitsSection` 헤더에서 기존 `SortOrderToggle` → `FilterToggleButton` 뒤에 순서대로 배치된다.
- `CommitSelectionActionBar`는 선택 모드가 활성일 때만 `CommitList` 바로 위, `SidebarSection` 콘텐츠 영역 상단에 표시된다.
- `CommitGroupFilterDropdown`은 `CommitFilterPanel`(F01) 내부가 아니라 별도 `Popover`로 분리되어 있다 — F01 컴포넌트는 그룹 관련 prop을 받지 않는다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 선택 모드 토글 | `SelectModeToggleButton` 클릭 | 모든 `CommitListItem`에 체크박스 표시/숨김, 선택 상태 초기화 |
| 커밋 체크 | `CommitListItem` 체크박스 클릭 | `selectedCommitHashesForGroup`에 추가/제거. 행 클릭(단일 선택)과 독립적으로 동작 |
| 그룹 생성 | `CommitSelectionActionBar`에서 이름 입력 후 저장 | `CREATE_COMMIT_GROUP` 전송, 선택 모드 종료 |
| 그룹 필터 적용 | `CommitGroupFilterDropdown` 행 클릭 | `filterGroupId` 갱신 → 날짜/작성자/키워드와 AND로 결합되어 커밋 목록 재로드 |
| 그룹 편집 진입 | 그룹 행 편집 아이콘 클릭 | 선택 모드 진입 + 기존 그룹 필터 해제 + 그룹의 커밋이 미리 체크된 상태로 시작 |
| 그룹 저장(편집) | `CommitSelectionActionBar`에서 저장 | `UPDATE_COMMIT_GROUP` 전송. 현재 그룹 필터가 이 그룹이었다면 필터를 재적용해 목록을 갱신 |
| 그룹 삭제 | 그룹 행 삭제 아이콘 재클릭 확인 | `DELETE_COMMIT_GROUP` 전송. 삭제 대상이 활성 필터였다면 필터 해제 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `browsing` | `isSelectModeActive === false` | 체크박스 없음, 기존 F01 커밋 목록과 동일 |
| `selecting` | `isSelectModeActive === true && editingGroupId === null` | 체크박스 표시, 액션 바 "새 그룹 만들기" |
| `editingGroup` | `isSelectModeActive === true && editingGroupId !== null` | 체크박스 표시(그룹 커밋 프리체크), 액션 바 "그룹 저장" |

---

## Empty States

- **저장된 그룹 없음:** `CommitGroupFilterDropdown` 내부에 "저장된 그룹이 없습니다" 텍스트만 표시(별도 CTA 없음)

---

## Error States

- 그룹 생성/수정/삭제 실패는 모달이나 인라인 에러 대신 `pushToast(message, 'error')` 토스트로 안내한다. 메시지 키는 `toast.commit_group_create_failed` / `toast.commit_group_update_failed` / `toast.commit_group_delete_failed`.

---

## Loading States

- 그룹 목록은 F11 `NotesSection`과 동일하게 활성화 시점(`isActive`)에 조회하며, 별도 로딩 스피너 UI는 두지 않는다(목록이 비어있으면 empty 상태로 표시).

---

## Responsive Rules

- `CommitSelectionActionBar`는 좁은 너비에서 개수 텍스트·입력창·버튼이 `flex-wrap`으로 줄바꿈된다.

---

## Reusable Components

- [`Popover`](../../core/global_components.md#popover)
- [`SidebarSection`](../../core/global_components.md#sidebarsection)
