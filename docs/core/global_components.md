# Global Components

> Git Author Explorer 전체에서 재사용되는 컴포넌트를 정의한다.
> 특정 Feature에만 속한 컴포넌트는 해당 Feature의 blueprint.md에 정의한다.

---

## PrimaryButton

**용도:** 주요 액션 실행 버튼 (AI 정리 생성, 커밋 AI 정리, 캔버스 보기 등)

| 속성 | 타입 | 설명 |
|------|------|------|
| `label` | `string` | 버튼 텍스트 |
| `onClick` | `() => void` | 클릭 핸들러 |
| `isDisabled` | `boolean` | 비활성화 여부 |
| `isLoading` | `boolean` | 로딩 중 여부 (스피너 표시) |

**States:** `default`, `hover`, `disabled`, `loading`

**Figma 이름:** `PrimaryButton`

---

## BackButton

**용도:** 이전 화면으로 복귀하는 뒤로가기 버튼. 모든 하위 화면(S-02 ~ S-06)에 표시.

| 속성 | 타입 | 설명 |
|------|------|------|
| `onClick` | `() => void` | 클릭 시 `previousScreen`으로 네비게이션 |

**States:** `default`, `hover`

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

---

## LoadingState

**용도:** 데이터 로딩 또는 AI 생성 중 표시하는 로딩 인디케이터.

| 속성 | 타입 | 설명 |
|------|------|------|
| `label` | `string \| null` | 로딩 설명 텍스트 (없으면 미표시) |
| `size` | `"sm" \| "md" \| "lg"` | 스피너 크기 |

**States:** `spinning`

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

**Figma 이름:** `Toast`

---

## FileActionButtons

**용도:** 파일 트리 노드(S-02) 또는 캔버스 노드(S-05) 호버 시 표시되는 액션 버튼 쌍.

| 속성 | 타입 | 설명 |
|------|------|------|
| `onCodeView` | `() => void` | [코드 보기] 클릭 핸들러 → S-03 진입 |
| `onAISummary` | `() => void` | [AI 정리 보기] 클릭 핸들러 → S-04 진입 |
| `isVisible` | `boolean` | 호버 상태 여부로 표시 제어 |

**States:** `hidden` (기본), `visible` (호버 시)

**Figma 이름:** `FileActionButtons`

---

## SavedBadge

**용도:** 파일 트리 노드 또는 캔버스 노드에서 AI 정리 저장본 존재 여부를 표시하는 뱃지.

| 속성 | 타입 | 설명 |
|------|------|------|
| `isVisible` | `boolean` | 저장본 존재 시 true |

**표시 조건:** 저장 경로가 설정되어 있고, 해당 파일의 `.md` 저장본이 존재할 때만 표시.

**Figma 이름:** `SavedBadge`

---

## TopHeader

**용도:** 모든 화면의 상단 헤더. 화면 제목, 컨텍스트 경로, 설정 아이콘을 포함.

| 속성 | 타입 | 설명 |
|------|------|------|
| `title` | `string` | 화면 제목 또는 컨텍스트 경로 |
| `showSettingsIcon` | `boolean` | 설정(⚙) 아이콘 표시 여부 |
| `showBackButton` | `boolean` | 뒤로가기 버튼 표시 여부 |
| `onSettingsClick` | `() => void` | 설정 아이콘 클릭 → S-06 진입 |
| `onBackClick` | `() => void` | 뒤로가기 버튼 클릭 핸들러 |

**Figma 이름:** `TopHeader`
