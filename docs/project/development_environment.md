# Development Environment — Git Author Explorer

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## 런타임 환경

| 레이어 | 환경 | 설명 |
|--------|------|------|
| Extension Host | Node.js (VSCode 내장) | Git 데이터 조회, AI CLI 실행, 파일 I/O |
| Webview SPA | Browser-like (Chromium) | React UI 렌더링. DOM·CSS·브라우저 API 사용 가능. Node.js API 불가 |

---

## 핵심 기술 스택

### UI Framework

| 항목 | 선택 | 버전 | 비고 |
|------|------|------|------|
| UI 프레임워크 | React | 19.x | Concurrent Features 활용 |
| 언어 | TypeScript | 5.x | strict 모드 필수 |
| 빌드 도구 | Vite | 6.x | Webview SPA 번들링. `vite-plugin-vscode` 사용 |
| 스타일링 | TailwindCSS | 4.x | VSCode CSS 변수(`--vscode-*`)와 병행 사용 |
| UI 컴포넌트 | Shadcn UI | 최신 | 필요한 컴포넌트만 선택적 도입 |

### 상태 관리

| 항목 | 선택 | 비고 |
|------|------|------|
| 전역 상태 | Zustand | 단일 스토어(`useAppStore`). Webview 전용 |
| 서버 상태 | 없음 | Extension Host와 통신은 postMessage. 별도 캐시 라이브러리 불필요 |

### 캔버스 & 그래프

| 항목 | 선택 | 비고 |
|------|------|------|
| 노드-엣지 그래프 | React Flow | 줌·패닝·선택 인터랙션 내장. `@xyflow/react` |
| 레이아웃 알고리즘 | 확장자 그룹 기반 고정 앵커 배치 | 같은 확장자는 수직 정렬, 다른 확장자는 수평 그룹 배치 |

### 콘텐츠 렌더링

| 항목 | 선택 | 비고 |
|------|------|------|
| 마크다운 렌더링 | react-markdown | AI 정리 결과물(마크다운) 렌더링 |
| 신텍스 하이라이팅 | Shiki | VSCode TextMate 문법 기반. 필요한 언어 그래머만 동적 로드 |

### 테스팅

| 항목 | 선택 | 비고 |
|------|------|------|
| 테스트 러너 | Vitest | Vite와 통합. 빠른 실행 |
| 컴포넌트 테스트 | Testing Library (`@testing-library/react`) | 사용자 관점 인터랙션 테스트 |
| E2E | VSCode Extension Test Runner | Extension Host 통합 테스트 |

### Extension Host 전용 라이브러리

| 항목 | 선택 | 비고 |
|------|------|------|
| Git 데이터 | simple-git | `git log`, `git diff`, `git show` 래핑 |
| 의존 관계 분석 | dependency-cruiser | JS/TS/CJS/ESM, TypeScript path alias 지원 |
| AI CLI 실행 | Node.js `child_process.spawn` | Claude/Gemini/Codex CLI 호출. 외부 라이브러리 불필요 |
| 파일 I/O | Node.js `fs` (표준 라이브러리) | `fs.mkdirSync({ recursive: true })` |

---

## 개발 환경 요구사항

| 항목 | 최솟값 | 권장값 |
|------|--------|--------|
| Node.js | 18.x LTS | 20.x LTS |
| pnpm | 9.x | 10.x |
| VSCode | 1.85.0 | 최신 안정 버전 |
| macOS / Linux / Windows | 모두 지원 | — |

---

## 주요 개발 스크립트

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "dev:watch": "vite build --watch",
    "build": "vite build && tsc -p tsconfig.extension.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:extension": "vscode-test",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

- `pnpm dev`: Webview SPA를 브라우저에서 확인하는 개발 서버를 실행한다. 기본 접속 URL은 `http://127.0.0.1:5173/`이다.
- `pnpm dev:watch`: VSCode Extension Webview 배포 번들을 감시 빌드한다.

---

## tsconfig 분리 전략

| 파일 | 대상 | 설명 |
|------|------|------|
| `tsconfig.json` | Webview SPA | `"lib": ["ES2022", "DOM"]`. React JSX 설정 포함 |
| `tsconfig.extension.json` | Extension Host | `"lib": ["ES2022"]`. DOM 타입 제외. `"module": "CommonJS"` |

---

## 환경 변수 & 설정

- VSCode Extension의 사용자 설정은 `vscode.workspace.getConfiguration('gitAuthorExplorer')`로 접근한다.
- AI 프로바이더 등록 정보와 저장 경로는 `ExtensionContext.globalState`에 영속 저장한다.
- Webview에 초기 상태를 전달할 때는 `WebviewPanel.webview.html` 내 `<meta>`태그 또는 초기 `postMessage`를 사용한다.

---

## 패키지 관리

- 패키지 매니저: **pnpm** (lockfile: `pnpm-lock.yaml`)
- 의존성 설치는 `pnpm install`로 수행한다.
- Webview 의존성과 Extension Host 의존성을 `package.json`에서 구분하지 않는다. 단, `bundledDependencies`에 Extension Host에서 필요한 패키지(`simple-git`, `dependency-cruiser`)를 명시한다.
- Webview 번들(`dist/webview/`) 내에는 `react`, `react-dom`, `zustand`, `@xyflow/react`, `react-markdown`, `shiki`, `tailwindcss` 등이 포함된다.

---

## 관련 문서

- [architecture.md](./architecture.md)
- [coding_standards.md](./coding_standards.md)
- [testing_strategy.md](./testing_strategy.md)
