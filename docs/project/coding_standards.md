# Coding Standards — GitChronicle

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
type ScreenID = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06';
type FileStatus = 'A' | 'M' | 'D' | 'R';

// 금지
enum ScreenID { S01 = 'S01', ... }
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

---

## 상태 관리 규칙

- Zustand 스토어에서 setter 함수는 `set` 접두사 없이 동사형으로 명명: `selectCommit()`, `resetFilters()`, `setBatchProgress()`.
- 로컬 UI 상태(hover, focus, 드롭다운 열림 여부)는 `useState`를 사용하고 Zustand에 넣지 않는다.
- 파생 상태(computed values)는 Zustand selector로 정의하여 불필요한 리렌더를 방지한다.

---

## Extension Host 코드 규칙

### 메시지 핸들러

- `messageHandler.ts`에서 모든 메시지 타입을 switch문으로 처리한다.
- 각 케이스는 별도 함수로 분리하여 가독성을 확보한다.
- 처리 중 예외는 반드시 catch하여 `{ type: 'XXX_ERROR', payload: { message } }`를 응답한다.

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
- [testing_strategy.md](./testing_strategy.md)
- [../core/naming_rules.md](../core/naming_rules.md)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/)
