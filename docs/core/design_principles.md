# Design Principles

> Git Author Explorer의 모든 UI 설계 결정은 아래 원칙을 기준으로 판단한다.

---

## 1. Information Hierarchy (정보 계층)

- 가장 중요한 정보(커밋 목록, 변경 파일, AI 정리 결과)를 화면의 Primary Zone에 배치한다.
- 보조 액션(필터, 설정, 뒤로가기)은 Secondary Zone에 배치하여 주요 콘텐츠를 방해하지 않는다.
- 화면 제목·커밋 컨텍스트(`{커밋 메시지} > {파일 경로}`)는 항상 상단 헤더에 고정 표시한다.

---

## 2. Progressive Disclosure (점진적 공개)

- 퍼널 방식 네비게이션: S-01 → S-02 → S-03/S-04/S-05 순으로 세부 정보를 단계적으로 노출한다.
- 파일 액션 버튼([코드 보기], [AI 정리 보기])은 호버 시에만 표시한다. 기본 상태에서는 숨겨 목록의 가독성을 유지한다.
- AI 정리 결과의 마크다운 내용은 스트리밍 타이핑 효과로 순차 노출한다.

---

## 3. Reusability (재사용성)

- 반복되는 UI 패턴(EmptyState, LoadingState, ErrorState, Toast)은 반드시 전역 컴포넌트로 추출한다.
- 파일 트리(S-02)와 캔버스 노드(S-05)에서 동일하게 사용하는 호버 액션 버튼([코드 보기], [AI 정리 보기])은 단일 컴포넌트(`FileActionButtons`)로 구현한다.
- 뱃지(`SavedBadge`, `FileStatusBadge`)는 Feature를 가로질러 일관된 컴포넌트로 재사용한다.

---

## 4. Accessibility (접근성)

- 모든 버튼과 인터랙티브 요소는 키보드 탐색(Tab/Enter/Space)을 지원한다.
- 색상만으로 상태를 구분하지 않는다. 파일 상태는 색상 + 문자 레터(`A`, `M`, `D`, `R`)로 병행 표시한다.
- 로딩 상태는 시각적 스피너와 함께 `aria-busy`, `aria-label`을 명시한다.
- 캔버스 노드(React Flow)는 `aria-label`로 파일명과 의존 관계를 설명한다.

---

## 5. Responsive First (반응형 우선)

- VSCode Webview 패널은 사이드바/에디터/전체 화면 다양한 너비로 열릴 수 있다.
- 최소 너비 280px에서도 핵심 정보(커밋 목록, 파일 트리)가 정상 표시되어야 한다.
- 캔버스(S-05)는 패널 크기에 따라 자동 zoom을 조정하여 노드가 잘리지 않도록 한다.
- 필터 패널은 좁은 너비에서 접을 수 있는 토글 방식으로 전환한다.
