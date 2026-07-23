# Global Components

> **요약:** 2개 이상 기능이 공유하는 전역 컴포넌트(PrimaryButton, EmptyState, Toast 등)의 Props·States·구현 파일을 정의한다. 공유 UI 패턴이 필요할 때 새로 만들지 먼저 여기서 확인한다.

> GitChronicle 전체에서 재사용되는 컴포넌트를 정의한다.
> 특정 Feature에만 속한 컴포넌트는 해당 Feature의 blueprint.md에 정의한다.

---

## PrimaryButton

**용도:** 주요 액션 실행 버튼 (AI 정리 생성, 커밋 AI 정리, 캔버스 보기 등)

| 속성 | 타입 | 설명 |
|------|------|------|
| `children` | `React.ReactNode` | 버튼 내부 콘텐츠 |
| `onClick` | `() => void` | 클릭 핸들러 |
| `disabled` | `boolean` | 비활성화 여부 |
| `isLoading` | `boolean` | 로딩 중 여부. 스피너 표시 및 클릭 비활성화 |

**States:** `default`, `hover`, `disabled`, `loading`

**구현 파일:** `src/webview/shared/components/PrimaryButton.tsx`

**Figma 이름:** `PrimaryButton`

---

## BackButton

**용도:** 이전 화면으로 복귀하는 아이콘 전용 뒤로가기 버튼. 현재는 S-02 워크스페이스 사이드바와 S-06 설정 화면에서 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `onClick` | `() => void` | 클릭 핸들러 |

**States:** `default`, `hover`

**구현 파일:** `src/webview/shared/components/BackButton.tsx`

**Figma 이름:** `BackButton`

---

## EmptyState

**용도:** 콘텐츠가 없거나 조건에 맞는 항목이 없을 때 표시하는 안내 컴포넌트.

| 속성 | 타입 | 설명 |
|------|------|------|
| `message` | `string` | 안내 메시지 텍스트 |
| `ctaLabel` | `string \| null` | CTA 버튼 레이블 (없으면 버튼 미표시) |
| `onCtaClick` | `() => void \| null` | CTA 버튼 클릭 핸들러 |

**사용 예시:**

| 상황 | message | ctaLabel |
|------|---------|----------|
| Git 저장소 없음 | "Git 저장소가 감지되지 않았습니다" | "레포 열기" |
| 커밋 이력 없음 | "커밋 이력이 없습니다" | `null` |
| 필터 결과 없음 | "조건에 맞는 커밋이 없습니다" | `null` |
| AI 미설정 | "AI가 설정되지 않았습니다" | "설정으로 이동" |
| 저장 경로 미설정 | "저장 경로를 먼저 설정해주세요" | "설정으로 이동" |

**Figma 이름:** `EmptyState`

**구현 파일:** `src/webview/shared/components/EmptyState.tsx`

---

## LoadingState

**용도:** 데이터 로딩 또는 AI 생성 중 표시하는 로딩 인디케이터.

| 속성 | 타입 | 설명 |
|------|------|------|
| `label` | `string \| null` | 로딩 설명 텍스트 (없으면 미표시) |
| `size` | `"sm" \| "md" \| "lg"` | 스피너 크기 |

**States:** `spinning`

**구현 파일:** `src/webview/shared/components/LoadingState.tsx`

**Figma 이름:** `LoadingState`

---

## ErrorState

**용도:** 오류 발생 시 표시하는 에러 메시지 + 재시도 버튼.

| 속성 | 타입 | 설명 |
|------|------|------|
| `message` | `string` | 오류 메시지 텍스트 |
| `onRetry` | `() => void \| null` | [재시도] 버튼 클릭 핸들러 (없으면 버튼 미표시) |

**사용 예시:**

| 상황 | message | onRetry |
|------|---------|---------|
| AI 정리 생성 실패 | "생성에 실패했습니다" | AI 정리 재호출 함수 |
| CLI 사후 제거 | "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요" | `null` |

**Figma 이름:** `ErrorState`

**구현 파일:** `src/webview/shared/components/ErrorState.tsx`

---

## Toast

**용도:** 일시적인 알림 메시지. 자동으로 사라짐.

