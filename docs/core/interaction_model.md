# Interaction Model

> **요약:** Hover/Click/Drag/Zoom/Debounce 등 전체에서 공통으로 쓰는 인터랙션 패턴과 전역 인터랙션 규칙(즉각 피드백, 에러 복구 등)을 정의한다. Feature별 인터랙션을 명세하기 전에 참고한다.

> GitChronicle 전체에서 공통으로 사용하는 인터랙션 패턴을 정의한다.
> 각 Feature의 blueprint.md에서 이 모델을 참조하여 Feature별 인터랙션을 명세한다.

---

## 전역 인터랙션 목록

### Hover

- **트리거:** 마우스 커서를 요소 위에 올림
- **적용 대상:** `CommitListItem`, `FileTreeNode`, `FileNode` (캔버스)
- **결과:** 호버된 요소의 배경색 변경 + 숨겨진 액션 버튼(`FileActionButtons`) 노출
- **규칙:** 호버 상태는 하나의 요소에만 적용. 이전 호버 상태는 즉시 해제.

### Click

- **트리거:** 마우스 단일 클릭 또는 키보드 Enter/Space
- **적용 대상:** `CommitListItem`, `PrimaryButton`, `BackButton`, `AIProviderButton`, `SavePathSelector`
- **결과:** 즉각적인 화면 전환 또는 액션 실행
- **규칙:** 클릭 후 UI 피드백(로딩 스피너 또는 화면 전환)이 200ms 이내에 시작되어야 한다.

### RouteTransition

- **트리거:** `currentScreen` 변경
- **적용 대상:** S01, S02, S07 전체 화면 전환
- **결과:** incoming 화면과 outgoing 화면을 200ms 동안 동시에 렌더링하고, `transitionDirection`에 따라 슬라이드 애니메이션 적용
- **규칙:** forward 전환은 새 화면이 오른쪽에서 들어오고 이전 화면이 왼쪽으로 나간다. back 전환은 새 화면이 왼쪽에서 들어오고 이전 화면이 오른쪽으로 나간다.
- **접근성:** `prefers-reduced-motion: reduce` 환경에서는 전환 animation을 제거한다.
- **부수 효과:** outgoing 슬롯은 `RouteSlotProvider isActive={false}`로 렌더링하며, 데이터 로딩 effect와 Extension 메시지 listener를 실행하지 않는다.

### DoubleClick

- **트리거:** 마우스 더블 클릭
- **적용 대상:** 현재 정의된 대상 없음 (추후 확장 가능)
- **결과:** 해당 없음

### Drag

- **트리거:** 마우스 버튼 누른 채 이동
- **적용 대상:** `DependencyGraph` 캔버스와 `FileNode`, `S02_WorkspaceScreen`의 `SidebarResizeHandle`
- **결과:** 빈 영역 드래그는 캔버스 뷰포트 이동(Pan), 노드 드래그는 노드 위치 이동, 사이드바 핸들 드래그는 폭 조절 또는 완전 접힘/재펼침
- **규칙:** 캔버스 빈 영역은 React Flow 내장 패닝을 사용한다. 노드 본문은 드래그 이동 가능하며, 노드 액션 버튼 영역은 `nodrag nopan`으로 드래그에서 제외한다. `SidebarResizeHandle`은 좌우 드래그만 허용하고, 일반 리사이즈는 `min/max` 폭 범위 안에서 유지되며 끝까지 밀었을 때만 사이드바가 완전히 접힌다. 접힌 상태에서도 6px 핸들이 남아 있어 오른쪽으로 다시 드래그해 펼칠 수 있다.

### Zoom

- **트리거:** 마우스 휠 스크롤 (캔버스 위에서)
- **적용 대상:** `DependencyGraph` 캔버스 (React Flow 내장 Zoom)
- **결과:** 캔버스 줌 인/아웃
- **규칙:** 최소 줌 0.3x, 최대 줌 2.0x. 줌 레벨은 React Flow가 자동 관리.

### Pan

- **트리거:** 마우스 드래그 (캔버스 빈 영역) 또는 스크롤 바 드래그
- **적용 대상:** `DependencyGraph` 캔버스
- **결과:** 캔버스 뷰포트 이동
- **규칙:** React Flow 내장 패닝 동작 사용.

