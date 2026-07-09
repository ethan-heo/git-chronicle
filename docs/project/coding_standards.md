# Coding Standards — GitChronicle

> **요약:** TypeScript/React 네이밍, 컴포넌트·상태 관리 규칙, 에러 처리 원칙, 커밋 메시지(Conventional Commits) 규칙을 정의한다. 새 컴포넌트/함수를 작성하거나 커밋 메시지를 쓰기 전에 참고한다.

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## 언어 & 타입

### TypeScript 규칙

- `strict: true` 설정 필수. `any` 타입 사용 금지.
- 함수 반환 타입은 반드시 명시한다. 단, 자명한 경우 (`() => void`) 생략 가능.
- `interface`와 `type`은 다음 기준으로 구분한다:
  - 객체 형태 정의: `interface` 사용.
  - Union / Intersection / 조건부 타입: `type` 사용.
- Enum 대신 `as const` 객체 또는 유니온 리터럴 타입을 사용한다.

```typescript
// 올바른 예
type ScreenID = 'S02' | 'S06' | 'S07';
type FileStatus = 'A' | 'M' | 'D' | 'R';

// 금지
enum ScreenID { S02 = 'S02', ... }
```

---

## 컴포넌트 작성 규칙

### 파일 구조 (단일 파일 컴포넌트)

```typescript
// 1. imports
import React from 'react';
import { useAppStore } from '../../store/appStore';

// 2. 타입 정의
interface MyComponentProps {
  value: string;
  onChange: (v: string) => void;
}

// 3. 컴포넌트 (화살표 함수)
export const MyComponent: React.FC<MyComponentProps> = ({ value, onChange }) => {
  // 훅 → 이벤트 핸들러 → 렌더 순서
  return <div>{value}</div>;
};
```

### 네이밍

- 컴포넌트: PascalCase (`CommitFilterPanel`, `FileTreeNode`)
- 훅: `use` 접두사 + PascalCase (`useCommitLog`, `useAISummaryFile`)
- 유틸 함수: camelCase (`formatDate`, `sanitizeFileName`)
- 상수: UPPER_SNAKE_CASE (`DEBOUNCE_DELAY_MS`, `INITIAL_COMMIT_COUNT`)
- CSS 클래스: kebab-case (`commit-list-item`, `file-tree-node`)

### 스타일 작성 규칙

- Webview 스타일 엔트리 파일은 `src/webview/global.css`다. `main.tsx`에서 한 번만 import한다.
- 스타일 구현의 기본값은 Tailwind CSS v4 유틸리티 클래스다. 일반 레이아웃, 색상, 여백, 타이포그래피는 TSX `className`에서 직접 표현한다.
- `global.css`에는 다음만 둔다:
  - `@import 'tailwindcss';`
  - `@theme inline` 기반 VSCode 테마 토큰 매핑
  - app shell/reset, 공용 keyframes, 접근성/모션 전역 규칙
- 컴포넌트 전용 `.css` 파일은 예외적인 경우에만 허용한다:
  - `@keyframes`
  - 외부 라이브러리 오버라이드
  - `:has()`, 복잡한 `::before/::after`, 부모 hover 기반 자식 노출 같은 선택자 로직
- 공존 CSS 파일은 해당 컴포넌트와 같은 디렉터리에 둔다. 예: `SymbolCodePanel.tsx` + `SymbolCodePanel.css`
- 인라인 스타일은 동적 값이 꼭 필요할 때만 사용한다. 정적인 값은 Tailwind 클래스 또는 토큰 기반 CSS로 옮긴다.
- VSCode 테마 값 참조가 필요하면 Tailwind 토큰(`bg-panel`, `text-muted`, `border-line`)을 우선 사용하고, 부득이한 경우에만 `--gae-*` alias 또는 `shared/design/tokens.ts`를 사용한다.

### Props

- 이벤트 핸들러 prop은 `on` 접두사: `onClick`, `onChange`, `onClose`.
- boolean prop은 `is`/`has` 접두사: `isLoading`, `hasError`, `isActive`.
- Optional prop은 `?`로 표시하고 기본값을 `defaultProps`가 아닌 구조 분해 시 설정.

### God 컴포넌트 방지 기준

