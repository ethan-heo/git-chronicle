# CLAUDE

작업 시 **[개발 문서 가이드](./docs/README.md)**를 반드시 참고해야 합니다.

## TypeScript Graph Usage

TypeScript 구현 코드의 구조 탐색이 필요한 작업에서는 `ttsc_graph`를 먼저 사용한다.

- 호출 관계, 참조 관계, 영향 범위, 엔트리포인트, 상태 전파 흐름을 파악할 때는 먼저 `ttsc_graph`로 조사한다.
- 요구사항, 화면 계약, 상태 명세는 docs를 기준으로 확인하되, 구현 코드 탐색은 `ttsc_graph`를 우선한다.
- 실제 구현 본문 확인이나 수정이 필요할 때만 관련 파일을 추가로 연다.

## 기능 추가/수정 계획 수립 시 체크리스트

새 기능을 계획하거나 기존 기능을 수정하는 계획을 세울 때는 항상 아래 문서를 먼저 확인한다.

- `docs/project/architecture.md` — 전체 구조·통신 규약
- `docs/project/directory_structure.md` — 파일 배치 기준
- `docs/project/coding_standards.md` — 코딩 컨벤션
- `docs/project/state_management.md` — 상태 관리 전략
- `docs/core/naming_rules.md` — 신규 화면/기능/컴포넌트 명명 시
- 관련 `docs/features/F##_*/spec.md`, `blueprint.md` — 기존 유사 기능의 요구사항·구조 패턴 참고

디자인/구현 상세 프롬프트는 영구 문서로 만들지 않는다. 계획 수립 시 위 문서를 근거로 그때그때 생성하고, 작업 완료 후 변경 사항만 관련 기능의 `spec.md`/`blueprint.md`에 반영한 뒤 폐기한다.

## 기능 구현 시 체크리스트

- 계획서와 위 참조 문서의 내용을 신뢰하고 그대로 따라 구현한다. 구현 중 계획을 바꿔야 한다면 임의로 다르게 구현하지 말고 계획서를 먼저 수정한 뒤 진행한다.
- 메시지 타입/상태 필드 이름은 계획서에 명시된 이름을 그대로 사용한다. 추측으로 새 이름을 짓지 않는다.
- 비슷한 기존 기능(F##)의 코드 패턴을 재사용할 수 있는지 먼저 확인한다.
- `docs/project/coding_standards.md`의 네이밍·파일 구조·에러 처리 규칙을 따른다.
- 구현 완료 후 `pnpm typecheck`, `pnpm lint`, `pnpm test`를 실행해 통과를 확인한다.

## 작업 내용을 문서에 반영할 때 체크리스트

구현이 끝나면 실제로 바뀐 부분만 아래 문서에 반영한다. 새 메시지 타입이나 상태 필드를 추가하고 이 단계를 건너뛰면 문서가 바로 stale해진다 — F09/F10 추가 당시 이 단계가 누락되어 architecture.md, state_management.md, naming_rules.md, design_tokens.md 등이 한동안 낡은 상태로 방치된 적이 있으니 유의한다.

- `docs/features/F##_*/spec.md`, `blueprint.md` — 요구사항·UI/컴포넌트 계약 변경. 항상 최신 유지 대상.
- `docs/project/architecture.md` — 새 메시지 타입(`WebviewToExtensionMessage`/`ExtensionToWebviewMessage`)이나 디렉토리 구조가 바뀌면 갱신.
- `docs/project/state_management.md` — Zustand 상태 필드·액션을 추가/변경하면 갱신.
- `docs/core/naming_rules.md` — 새 Screen ID/Feature ID를 추가하면 갱신.
- `docs/core/design_tokens.md` — 새 색상/타이포그래피/간격 토큰을 추가하면 갱신.
- `docs/core/global_components.md` — 2개 이상 기능이 공유하는 컴포넌트를 추가/변경하면 갱신 (단일 기능 전용 컴포넌트는 해당 `blueprint.md`의 Component Definitions에만 반영).
- `docs/README.md` — 새 기능/화면을 추가하면 해당 표에 항목 추가.
- 계획 수립 시 만든 임시 디자인/구현 프롬프트는 이 단계에서 폐기한다. 영구 문서로 남기지 않는다.

## 커밋 시 체크리스트

커밋하면 `.husky/pre-commit`이 `pnpm docs:check`(`scripts/check-docs-sync.mjs`)를 자동 실행해 아래를 기계적으로 검증하고, 실패하면 커밋을 차단한다.

- docs 내부 상대 링크가 실제 파일을 가리키는지
- `architecture.md`의 메시지 프로토콜이 `src/extension/messageHandler.ts`와 일치하는지
- `naming_rules.md`의 Feature ID가 `src/webview/features/`와 일치하는지

검증이 실패하면 `--no-verify`로 우회하지 말고 실제 불일치(문서 또는 코드)를 고친 뒤 다시 커밋한다. 단, 이 검사는 이름·존재 여부 같은 사실 불일치만 잡아내며 내용의 의미적 정확성까지 보장하지 않으므로, 위 "작업 내용을 문서에 반영할 때 체크리스트"는 커밋 여부와 무관하게 항상 수동으로 따른다.