### Scroll (Infinite)

- **트리거:** 커밋 목록의 스크롤이 하단에 도달
- **적용 대상:** `CommitList`
- **결과:** 다음 200개 커밋 추가 로드
- **규칙:** 로드 중에는 하단에 `LoadingState` (스피너) 표시. 더 이상 로드할 커밋이 없으면 "모든 커밋을 불러왔습니다" 표시.

### Retry

- **트리거:** `ErrorState` 내 [재시도] 버튼 클릭
- **적용 대상:** AI 정리 실패 시 (S02 `aiSummary` 패널)
- **결과:** 동일한 입력으로 AI 정리를 재시도
- **규칙:** 재시도 클릭 즉시 `LoadingState`로 전환.

### Debounce

- **트리거:** 텍스트 입력창에 키워드 입력
- **적용 대상:** `KeywordSearchInput` (F01)
- **결과:** 입력 후 300ms 이후 필터 실행
- **규칙:** 300ms 이내 추가 입력 시 타이머 초기화. 네트워크 요청이 아닌 git 명령어를 트리거하므로 반드시 디바운싱 적용.

### Toggle

- **트리거:** AI 프로바이더 버튼 클릭
- **적용 대상:** `AIProviderButton` (F06)
- **결과:** 비활성화 → 활성화 또는 활성화 → 비활성화
- **규칙:** 하나가 활성화되면 나머지는 자동으로 비활성화. 상호 배타적 선택.

### KeyboardShortcut

- **트리거:** modifier 조합 키 입력
- **적용 대상:** `S02_WorkspaceScreen`의 워크스페이스 탭
- **결과:** `Ctrl/Cmd+W`는 포커스된 pane의 활성 탭을 닫고, `Ctrl+Tab` / `Ctrl+Shift+Tab`은 Win/Linux에서만 같은 pane 안 다음/이전 탭 순환 전환에 사용한다.
- **규칙:** `Ctrl/Cmd+W`는 `package.json`의 `activeWebviewPanelId` when절 키바인딩으로 `gitChronicle.closeActiveTab` 커맨드로 라우팅되고, 그 커맨드가 웹뷰에 `CLOSE_ACTIVE_TAB` 메시지를 보내 처리한다. VS Code는 웹뷰의 `preventDefault()`와 무관하게 워크벤치 키바인딩(에디터 닫기 등)을 항상 호스트로 전달하기 때문에, 순수 `document` keydown 가로채기만으로는 VS Code 기본 동작을 막을 수 없다. `Ctrl+Tab` / `Ctrl+Shift+Tab` 탭 순환은 여전히 웹뷰 `document` 레벨 keydown 리스너가 `preventDefault()`로 처리한다. macOS의 `Cmd+Tab` 계열은 시스템 앱 전환과 충돌하므로 워크스페이스 단축키로 사용하지 않는다.

### ConfirmDialog

- **트리거:** 재생성 아이콘 클릭 (기존 저장본이 있는 경우)
- **적용 대상:** `RegenerateButton` (F05b)
- **결과:** "덮어쓰기 확인" 다이얼로그 표시 → 확인 시 재처리, 취소 시 현재 상태 유지
- **규칙:** 저장본이 없는 경우에는 확인 다이얼로그 없이 즉시 생성.

---

## 전역 인터랙션 규칙

1. **즉각 피드백:** 모든 클릭 액션은 200ms 이내에 시각적 피드백(로딩, 화면 전환, 상태 변경)을 제공한다.
2. **에러 복구:** 실패 상태에서 항상 [재시도] 또는 CTA 버튼을 제공하여 사용자가 막힌 상태에서 벗어날 수 있도록 한다.
3. **진행 상태 표시:** 2초 이상 걸리는 작업(AI 정리 생성, 커밋 로드)은 반드시 `LoadingState`를 표시한다.
4. **전환 중 안정성:** 화면 전환 애니메이션을 위해 outgoing 화면을 렌더링하더라도 네트워크성 요청, git 요청, AI 요청, 메시지 listener는 active 슬롯에서만 실행한다.