- 화면 조합 컴포넌트(`S##_*Screen.tsx`)가 Zustand selector를 15개 이상 직접 구독하면, 그 컴포넌트가 오케스트레이션하는 각 Feature 패널에 필요한 상태를 각 Feature의 커스텀 훅(`useXxx()`)으로 옮기고, 화면 컴포넌트는 "어떤 패널을 보여줄지"만 결정한다.
- 화면 조합 컴포넌트가 2개 이상의 커스텀 훅에서 총 10개 이상의 필드를 구조 분해하면, 훅의 반환값을 직접 펼쳐 쓰지 않고 해당 패널 컴포넌트에 훅의 반환 객체를 그대로 전달하거나, 패널 내부에서 같은 훅을 다시 호출한다.
- 화면 조합 컴포넌트는 "데이터 페칭 트리거 + 레이아웃 배치 + 패널 전환"만 담당하고, 개별 패널의 렌더링 세부사항(빈 상태/에러 상태 분기 등)은 각 Feature 컴포넌트(`DiffViewer`, `DependencyGraph`, `SymbolGraph` 등)에 위임한다 — 화면 컴포넌트에서 패널 내부 조건 분기가 발견되면 해당 패널 컴포넌트로 이동한다.
- 위 기준은 새로 작성하는 코드에 적용하는 기준이며, 이미 기준을 넘긴 기존 화면 컴포넌트에 대한 소급 리팩토링은 별도 계획서에서 다룬다. `S02_WorkspaceScreen.tsx`는 별도 계획서로 이미 소급 분해를 완료했다(38개 selector → 10개, 2개 훅 22개 필드 구조분해 → 0개. F04/F10에 신규 데이터 훅(`useDependencyCanvas`/`useSymbolGraph`)과 F02/F03/F04/F05b/F10 각각의 패널 컴포넌트를 추가). `S01_CommitListScreen.tsx`도 동일한 소급 분해를 완료했다(20개 selector → 9개, 커밋 리스트 도메인을 `useCommitList()` 훅으로 이관).

### 렌더링 안티패턴 방지 기준

- **Selector 개별화**: `useAppStore()`를 인자 없이 호출해 스토어 전체 또는 여러 필드를 구조분해하지 않는다. 필드마다 `useAppStore((state) => state.field)` 형태로 개별 selector를 작성한다(이 프로젝트는 shallow 비교 유틸을 쓰지 않는다 — 각 selector가 항상 단일 값을 반환하도록 유지한다). 전체 구독은 무관한 store 변경에도 컴포넌트 전체를 리렌더시킨다. 구독 대상이 15개를 넘으면 위 "God 컴포넌트 방지 기준"에 따라 Feature 커스텀 훅으로 이관한다.
- **자식에 전달하는 콜백 prop 안정화**: 자식 컴포넌트가 전달받은 콜백을 `useEffect`/`useCallback`의 의존성 배열에 사용한다면(디바운스, 구독 재설정 등), 인라인 화살표 함수를 그대로 넘기지 않고 `useCallback`으로 감싼다. 콜백이 참조하는 값(예: Zustand 액션)이 이미 안정적이면 의존성 배열도 안정적으로 유지된다. 예: `CommitFilterPanel.tsx`의 `handleKeywordChange`/`handleExcludeKeywordChange` — 인라인 함수였다면 `KeywordSearchInput`의 debounce effect가 매 렌더 재실행되어 검색 지연/누락으로 이어질 수 있었다.
- **prop 변경 시 로컬 state 초기화는 effect 대신 렌더 중 비교로 처리한다**: `useEffect(() => setState(초기값), [dep])` 패턴은 아래처럼 이전 값과 비교해 렌더 중 바로 `setState`를 호출하는 패턴으로 대체한다.
  ```tsx
  const [prevDep, setPrevDep] = useState(dep);
  if (prevDep !== dep) {
    setPrevDep(dep);
    setState(초기값);
  }
  ```
  이 패턴은 effect 기반 리셋에서 발생하는 "리셋 전 한 프레임 동안 이전 값이 그대로 보이는" 깜빡임을 없앤다(effect는 paint 이후 스케줄링되지만, 렌더 중 비교는 같은 렌더 패스에서 즉시 처리된다). 커스텀 훅 내부에서도 동일하게 적용한다 — 훅도 컴포넌트와 동일한 렌더 타이밍을 따른다. 실제 적용 예: `S02_WorkspaceScreen.tsx`의 `activeAIFilePath`(커밋 전환 시 리셋), `useAISummary.ts`의 `qaMessages`/`qaCompletionCount`(커밋·파일 전환 시 리셋, 두 dep을 합성 키로 묶어 비교).
