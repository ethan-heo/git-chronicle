# Documentation Guidelines — GitChronicle

> **요약:** `docs/` 작성·재구성·stale 판별 규칙과 커밋 전 자동 검증 범위를 정의한다. 문서를 추가·수정·정리하기 전에 항상 먼저 확인한다.

> `docs/` 문서를 작성·수정할 때 따르는 규칙을 정의한다. 색인은 [README.md](../README.md)를 참고한다.

---

## 문서 최소화 원칙

각 기능은 `spec.md`(요구사항) + `blueprint.md`(UI/컴포넌트 계약)만 영구 문서로 유지한다. AI 생성용 프롬프트나 구현 상세는 작업 시 계획서(Plan)로 생성하고 완료 후 spec/blueprint에 반영한 뒤 폐기한다. 계획서를 어떤 구조로 쓰는지는 [project/plan_writing_guide.md](./plan_writing_guide.md)를 따른다. 여러 Feature가 공유하는 컴포넌트는 `core/global_components.md`에만 문서화하고, Feature 전용 컴포넌트는 해당 `blueprint.md`의 Component Definitions 섹션이 유일한 문서다.

---

## 문서 요약(TL;DR) 원칙

`product/`, `project/`, `core/` 아래 문서는 H1 제목 바로 아래에 `> **요약:** ...` 형식의 1~3줄 인용구를 별도 문단으로 둔다. AI나 사람이 파일을 열지 않고도 색인 단계에서 관련성을 판단할 수 있도록, 문서가 다루는 핵심 내용과 "언제 이 문서를 열어야 하는가"를 압축해서 담는다.

- 기존에 `> **버전** ... | **상태** ...` 같은 메타데이터 인용구가 있다면 요약 인용구를 그 위에 별도 문단으로 추가하고, 메타데이터 문단은 그대로 둔다(둘 다 지운다/합친다 하지 않는다).
- `features/F##_*/`, `screens/S##_*/`의 spec/blueprint는 이미 `docs/README.md`의 표 설명 열이 같은 역할을 하므로 이 원칙의 적용 대상이 아니다.
- 문서 본문이 바뀌어 요약과 내용이 어긋나면, "문서 갱신 체크리스트"에 따라 해당 문서를 고칠 때 요약도 함께 갱신한다 — 요약 자체는 grep으로 존재를 확인할 수 없는 서술이므로 stale 여부는 문서를 직접 다시 읽고 판단한다.

---

## 중복 서술 금지 원칙

같은 사실은 한 문서에만 쓰고 나머지는 링크로 참조한다.

- 정확한 안내 메시지·CTA 문구·컴포넌트 매핑은 `blueprint.md`의 Empty/Error/Loading States가 유일한 출처이며, `spec.md`의 Error Handling은 발생 조건만 적는다.
- 단일 Feature로만 구성된 화면의 `screens/S##_*/blueprint.md`는 State Model/Interaction Model을 다시 적지 않고 해당 `features/F##_*/blueprint.md`를 참조한다.
- `blueprint.md`는 컴포넌트 트리·레이아웃 계층처럼 `ttsc_graph`로 확인 가능한 코드 구조를 다시 그리지 않는다 — 위치·조합 관계 확인은 `ttsc_graph`가 우선이다.

---

## Stale 콘텐츠 판별·정리 원칙

문서가 코드보다 뒤처져 남아있는 stale 콘텐츠는 두 종류로 나눠서 다르게 처리한다.

- **기계적으로 확인 가능한 사실 불일치**: 파일 경로, 컴포넌트/함수명, 메시지 타입, Feature ID, `glossary.md`/Domain Glossary의 "관련 코드 식별자" 컬럼처럼 grep이나 `ttsc_graph`로 존재 여부를 바로 확인할 수 있는 대상. 발견 즉시 코드 기준으로 고친다 — 별도 논의 없이 수정한다. `pnpm docs:check`가 검증하는 범위(문서 내부 링크, 메시지 프로토콜, Feature ID)는 커밋 전 자동으로 걸러지지만, 그 외의 grep 가능한 사실(컴포넌트 Props, state 필드명, 용어집의 코드 식별자 등)은 수동으로 확인해야 한다.
- **판단이 필요한 stale**: "이 흐름이 아직 유효한가", "이 설계 근거가 여전히 맞는가", "이 용어의 정의가 여전히 맞는가"처럼 코드 존재 여부만으로 답할 수 없는 서술. 확신 없이 삭제·수정하지 말고 관련 코드를 `ttsc_graph`로 먼저 확인한다. 그래도 판단이 서지 않으면 사용자에게 묻거나 [project/known_issues.md](known_issues.md)에 근거와 함께 남긴다 — known_issues.md는 "발견했지만 지금 해결하지 않는 불일치"를 위한 임시 보관소이며, 해결되면 항목을 제거한다.

Stale 여부를 판단하는 계기:

- 다른 작업으로 문서를 열었다가 그 근처에서 오래된 서술을 발견하면, 범위를 벗어나지 않는 한 같은 작업에서 바로 고친다. 별도 정리 작업으로 미루지 않는다.
- 새 기능 계획을 세우기 전 참고하는 기존 문서(spec/blueprint/core)에서 이미 코드와 어긋난 내용을 발견하면, 그 내용을 그대로 계획에 끌어오지 않는다 — 먼저 문서를 고치거나 known_issues.md에 남긴 뒤 계획을 세운다.

---

## 문서 재구성(정리) 절차

