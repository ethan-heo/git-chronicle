# Testing Strategy — GitChronicle

> **요약:** 단위/컴포넌트/Extension 통합 3계층 테스트 전략과 커버리지 목표, 테스트 제외 대상을 정의한다. 테스트를 새로 작성하거나 범위를 판단할 때 참고한다.

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## 테스트 계층

GitChronicle의 테스트는 세 계층으로 구분한다.

| 계층 | 도구 | 대상 | 목적 |
|------|------|------|------|
| 단위 테스트 | Vitest | 유틸 함수, Zustand 스토어 액션 | 비즈니스 로직 정확성 |
| 컴포넌트 테스트 | Vitest + Testing Library | React 컴포넌트 | UI 렌더링·인터랙션 |
| Extension 통합 테스트 | VSCode Extension Test Runner | Extension Host 서비스 | Node.js API 연동 |

---

## 단위 테스트 (Unit Tests)

### 대상

#### Extension 서비스 함수 (`src/extension/`)

```typescript
// summaryFileService.test.ts
describe('summaryFileService', () => {
  it('파일 단위 AI 정리는 단축 해시와 커밋 메시지 폴더 아래 파일 경로 기반 md로 저장한다', () => {
    expect(getSummaryFilePath('/tmp/gae', 'abc123456789', 'src/App.tsx', 'feat: add batch AI summary')).toBe(
      '/tmp/gae/abc1234_feat-add-batch-AI-summary/src__App.tsx.md',
    );
  });

  it('커밋 단위 AI 정리는 한글 파일명으로 저장한다', () => {
    expect(getCommitSummaryFilePath('/tmp/gae', 'abc123456789', 'feat: add batch AI summary')).toBe(
      '/tmp/gae/abc1234_feat-add-batch-AI-summary/전체_파일_정리.md',
    );
  });

  it('저장 디렉토리가 없으면 자동 생성한다', () => {
    const savedPath = saveSummary(tempPath, 'abc123', 'src/App.tsx', '# Summary');
    expect(fs.existsSync(savedPath)).toBe(true);
  });

  it('저장 경로를 생성할 수 없으면 SummarySaveError를 던진다', () => {
    expect(() => saveCommitSummary(fileSavePath, 'abc123', '# Summary')).toThrow(SummarySaveError);
  });
});
```

```typescript
// aiProviderService.test.ts
describe('aiProviderService', () => {
  it('registeredProviders는 globalState에 유지하고 프로젝트 설정은 workspaceState에서 읽는다', () => {
    // globalState / workspaceState mock
  });

  it('workspaceState가 비어 있으면 gitChronicle 설정값으로 폴백한다', () => {
    // vscode.workspace.getConfiguration('gitChronicle') mock
  });

  it('activeAIProvider, savePath, 모델 선택은 workspaceState에만 저장한다', async () => {
    // setActiveAIProvider / setSavePath / setAIModel
  });
});
```

#### Zustand 스토어 액션

```typescript
// appStorePersistence.test.ts
describe('useAppStore', () => {
  it('VSCode Webview State에서 필터 초기값을 복원한다', () => {
    // window.acquireVsCodeApi().getState() mock
  });

  it('setFilter / clearFilters 호출 시 필터 값을 Webview State에 저장한다', () => {
    // window.acquireVsCodeApi().setState() mock
  });

  it('selectCommit 시 selectedFile이 초기화된다', () => {
    const { selectCommit } = useAppStore.getState();
    selectCommit(mockCommit);
    expect(useAppStore.getState().selectedFile).toBeNull();
  });

  it('setActiveAIProvider 시 다른 provider가 비활성화된다', () => {
    // ...
  });

  it('CHANGED_FILES_LOADED 수신 시 hasSavedCommitSummary가 함께 갱신된다', () => {
    // ...
  });
});
```

### 커버리지 목표

- 유틸 함수: **100%**
- Zustand 액션: **80% 이상**

---

## 컴포넌트 테스트 (Component Tests)

### 원칙

- Testing Library의 `getByRole`, `getByText`를 우선 사용한다. `getByTestId`는 최후 수단.
- 사용자 행동을 중심으로 테스트한다 ("클릭 시 X가 표시된다" 형태).
- 실제 Zustand 스토어를 사용하되, 테스트마다 스토어를 초기화한다.

### 주요 테스트 케이스

#### CommitListItem

```typescript
it('커밋 정보(해시·메시지·작성자·날짜)가 렌더링된다', ...);
it('클릭 시 onClick 콜백이 호출된다', ...);
it('Enter 키로 클릭과 동일한 효과가 발생한다', ...);
```

#### FileTreeNode

```typescript
it('파일 상태 뱃지(A/M/D/R)가 올바르게 표시된다', ...);
it('호버 시 [코드 보기] 버튼이 나타난다', ...);
```

#### parseDiff

```typescript
it('unified diff의 added/removed/context 라인과 old/new line number를 계산한다', ...);
it('hunk가 없는 plain content를 context 라인으로 처리한다', ...);
```

#### DependencyGraphData

```typescript
it('변경 파일은 모두 노드로 유지하고 미변경 파일과의 엣지는 제외한다', ...);
it('JS/TS 외 파일은 canAnalyze=false 노드로 표시한다', ...);
it('확장자 그룹은 수평으로, 같은 확장자 파일은 수직으로 배치한다', ...);
it('긴 파일명 노드는 파일명이 끝까지 보이도록 폭을 확장한다', ...);
it('의존 관계 엣지는 가장 가까운 노드 면의 핸들로 연결한다', ...);
```

#### AISummaryViewer

```typescript
it('isGeneratingSummary = true 시 스트리밍 텍스트가 순차 표시된다', ...);
it('summaryError가 있으면 ErrorState 컴포넌트가 렌더링된다', ...);
it('저장본 로드 완료 후 react-markdown으로 렌더링된다', ...);
```

---

## Extension 통합 테스트

### 대상

- `gitService.ts`: `git log`, `git diff` 실행 결과 파싱
- `summaryFileService.ts`: 파일 존재 여부 확인, 저장, 읽기
- `aiProviderService.ts`: `--version` 실행으로 CLI 감지, globalState/workspaceState 영속 상태 관리

### 실행 방법

```bash
pnpm test:extension
```

VSCode Extension Test Runner가 실제 VSCode 프로세스를 시작하여 Extension Host 환경에서 테스트를 실행한다.

---

## 테스트 제외 대상

| 항목 | 이유 |
|------|------|
| Shiki 렌더링 결과 | 외부 라이브러리 내부 로직. 스냅샷 테스트로 대체 |
| React Flow 캔버스 렌더링 | 실제 pan/zoom/drag/edge 렌더링은 브라우저 기반 시각 검증이 필요. 단, `buildGraphData`의 노드·엣지 필터링, 확장자 그룹 배치, 긴 파일명 노드 폭, 가까운 면 핸들 선택은 Vitest로 검증 |
| child_process.spawn 실제 AI 호출 | CI 환경에 CLI 설치 불가. Mock 사용 |

---

## CI/CD 통합

```yaml
# .github/workflows/test.yml
- run: pnpm typecheck
- run: pnpm lint
- run: pnpm test          # Vitest 단위/컴포넌트 테스트
# Extension 통합 테스트는 로컬에서만 실행 (headful VSCode 필요)
```

---

## 관련 문서

- [architecture.md](./architecture.md)
- [coding_standards.md](./coding_standards.md)
- [directory_structure.md](./directory_structure.md)
