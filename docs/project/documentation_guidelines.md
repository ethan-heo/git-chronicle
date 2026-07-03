# Documentation Guidelines — GitChronicle

> `docs/` 문서를 작성·수정할 때 따르는 규칙을 정의한다. 색인은 [README.md](../README.md)를 참고한다.

---

## 문서 최소화 원칙

각 기능은 `spec.md`(요구사항) + `blueprint.md`(UI/컴포넌트 계약)만 영구 문서로 유지한다. AI 생성용 프롬프트나 구현 상세는 작업 시 계획서(Plan)로 생성하고 완료 후 spec/blueprint에 반영한 뒤 폐기한다. 여러 Feature가 공유하는 컴포넌트는 `core/global_components.md`에만 문서화하고, Feature 전용 컴포넌트는 해당 `blueprint.md`의 Component Definitions 섹션이 유일한 문서다.

---

## 중복 서술 금지 원칙

같은 사실은 한 문서에만 쓰고 나머지는 링크로 참조한다.

- 정확한 안내 메시지·CTA 문구·컴포넌트 매핑은 `blueprint.md`의 Empty/Error/Loading States가 유일한 출처이며, `spec.md`의 Error Handling은 발생 조건만 적는다.
- 단일 Feature로만 구성된 화면의 `screens/S##_*/blueprint.md`는 State Model/Interaction Model을 다시 적지 않고 해당 `features/F##_*/blueprint.md`를 참조한다.
- `blueprint.md`는 컴포넌트 트리·레이아웃 계층처럼 `ttsc_graph`로 확인 가능한 코드 구조를 다시 그리지 않는다 — 위치·조합 관계 확인은 `ttsc_graph`가 우선이다.

---

## 상태 문서 형식 원칙

`project/state_management.md`의 액션 절은 구현 코드(TypeScript 함수 본문)를 붙여넣지 않는다 — 코드가 유일한 진실이며 바뀔 때마다 stale해진다. 로딩·화면 전환처럼 상태 기계로 표현되는 흐름은 산문 대신 Mermaid `stateDiagram-v2`로, 필드 초기화·부수효과처럼 나열형 사실은 표로 정리한다. 코드만 봐서 알 수 없는 설계 근거("왜 이렇게 동작하는가")만 산문으로 남긴다.

---

## 화면 문서 컴포넌트 표 원칙

`screens/S##_*/blueprint.md`의 Components 표는 "정의"(해당 `blueprint.md`의 `#component-{name}` 앵커 또는 `global_components.md` 앵커)와 "구현 파일" 경로를 함께 적어, 문서 전체를 열지 않고도 컴포넌트 위치를 바로 알 수 있게 한다.

---

## Feature 문서 구성 (spec / blueprint)

각 기능은 `spec` · `blueprint` 2개 파일로 구성된다.

- **spec**: 기능 요구사항 및 동작 명세
- **blueprint**: UI 레이아웃·컴포넌트 구성 (Props·State·Interaction 포함, 개별 컴포넌트 문서를 겸함)

AI 디자인/구현 생성용 프롬프트는 영구 문서로 두지 않는다. 계획(Plan) 수립 시 spec·blueprint·project·core 문서를 근거로 그때그때 생성하고, 작업 완료 후 변경 사항만 spec/blueprint에 반영한 뒤 폐기한다.

---

## Screens 문서 구성

화면 문서는 단일 Feature로 구성된 화면(S01·S02·S03·S05·S08)의 경우 진입 조건·화면 상태·내비게이션 흐름처럼 해당 Feature의 `blueprint.md`에는 없는 화면 단위 정보를 담고, 여러 Feature가 조합되는 화면(S04·S06)은 그 조합 관계 자체를 문서화한다.

---

## 컴포넌트 문서화 규칙

여러 Feature가 공유하는 컴포넌트(Props·States·구현 파일)는 [core/global_components.md](../core/global_components.md) 하나에만 문서화한다: `PrimaryButton`, `BackButton`, `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `FileActionButtons`, `FileStatusBadge`, `SavedBadge`, `TopHeader`, `ResizableSplitPane`, `SplitViewButton`.

Feature 전용 컴포넌트(예: `CommitListItem`, `DiffViewer`, `DependencyGraph`, `SymbolGraph` 등)는 별도 문서를 두지 않고 해당 기능 `blueprint.md`의 **Component Definitions** 섹션이 유일한 문서다.

---

## 문서 갱신 체크리스트

구현이 끝나면 실제로 바뀐 부분만 아래 문서에 반영한다. 새 메시지 타입이나 상태 필드를 추가하고 이 단계를 건너뛰면 문서가 바로 stale해진다 — F09/F10 추가 당시 이 단계가 누락되어 architecture.md, state_management.md, naming_rules.md, design_tokens.md 등이 한동안 낡은 상태로 방치된 적이 있으니 유의한다.

- `docs/features/F##_*/spec.md`, `blueprint.md` — 요구사항·UI/컴포넌트 계약 변경. 항상 최신 유지 대상.
- `docs/project/architecture.md` — 새 메시지 타입(`WebviewToExtensionMessage`/`ExtensionToWebviewMessage`)이나 디렉토리 구조가 바뀌면 갱신.
- `docs/project/state_management.md` — Zustand 상태 필드·액션을 추가/변경하면 갱신.
- `docs/core/naming_rules.md` — 새 Screen ID/Feature ID를 추가하면 갱신.
- `docs/core/design_tokens.md` — 새 색상/타이포그래피/간격 토큰을 추가하면 갱신.
- `docs/core/global_components.md` — 2개 이상 기능이 공유하는 컴포넌트를 추가/변경하면 갱신 (단일 기능 전용 컴포넌트는 해당 `blueprint.md`의 Component Definitions에만 반영).
- `docs/README.md` — 새 기능/화면을 추가하면 해당 표에 항목 추가.
- 계획 수립 시 만든 임시 디자인/구현 프롬프트는 이 단계에서 폐기한다. 영구 문서로 남기지 않는다.

---

## 커밋 전 자동 검증

커밋하면 `.husky/pre-commit`이 `pnpm docs:check`(`scripts/check-docs-sync.mjs`)를 자동 실행해 아래를 기계적으로 검증하고, 실패하면 커밋을 차단한다.

- docs 내부 상대 링크가 실제 파일을 가리키는지
- `architecture.md`의 메시지 프로토콜이 `src/extension/messageHandler.ts`와 일치하는지
- `naming_rules.md`의 Feature ID가 `src/webview/features/`와 일치하는지

검증이 실패하면 `--no-verify`로 우회하지 말고 실제 불일치(문서 또는 코드)를 고친 뒤 다시 커밋한다. 단, 이 검사는 이름·존재 여부 같은 사실 불일치만 잡아내며 내용의 의미적 정확성까지 보장하지 않으므로, 위 "문서 갱신 체크리스트"는 커밋 여부와 무관하게 항상 수동으로 따른다.
