# State Model

> GitRewind 전체에서 공유되는 전역 상태를 정의한다.
> 상태 관리 라이브러리: Zustand 또는 React Context (확정 전).

---

## 전역 상태 목록

### Git Repository 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `isGitRepoDetected` | `boolean` | `false` | 현재 워크스페이스에 Git 저장소가 감지되었는지 여부 |

---

### 커밋 관련 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `commitList` | `Commit[]` | `[]` | 현재 로드된 커밋 목록 |
| `selectedCommit` | `Commit \| null` | `null` | 현재 선택된 커밋. S-02 진입 시 설정 |
| `isLoadingCommits` | `boolean` | `false` | 커밋 목록 로딩 중 여부 |
| `hasMoreCommits` | `boolean` | `true` | 추가 로드 가능한 커밋 존재 여부 (무한 스크롤) |
| `commitPage` | `number` | `0` | 현재 로드된 페이지 (200개 단위) |
| `commitLoadError` | `string \| null` | `null` | 초기 커밋 로드 실패 메시지 |
| `loadMoreError` | `string \| null` | `null` | 추가 로드 실패 시 하단에 표시할 메시지 |
| `hasLoadedCommits` | `boolean` | `false` | 첫 로드 완료 여부. 빈 상태와 초기 로딩 구분에 사용 |

---

### 필터 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `filterDateStart` | `string \| null` | `null` | 날짜 필터 시작일 (ISO 8601) |
| `filterDateEnd` | `string \| null` | `null` | 날짜 필터 종료일 (ISO 8601) |
| `filterAuthor` | `string \| null` | `null` | 작성자 필터 선택값 |
| `filterKeyword` | `string` | `""` | 커밋 메시지 포함 키워드 검색어 |
| `filterExcludeKeyword` | `string` | `""` | 커밋 메시지 제외 키워드 검색어 |
| `sortOrder` | `"desc" \| "asc"` | `"desc"` | 커밋 정렬 순서 |
| `authorList` | `string[]` | `[]` | 드롭다운용 작성자 목록 (로드된 커밋 목록에서 추출) |

---

### 파일 관련 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `selectedFile` | `ChangedFile \| null` | `null` | 현재 선택된 파일. S-03/S-04 진입 시 설정 |
| `changedFiles` | `ChangedFile[]` | `[]` | 현재 선택된 커밋의 변경 파일 목록 |

---

### AI 정리 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `isLoadingSummary` | `boolean` | `false` | 저장본 확인 또는 설정 로딩 중 여부 |
| `isGeneratingSummary` | `boolean` | `false` | AI 정리 생성 중 여부 (단일 파일/커밋) |
| `currentSummaryContent` | `string` | `""` | 스트리밍 중 누적된 AI 정리 텍스트 |
| `summaryError` | `string \| null` | `null` | AI 정리 실패 시 오류 메시지 |
| `summarySavedPath` | `string \| null` | `null` | 현재 표시 중인 AI 정리 저장 파일 경로 |
| `hasCurrentSavedSummary` | `boolean` | `false` | 현재 표시 중인 요약이 저장본 또는 저장 완료본인지 여부 |
| `isSummaryTokenLimitExceeded` | `boolean` | `false` | diff가 경고 기준(12,000자)을 초과했는지 여부 |
| `summaryMode` | `"file" \| "commit"` | `"file"` | 현재 AI 정리 모드 (파일 단위 / 커밋 단위) |

---

### 일괄 생성 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `isBatchRunning` | `boolean` | `false` | 일괄 AI 정리 생성 진행 중 여부 |
| `isBatchCancelling` | `boolean` | `false` | 취소 요청 후 현재 파일 완료를 기다리는 중인지 여부 |
| `batchTotal` | `number` | `0` | 일괄 생성 대상 파일 수 |
| `batchCompleted` | `number` | `0` | 일괄 생성 완료 파일 수 |
| `batchFailedCount` | `number` | `0` | 일괄 생성 실패 파일 수 |

---

### AI 프로바이더 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `activeAIProvider` | `"claude" \| "gemini" \| "codex" \| null` | `null` | 현재 활성화된 AI CLI |
| `registeredProviders` | `AIProvider[]` | `[]` | 등록된 AI CLI 목록 (활성화 여부 포함) |

---

### 저장 경로 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `savePath` | `string \| null` | `null` | AI 정리 결과물 저장 경로. null이면 미설정 상태 |

---

### 네비게이션 상태

| 상태 키 | 타입 | 초기값 | 설명 |
|---------|------|--------|------|
| `currentScreen` | `ScreenID` | `"S01"` | 현재 활성 화면 ID |

> F01 현재 구현은 별도 `previousScreen` 상태 없이 `goToCommitList()` 액션으로 S02에서 S01로 복귀한다.

---

## 타입 정의

```typescript
type ScreenID = "S01" | "S02" | "S03" | "S04" | "S05" | "S06";

type AIProviderName = "claude" | "gemini" | "codex";

interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string; // ISO 8601
}

interface ChangedFile {
  path: string;
  status: "A" | "M" | "D" | "R"; // Added / Modified / Deleted / Renamed
  hasSavedSummary: boolean;
}

interface AIProvider {
  name: AIProviderName;
  isActive: boolean;
  isRegistered: boolean;
}
```

---

## 상태 초기화 규칙

- `selectedCommit` 변경 시: `selectedFile`, `changedFiles`, 의존성 상태, `currentSummaryContent`, `isLoadingSummary`, `isGeneratingSummary`, `summaryError`, `summarySavedPath`, `hasCurrentSavedSummary`, `isSummaryTokenLimitExceeded` 초기화.
- `savePath` null 설정 시: `isGeneratingSummary`가 true이면 진행 중인 생성을 중단하지 않음 (이미 시작된 작업은 완료 후 저장 불가 토스트 표시).
- `isBatchRunning` false 전환 시: `isBatchCancelling`을 false로 되돌린다. 마지막 `batchTotal`, `batchCompleted`, `batchFailedCount` 값은 완료/취소 Toast 계산을 위해 유지한다.
- 확장 프로그램 재활성화 시: 네비게이션 상태는 S-01로 리셋. AI 프로바이더·저장 경로 상태는 VSCode ExtensionContext에서 복원.
