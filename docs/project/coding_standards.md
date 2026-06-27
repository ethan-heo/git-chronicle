# Coding Standards — Git Author Explorer

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
case 'START_AI_SUMMARY_FILE':
  await handleStartAISummaryFile(webviewPanel, payload);
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

## 관련 문서

- [architecture.md](./architecture.md)
- [state_management.md](./state_management.md)
- [testing_strategy.md](./testing_strategy.md)
- [../core/naming_rules.md](../core/naming_rules.md)