- **xyflow(`useNodesState`/`useEdgesState`) 계산/동기화 원칙**: 원본 그래프 데이터(`buildGraphData` 등)는 반드시 별도 `useMemo`로 계산한다. 그 결과를 hover/선택 상태에 따라 하이라이트·dim 필드로 가공해 `setEdges`/`setNodes`에 반영하는 effect는, 그 가공이 "이미 useMemo로 계산된 데이터를 얇게 재구성"하는 수준이라면 계산과 동기화를 effect 안에 함께 두는 것을 허용한다 — 강제로 분리해도 의존성 배열이 같아 재실행 빈도가 줄지 않기 때문이다(`DependencyGraph.tsx`/`SymbolGraph.tsx`의 하이라이트 effect가 이 예외에 해당한다). 단, 이 effect가 아직 memo화되지 않은 새로운 원본 데이터를 계산하기 시작하면(예: 원시 API 응답을 여기서 처음 변환) 그 계산을 다시 `useMemo`로 분리한다.
- **반복 렌더되는 leaf 컴포넌트는 `React.memo`로 감싼다**: 리스트 아이템(`CommitListItem`), xyflow 커스텀 노드(`FileNode`, `SymbolNode`)처럼 형제가 여러 개 동시에 렌더되는 컴포넌트는 기본 `memo()`를 적용한다. 단, `memo()`를 적용하기 전에 해당 컴포넌트에 전달되는 모든 prop(특히 객체/함수)이 값이 바뀌지 않는 한 참조도 유지되는지 먼저 확인한다 — 상위에서 매번 새 객체를 만들어 넘기면(예: 하이라이트 effect가 매 렌더 새 `data` 객체를 생성하는 `DependencyEdge`/`SymbolEdge`) 기본 얕은 비교로는 효과가 없으므로, `memo(Component, areEqual)` 형태로 실제 렌더 결과에 영향을 주는 필드만 값 비교하는 커스텀 비교 함수를 함께 작성한다. xyflow 커스텀 노드/엣지에 memo를 적용할 때는 `nodeTypes`/`edgeTypes` 객체 자체도 컴포넌트 모듈 스코프 상수로 선언해 매 렌더 재생성되지 않도록 한다(그렇지 않으면 memo 여부와 무관하게 xyflow가 매번 새 컴포넌트 타입으로 인식한다).

---

## 상태 관리 규칙

- Zustand 스토어에서 setter 함수는 `set` 접두사 없이 동사형으로 명명: `selectCommit()`, `resetFilters()`, `setBatchProgress()`.
- 로컬 UI 상태(hover, focus, 드롭다운 열림 여부)는 `useState`를 사용하고 Zustand에 넣지 않는다.
- 파생 상태(computed values)는 Zustand selector로 정의하여 불필요한 리렌더를 방지한다.

---

## 레이어/모듈 구조 규칙

### Zustand 스토어 slice 분리 기준

- 단일 스토어가 다루는 도메인이 4개를 넘으면, 계속 flat 구조에 필드를 추가하지 않고 도메인별 slice 파일(`store/slices/<domain>Slice.ts`)로 분리한다. `appStore.ts`는 Zustand의 slice 패턴(`create<AppState>()((...a) => ({ ...createXSlice(...a), ...createYSlice(...a) }))`)으로 조합만 담당한다.
- slice 경계는 각 필드/액션이 어떤 하나의 화면·기능 전이(screen/panel transition)나 단일 async 라이프사이클에 가장 강하게 종속되는지로 판단한다. [state_management.md](./state_management.md)의 도메인 분류는 참고 자료일 뿐 그대로 파일 경계로 승격하지 않는다 — 실제로는 서로 강결합된 필드(예: 필터 변경이 커밋 목록 재로드를 직접 호출)를 하나로 묶는 편이 더 응집도가 높을 수 있다. slice를 분리·재편했으면 state_management.md도 실제 파일 구조에 맞춰 갱신한다.
- 여러 slice에 걸친 부수효과(예: 커밋 선택 시 여러 도메인의 상태를 함께 초기화)는, 그 부수효과를 가장 자연스럽게 소유하는 slice 안에 그대로 둔다. Zustand slices 패턴에서 각 slice creator는 `StateCreator<AppState, [], [], XSlice>`로 타입이 잡혀 `set`/`get`이 slice 자신의 필드가 아니라 전체 `AppState` 기준이므로, 한 slice의 액션이 다른 slice 소유 필드를 읽고 쓰는 것은 정상 동작이며 안티패턴이 아니다. 이 부수효과를 전부 `appStore.ts`로 빼내면 hub 액션의 로직이 사실상 다시 monolith로 되돌아가 분리 효과가 없어지므로 피한다.

