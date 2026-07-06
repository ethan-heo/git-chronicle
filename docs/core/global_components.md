# Global Components

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

**용도:** 좌우 두 패널 사이에 드래그 가능한 Divider를 제공하는 공용 레이아웃 컨테이너. F10 파일 내부 심볼 캔버스에서 인라인 분할 패널 용도로 사용한다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `isOpen` | `boolean` | `false`면 Divider와 우측 패널을 렌더링하지 않음 |
| `defaultLeftPercent` | `number \| undefined` | `isOpen`이 `true`가 될 때 좌측 너비 초기값 |
| `minLeftPx` / `minRightPx` | `number \| undefined` | 좌/우 패널 최소 너비 제한 |
| `left` / `right` | `React.ReactNode` | 좌/우 패널 콘텐츠 |
| `className` | `string \| undefined` | 추가 클래스 |

**동작:** Divider 드래그는 `mousemove`/`mouseup` 이벤트로 처리하며, 드래그 중에는 텍스트 선택을 막고 커서를 `col-resize`로 바꾼다.

**구현 파일:** `src/webview/shared/components/ResizableSplitPane.tsx`, `ResizableSplitPane.css`

---

## Export Rule

전역 컴포넌트는 `src/webview/shared/components/index.ts`에서 재-export한다.

```typescript
import { PrimaryButton, EmptyState, TopHeader } from './shared/components';
```