| 속성 | 타입 | 설명 |
|------|------|------|
| `message` | `string` | 알림 메시지 텍스트 |
| `type` | `"success" \| "warning" \| "error"` | 알림 유형 |
| `duration` | `number` | 자동 소멸까지 ms (기본값: 3000) |

**사용 예시:**

| 상황 | type | message |
|------|------|---------|
| 일괄 생성 완료 | `"success"` | "파일 AI 정리가 완료되었습니다" |
| 일괄 생성 완료 (실패 포함) | `"warning"` | "완료되었습니다. 실패 N개" |
| 저장 경로 미설정 | `"error"` | "저장 경로를 먼저 설정해주세요" |

**표시 위치:** 화면 하단 우측 고정. 여러 개 동시 표시 시 최대 3개 스택.

**구현 파일:** `src/webview/shared/components/Toast.tsx`

**Figma 이름:** `Toast`

---

## FileActionButtons

**용도:** 파일 트리 노드(S-02) 호버 시 표시되는 액션 버튼.

| 속성 | 타입 | 설명 |
|------|------|------|
| `onCodeView` | `() => void` | [코드 보기] 클릭 핸들러 → S-02 본문 `code` 패널 활성화 |
| `onAIView` | `() => void \| undefined` | [AI 요약 보기] 클릭 핸들러 → S-02 본문 `aiSummary` 패널 활성화 |
| `onSymbolGraph` | `() => void \| undefined` | [심볼 그래프] 클릭 핸들러 → S-02 본문 `symbolGraph` 패널 활성화 |
| `isSymbolGraphDisabled` | `boolean \| undefined` | 미지원 파일 유형일 때 [심볼 그래프] 버튼 비활성화 |
| `isVisible` | `boolean` | 호버 상태 여부로 표시 제어 |

**States:** `hidden` (기본), `visible` (호버 시)

**표현 규칙:** [AI 요약 보기] 버튼은 스파클 SVG 대신 `"AI"` 텍스트를 사용한다. hover 시 accent 텍스트 색상으로 강조한다.

**구현 파일:** `src/webview/shared/components/FileActionButtons.tsx`

**Figma 이름:** `FileActionButtons`

---

## FileStatusBadge

**용도:** 파일 트리 노드 또는 캔버스 노드에서 파일 변경 상태를 색상 + 문자 레터로 표시하는 뱃지.

| 속성 | 타입 | 설명 |
|------|------|------|
| `status` | `"A" \| "M" \| "D" \| "R"` | 파일 변경 상태 |

**상태 매핑:** `A` 추가, `M` 수정, `D` 삭제, `R` 이름 변경

**구현 파일:** `src/webview/shared/components/FileStatusBadge.tsx`

**Figma 이름:** `FileStatusBadge`

---

## InfiniteScrollTrigger

**용도:** 스크롤 하단 감지 시 추가 데이터 로드를 트리거하는 `IntersectionObserver` 기반 컴포넌트. 현재는 F01 커밋 목록의 무한 스크롤에서 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `isEnabled` | `boolean` | 관찰 활성화 여부 (예: `!isLoading && hasMore`) |
| `onTrigger` | `() => void` | 뷰포트에 진입했을 때 호출되는 콜백 |

**구현 파일:** `src/webview/shared/components/InfiniteScrollTrigger.tsx`

---

## TopHeader

**용도:** 공용 상단 헤더. 현재는 S-01 계열 상세 화면이 제거된 뒤 S-06 설정 화면에서만 사용하며, 제목·보조 문맥·뒤로가기·설정 아이콘 슬롯을 제공한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `title` | `string` | 화면 제목 또는 컨텍스트 경로 |
| `context` | `string \| undefined` | 제목 아래 보조 컨텍스트 텍스트 |
| `showSettingsIcon` | `boolean` | 설정 아이콘 표시 여부. 기본값 `false` |
| `showBackButton` | `boolean` | 뒤로가기 버튼 표시 여부 |
| `endSlot` | `React.ReactNode \| undefined` | 우측 액션 슬롯. 분할 보기 버튼처럼 추가 액션을 배치할 때 사용 |
| `onSettingsClick` | `() => void` | 설정 아이콘 클릭 → S-06 진입 |
| `onBackClick` | `() => void` | 뒤로가기 버튼 클릭 핸들러 |