### 반복되는 비동기 상태 패턴(isLoadingX/xError/hasLoadedX) 처리 원칙

- `shared/hooks/`나 `shared/utils/`를 새로 만들지 않는다([directory_structure.md](./directory_structure.md)의 공용 디렉터리 금지 원칙을 유지한다).
- 대신 스토어 내부 전용 팩토리(`createAsyncStatusFields()` 등, store 디렉터리 안에 위치)로 필드/액션 세트를 생성해 각 slice에서 조합한다. 컴포넌트에서의 접근이 반복되면 해당 Feature 디렉터리에 colocate된 훅(`useXxxAsyncState()`)으로 감싸되, 이 훅은 `shared/`가 아니라 소비하는 Feature 디렉터리에 둔다.

### 서비스 파일 언어별 로직 재사용 원칙

- 여러 서비스 파일이 같은 언어(JS/TS/Python/Go)의 소스를 다루면, "무엇을 추출하는가"(의존성 엣지 vs 심볼 노드)가 달라도 "어떻게 소스를 순회/파싱하는가"는 공통 유틸로 추출한다. 단, 실제로 순회/스캔 로직 자체가 겹치는지 먼저 확인한다 — 전략만 같고(예: "줄 단위 정규식 스캔") 실제 패턴이 목적별로 다르면(import 추출 vs 함수/구조체 선언 추출) 공통화 대상이 아니다.
- 공통 유틸 위치는 `src/extension/lang/<language>Parser.ts`로 한다. 실제 구현 예시: `lang/fileExtensions.ts`(확장자 판별), `lang/tsSourceWalker.ts`(TS Compiler API로 SourceFile 생성 + import/export 모듈 참조 수집 — `dependencyService.ts`의 JS/TS 정규식 fallback과 `intraFileDependencyService.ts`가 공유). Python/Go는 소급 조사 결과 두 서비스의 정규식 패턴이 서로 달라(import 추출 vs def/class/struct 선언 추출) 공통 유틸을 만들지 않았다 — 억지로 뽑으면 재사용되는 코드 없이 간접비만 늘어난다.
- 각 서비스는 공통 유틸이 반환한 중간 표현(AST 노드 목록, 모듈 참조 문자열 등)을 받아 자신의 도메인 모델로 변환하는 부분만 유지한다.
- 새 언어별 파싱 로직을 추가하기 전, 기존 서비스 파일에 이미 유사한 순회/스캔 로직이 있는지 `ttsc_graph`로 먼저 확인한다.

### 파일 크기/책임 분리 트리거

- 파일이 500줄을 넘거나, 하나의 파일이 3개 이상의 독립된 도메인(Feature ID 기준)을 처리하면 다음에 그 파일을 수정할 때 분리 여부를 먼저 판단한다. 즉시 분리를 강제하지는 않는다.
- 위 기준(500줄, slice 분리, 서비스 재사용)은 새로 작성하는 코드에 적용하는 잠정 기준이며, 이미 기준을 넘긴 기존 파일에 대한 소급 리팩토링은 별도 계획서에서 다룬다. `appStore.ts`(slice 분리)와 `messageHandler.ts`(도메인별 파일 분리)는 각각 별도 계획서로 이미 소급 리팩토링을 완료했다. `dependencyService.ts`/`intraFileDependencyService.ts`는 "서비스 파일 언어별 로직 재사용 원칙"(위 섹션)에 따른 공통 유틸 추출은 완료했으나, 이는 500줄 기준 자체의 파일 분리와는 별개 관심사이며 두 파일 모두 여전히 500줄을 넘긴 상태로 남아 있다 — 크기 자체를 줄이는 소급 분리는 이번 범위 밖이다.

---

## Extension Host 코드 규칙

### 메시지 핸들러