여러 문서에 흩어진 동일한 사실을 하나로 모으거나, 문서 위치·디렉토리 구조를 바꿀 때는 다음 순서를 따른다.

1. 정본(canonical) 위치를 정한다 — "컴포넌트 문서화 규칙", "중복 서술 금지 원칙"에서 이미 정본이 정해진 대상(컴포넌트 Props, 에러 메시지·CTA 문구, 상태 모델 등)은 그 규칙을 따르고, 규칙이 없는 새로운 중복이라면 가장 구체적인 단위를 정본으로 삼는다(Feature 전용이면 해당 `blueprint.md`, 여러 Feature가 공유하면 core/project 문서).
2. 나머지 위치는 서술을 지우고 정본 링크로 대체한다 — 요약조차 다시 쓰지 않는다.
3. 파일을 옮기거나 이름을 바꿨다면 [docs/README.md](../README.md) 색인의 경로를 함께 갱신한다.
4. `docs/` 밖에서 문서 경로를 참조하는 `CLAUDE.md`·`AGENTS.md`(두 파일은 내용이 동일하게 유지된다)도 같이 확인한다 — `pnpm docs:check`는 `docs/` 내부 링크만 검증하므로 이 둘은 수동으로 확인해야 한다.
5. 정리 후 `pnpm docs:check`를 실행해 깨진 링크가 없는지 확인한다.

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

> `spec.md`에 "개념 → 실제 파일/함수/메시지" 매핑 섹션(예: Current Implementation Notes)을 두는 방식은 검토했으나 채택하지 않았다. 파일 경로·함수명은 리팩토링마다 바뀌는 항목이라 stale 위험이 크고, `pnpm docs:check`가 이런 자유 형식 텍스트의 정확성까지 자동 검증하지는 못한다. 코드 위치 탐색은 `ttsc_graph`를 그때그때 사용하는 것으로 대신한다.

---

## Screens 문서 구성

화면 문서는 단일 Feature로 구성된 화면(S01·S07)의 경우 진입 조건·화면 상태·내비게이션 흐름처럼 해당 Feature의 `blueprint.md`에는 없는 화면 단위 정보를 담고, 여러 Feature가 조합되는 화면(S02·S06)은 그 조합 관계 자체를 문서화한다.

---

## 컴포넌트 문서화 규칙

여러 Feature가 공유하는 컴포넌트(Props·States·구현 파일)는 [core/global_components.md](../core/global_components.md) 하나에만 문서화한다: `PrimaryButton`, `BackButton`, `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `FileActionButtons`, `FileStatusBadge`, `TopHeader`, `ResizableSplitPane`.

Feature 전용 컴포넌트(예: `CommitListItem`, `DiffViewer`, `DependencyGraph`, `SymbolGraph` 등)는 별도 문서를 두지 않고 해당 기능 `blueprint.md`의 **Component Definitions** 섹션이 유일한 문서다.

---

## 용어집 문서화 규칙

2개 이상 Feature가 공유하는 도메인 용어(Commit, Diff, Provider, Node/Edge 등)는 [core/glossary.md](../core/glossary.md) 하나에만 문서화한다.

Feature 전용 용어(해당 F##에서만 쓰이는 개념)는 별도 문서를 두지 않고 해당 기능 `spec.md`의 **Domain Glossary** 섹션이 유일한 문서다.

- 이미 `core/glossary.md`에 있는 용어를 Feature `spec.md`에서 다시 정의하지 않는다 — "중복 서술 금지 원칙"을 용어에도 동일하게 적용한 것이다.
- 어떤 Feature에서 쓰던 전용 용어가 다른 Feature에서도 쓰이기 시작하면, 그 용어를 `spec.md`의 Domain Glossary에서 삭제하고 `core/glossary.md`로 승격한 뒤 "등장 Feature" 컬럼에 관련 Feature를 모두 적는다. 반대로 공유 용어를 쓰던 Feature가 모두 제거되어 등장 Feature가 1개 이하로 줄면 `core/glossary.md`에서 제거하고 필요하면 해당 `spec.md`로 다시 내린다.

---

## 문서 갱신 체크리스트

구현이 끝나면 실제로 바뀐 부분만 아래 문서에 반영한다. 새 메시지 타입이나 상태 필드를 추가하고 이 단계를 건너뛰면 문서가 바로 stale해진다 — F09/F10 추가 당시 이 단계가 누락되어 architecture.md, state_management.md, naming_rules.md, design_tokens.md 등이 한동안 낡은 상태로 방치된 적이 있으니 유의한다.

- `docs/features/F##_*/spec.md`, `blueprint.md` — 요구사항·UI/컴포넌트 계약 변경. 항상 최신 유지 대상.
- `docs/project/architecture.md` — 새 메시지 타입(`WebviewToExtensionMessage`/`ExtensionToWebviewMessage`)이나 디렉토리 구조가 바뀌면 갱신.
- `docs/project/state_management.md` — Zustand 상태 필드·액션을 추가/변경하면 갱신.
- `docs/core/naming_rules.md` — 새 Screen ID/Feature ID를 추가하면 갱신.
- `docs/core/glossary.md` — 2개 이상 Feature가 공유하는 새 도메인 용어가 생기거나, Feature 전용 용어가 공유 용어로 승격/강등되면 갱신.
- `docs/features/F##_*/spec.md`의 Domain Glossary — 해당 Feature에 전용 용어가 추가/변경되면 갱신.
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