**구현 파일:** `src/webview/shared/components/TopHeader.tsx`

**Figma 이름:** `TopHeader`

---

## ResizableSplitPane

**용도:** 두 패널 사이에 드래그 가능한 Divider를 제공하는 공용 레이아웃 컨테이너. F10 파일 내부 심볼 캔버스의 좌우 분할, F02 코드 탭의 AI 요약/심볼 그래프 분할에서 직접 사용하며, S02 사이드바 섹션의 상하 분할은 [`SidebarSectionGroup`](#sidebarsectiongroup)이 내부적으로 재귀 조합해 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `isOpen` | `boolean` | `false`면 Divider와 우측 패널을 렌더링하지 않음 |
| `orientation` | `'horizontal' \| 'vertical' \| undefined` | 분할 방향. 기본값은 좌우(`horizontal`) |
| `defaultLeftPercent` | `number \| undefined` | `isOpen`이 `true`가 될 때 좌측 너비 초기값 |
| `minLeftPx` / `minRightPx` | `number \| undefined` | 좌/우 패널 최소 너비 제한 |
| `controlledLeftPx` | `number \| undefined` | 첫 번째 패널의 제어된 크기(px). `vertical`일 때는 상단 높이로 해석 |
| `onLeftPxChange` | `(leftPx: number, rightPx: number) => void` | Divider 드래그 시 두 패널의 계산된 px 크기를 반환 |
| `left` / `right` | `React.ReactNode` | 좌/우 패널 콘텐츠 |
| `className` | `string \| undefined` | 추가 클래스 |

**동작:** Divider 드래그는 `mousemove`/`mouseup` 이벤트로 처리하며, 드래그 중에는 텍스트 선택을 막고 분할 방향에 맞는 resize 커서로 바꾼다. `controlledLeftPx`를 사용하는 경우 `ResizeObserver`로 컨테이너의 실제 크기를 관찰해, 좌측 패널에 적용되는 값을 `containerSize - minRightPx - divider폭` 이하로 자동 clamp한다 — 컨테이너가 좁아져도 우측 패널이 0으로 밀려 사라지지 않고 항상 `minRightPx` 이상을 확보한다.

**구현 파일:** `src/webview/shared/components/ResizableSplitPane.tsx`, `ResizableSplitPane.css`

---

## SidebarSection

**용도:** 사이드바 안에서 접고 펼 수 있는 섹션 컨테이너. 제목·배지·헤더 액션 슬롯을 제공한다. F02의 `CommitsSection`/`FileTreeSection`, F11의 `NotesSection`, F14의 `BranchesSection`에서 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `title` | `string` | 섹션 제목 |
| `isExpanded` | `boolean` | 펼침 상태 |
| `onToggle` | `() => void` | 헤더 클릭 시 펼침/접힘 토글 |
| `badge` | `ReactNode \| undefined` | 제목 옆 배지(주로 항목 개수) |
| `actions` | `ReactNode \| undefined` | 헤더 우측 액션 슬롯 |
| `children` | `ReactNode \| undefined` | 펼쳐졌을 때만 렌더링되는 본문 |

**구현 파일:** `src/webview/shared/components/SidebarSection.tsx`

---

## SidebarSectionGroup

**용도:** `SidebarSection`으로 감싼 N개 섹션을 하나의 세로 스택으로 배치하고, 펼쳐진 섹션끼리는 서로 리사이즈 가능하게, 접힌 섹션은 헤더만 차지하게 만드는 공용 레이아웃 컨테이너. S02 사이드바의 `BranchesSection`/`CommitsSection`/`FileTreeSection`/`NotesSection`을 동등한 형제로 묶는 데 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `sections` | `SidebarSectionGroupItem[]` | 순서대로 렌더링할 섹션 목록 |
| `className` | `string \| undefined` | 추가 클래스 |

`SidebarSectionGroupItem`:

| 속성 | 타입 | 설명 |
|------|------|------|
| `key` | `string` | React key |
| `minHeightPx` | `number` | 이 섹션이 펼쳐졌을 때의 최소 높이 |
| `heightPx` | `number` | 이 섹션이 펼쳐졌을 때의 (마지막 섹션이 아닌 경우) 고정 높이 |
| `isExpanded` | `boolean` | 펼침 상태 |
| `onHeightChange` | `(heightPx: number) => void` | 드래그로 높이가 바뀔 때 호출 |
| `node` | `ReactNode` | 이미 완성된 `SidebarSection` 엘리먼트(헤더+본문 포함) |

**동작:** 연속으로 펼쳐진 섹션들을 하나의 "클러스터"로 묶어 [`ResizableSplitPane`](#resizablesplitpane)을 재귀 중첩한다 — 클러스터의 마지막 섹션은 항상 남은 공간을 `flex-1`로 흡수하고, 그 앞의 섹션들은 각각 `heightPx` 고정 높이 + 드래그 가능한 divider를 가진다. 각 분할은 자신 뒤에 남은 모든 섹션의 `minHeightPx` 합을 `minRightPx`로 전달해 컨테이너가 좁아져도 뒤쪽 섹션이 0으로 사라지지 않게 한다. 현재 S02 사이드바는 각 섹션의 최소 높이를 96px로 사용한다. 접힌 섹션 사이에서 서로 떨어진 여러 클러스터가 생기면(예: 첫째 섹션만 펼침, 셋째 섹션만 펼침) 각 클러스터는 독립적인 `flex-1`로 취급되어 네이티브 flexbox가 남은 공간을 클러스터별 `minHeightPx`를 존중하며 비례 분배한다. 컨테이너 자체가 모든 섹션의 최소 높이 합보다도 좁으면(각 섹션이 정확히 최소 높이를 받고도 넘치면) 감싸는 부모의 세로 스크롤에 맡긴다(이 컴포넌트 자체는 `overflow`를 설정하지 않는다).

**구현 파일:** `src/webview/shared/components/SidebarSectionGroup.tsx`

---

## Popover

**용도:** 트리거 요소 아래에 비모달 오버레이 패널을 띄운다. 현재는 S02 커밋 목록 헤더의 필터 팝오버에서 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `isOpen` | `boolean` | 팝오버 렌더링 여부 |
| `onClose` | `() => void` | 외부 클릭 또는 `Esc` 입력 시 닫기 핸들러 |
| `labelledBy` | `string \| undefined` | 팝오버 제목 요소 id |
| `className` | `string \| undefined` | 추가 클래스 |
| `children` | `React.ReactNode` | 오버레이 내부 콘텐츠 |

**동작:** 열릴 때 내부 첫 포커스 가능 요소로 포커스를 이동하고, 외부 클릭 또는 `Esc`로 닫힌다. 닫힌 뒤 트리거로 포커스를 복귀시키는 책임은 호출 측이 가진다.

**구현 파일:** `src/webview/shared/components/Popover.tsx`

---

## MermaidBlock

**용도:** Mermaid fenced code block을 렌더링된 SVG preview로 보여주는 공유 컴포넌트. 현재 F05b AI 요약 뷰어와 F11 노트 라이브 프리뷰가 동일한 렌더 캐시와 pan/zoom 상호작용을 재사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `cacheKey` | `string` | 렌더 결과 캐시 키. 같은 key면 기존 SVG 문자열을 재사용한다 |
| `code` | `string` | Mermaid fenced block 내부의 원본 코드 |

**States:** `loading`, `displaying`, `error`

**상호작용:** 마우스 휠로 0.3x~2.0x 범위 확대/축소, 빈 영역 드래그 팬, 우상단 `+ / - / fit` 버튼으로 뷰 리셋. preview 상태에서도 원본 Mermaid 마크다운 복사 흐름을 유지한다.

**구현 파일:** `src/webview/features/F11/MermaidBlock.tsx`

---

## Export Rule

전역 컴포넌트는 `src/webview/shared/components/index.ts`에서 재-export한다.

```typescript
import { PrimaryButton, EmptyState, TopHeader } from './shared/components';
```