- `messageHandler.ts`에서 모든 메시지 타입을 switch문으로 처리한다.
- 각 케이스는 별도 함수로 분리하여 가독성을 확보한다.
- 처리 중 예외는 반드시 catch하여 `{ type: 'XXX_ERROR', payload: { message } }`를 응답한다.
- **도메인별 파일 분리 임계치**: switch문의 case가 15개를 넘으면, 케이스를 도메인(git/dependency/symbol/ai/note 등)별로 묶어 `messageHandler/<domain>Handlers.ts`로 분리하고, `messageHandler.ts`는 각 도메인 핸들러 맵으로 라우팅만 담당하는 진입점으로 남긴다. 도메인 판단 기준은 메시지 타입 접두어(`FETCH_COMMITS`/`FETCH_CHANGED_FILES` → git, `START_AI_SUMMARY_*`/`START_AI_QA` → ai 등)를 그대로 쓴다. `messageHandler.ts`는 별도 계획서로 이미 이 구조로 소급 분리를 완료했다 — 새로 case를 추가할 때도 위임 함수는 해당 도메인 핸들러 파일에 두고, 라우터에는 `switch` 분기만 추가한다.

```typescript
// 올바른 예
case 'START_AI_SUMMARY_COMMIT':
  await handleStartAISummaryCommit(webviewPanel, payload);
  break;
```

### 비동기 처리

- `async/await` 사용. callback 스타일 금지.
- `child_process.spawn` 래퍼는 `Promise`로 감싸되, 스트리밍 청크는 이벤트 핸들러에서 즉시 전송한다.

---

## 에러 처리 원칙

1. Extension Host에서 발생한 에러는 Webview에 반드시 메시지로 전달한다.
2. Webview 컴포넌트에서는 `ErrorBoundary`가 아닌 명시적 에러 상태(`ErrorState` 컴포넌트)를 사용한다.
3. 에러 메시지는 사용자가 이해할 수 있는 한국어로 작성한다.
4. 일괄 처리(F08)에서 개별 파일 실패는 전체 중단 없이 건너뛰고 카운트한다.

---

## 금지 사항

| 금지 | 이유 | 대안 |
|------|------|------|
| `any` 타입 | 타입 안전성 파괴 | 정확한 타입 또는 `unknown` 사용 |
| `console.log` (프로덕션) | 노출 위험 | `vscode.window.createOutputChannel` 또는 개발 전용 guard |
| Node.js API in Webview | 런타임 오류 | Extension Host에서 처리 후 postMessage |
| react-router | Webview SPA는 단일 패널 | Zustand `currentScreen` 상태로 화면 전환 |
| 직접 API 호출 (fetch to OpenAI 등) | 설계 원칙 위반 | `child_process.spawn` via Extension Host |
| `git add -A` 스타일 대량 상태 변경 | 불필요한 리렌더 | 필요한 상태만 선택적 업데이트 |

---

## 코드 포매팅

- Formatter: **Prettier** (기본 설정)
  - `printWidth: 100`
  - `singleQuote: true`
  - `trailingComma: 'all'`
  - `semi: true`
- Linter: **ESLint** (`eslint-config-react-app` 기반 + `@typescript-eslint`)
- 커밋 전 `lint-staged`로 자동 포매팅 실행.

---

## 커밋 메시지 규칙

이 프로젝트의 커밋 메시지는 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/) 규칙을 따른다.

### 기본 형식

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 필수 규칙

- 모든 커밋은 `feat`, `fix` 같은 타입 접두어로 시작해야 한다.
- 타입 뒤에는 선택적 scope를 괄호로 표기할 수 있다.
- 설명은 콜론 뒤 공백 1칸 다음에 작성한다.
- breaking change가 있으면 `!` 또는 `BREAKING CHANGE:` 꼬리말로 명시한다.
- 본문과 꼬리말은 필요할 때만 추가한다.

### 권장 타입

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `refactor`: 기능 변경 없는 구조 개선
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드, 설정, 잡무성 변경

### 예시

```text
feat: add conventional commit guidance
fix(dependency): handle missing file path in analysis
docs: update contribution workflow
refactor(webview): simplify summary state handling
```

### 작성 기준

- 커밋 메시지는 작업의 성격이 한눈에 드러나도록 작성한다.
- 하나의 커밋에는 가능한 한 하나의 목적만 담는다.
- 문서만 바뀐 경우에는 `docs`, 코드만 바뀐 경우에는 `feat` 또는 `fix` 등 변경 성격에 맞는 타입을 사용한다.
- breaking change가 포함된 경우에는 사용자 영향이 바로 드러나도록 제목에 `!`를 포함한다.

---

## 관련 문서

- [architecture.md](./architecture.md)
- [state_management.md](./state_management.md)
- [directory_structure.md](./directory_structure.md)
- [testing_strategy.md](./testing_strategy.md)
- [../core/naming_rules.md](../core/naming_rules.md)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/)
