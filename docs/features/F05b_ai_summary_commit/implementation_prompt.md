# Implementation Prompt: F05b_AISummaryCommit

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

F05_AISummaryFile과 거의 동일한 구현. `summaryMode = 'commit'`으로 분기하며, 아래 두 가지 차이만 있다:

1. **diff 범위**: 단일 파일이 아닌 커밋 전체 diff (`git show {hash}`)
2. **저장 파일명**: `전체_파일_정리.md` (파일 경로 기반 이름 아님)

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/aiService.ts` | F05와 공유 (변경 불필요) |
| `src/extension/summaryFileService.ts` | `saveCommitSummary()`, `loadCommitSummary()` 함수 추가 |
| `src/extension/gitService.ts` | `fetchCommitFullDiff()` 함수 추가 |
| `src/webview/features/F05/S04_AISummaryViewerScreen.tsx` | `summaryMode` 분기 처리 추가 |

---

## TypeScript Interfaces

```typescript
// F05와 공유하는 타입 (추가 없음)
// summaryMode: 'file' | 'commit' 전역 상태 활용
```

---

## Extension Host Implementation

### `fetchCommitFullDiff()` in `gitService.ts`

```typescript
export async function fetchCommitFullDiff(
  repoPath: string,
  commitHash: string
): Promise<string> {
  const git = simpleGit(repoPath);
  // 커밋 전체 diff (모든 변경 파일 포함)
  const diff = await git.show([
    commitHash,
    '--stat',
    '-p',
    '--unified=3',
  ]);
  return diff;
}
```

### `summaryFileService.ts` 추가 함수

```typescript
export function saveCommitSummary(
  savePath: string,
  commitHash: string,
  content: string,
  commitMessage?: string
): string {
  const savedPath = getCommitSummaryFilePath(savePath, commitHash, commitMessage);
  fs.mkdirSync(path.dirname(savedPath), { recursive: true });
  fs.writeFileSync(savedPath, content, 'utf-8');
  return savedPath;
}

export function loadCommitSummary(
  savePath: string,
  commitHash: string,
  commitMessage?: string
): { content: string; savedPath: string } | null {
  const savedPath = findExistingPath(getCommitSummaryFilePathCandidates(savePath, commitHash, commitMessage));
  if (!savedPath) return null;
  return { content: fs.readFileSync(savedPath, 'utf-8'), savedPath };
}
```

### 메시지 핸들러 (`START_AI_SUMMARY_COMMIT`)

F05와 동일하게 `{ type, payload }` 메시지 프로토콜과 `AI_SUMMARY_*` 응답 이벤트를 사용한다.

```typescript
case 'START_AI_SUMMARY_COMMIT': {
  const { commitHash, commitMessage, provider, savePath, forceRegenerate } = message.payload;

  const fullDiff = await fetchCommitFullDiff(repoPath, commitHash);
  const TOKEN_LIMIT_CHARS = 20000;  // 커밋 전체 diff는 더 넉넉하게
  const isOverLimit = fullDiff.length > TOKEN_LIMIT_CHARS;

  panel.webview.postMessage({ type: 'AI_SUMMARY_TOKEN_WARNING', payload: { isOverLimit } });
  panel.webview.postMessage({ type: 'AI_SUMMARY_STARTED', payload: { provider } });

  const prompt = buildCommitSummaryPrompt(commitHash, fullDiff);

  let fullContent = '';
  streamAISummary({
    provider,
    prompt,
    onChunk: chunk => {
      fullContent += chunk;
      panel.webview.postMessage({ type: 'AI_SUMMARY_CHUNK', payload: { chunk } });
    },
    onComplete: () => {
      const savedPath = saveCommitSummary(savePath, commitHash, fullContent);
      panel.webview.postMessage({ type: 'AI_SUMMARY_DONE', payload: { content: fullContent, savedPath, provider } });
    },
    onError: err => {
      panel.webview.postMessage({ type: 'AI_SUMMARY_ERROR', payload: { message: err } });
    },
  });
  break;
}
```

---

## AI 프롬프트 템플릿

```typescript
export function buildCommitSummaryPrompt(commitHash: string, diff: string): string {
  return `다음은 Git 커밋의 전체 변경 내용입니다.

커밋 해시: ${commitHash.slice(0, 7)}

\`\`\`diff
${diff}
\`\`\`

위 커밋의 전체 변경 사항을 한국어로 요약해 주세요:
1. 이 커밋의 목적과 배경
2. 주요 변경 파일별 핵심 내용
3. 전체적인 영향 범위

마크다운 형식으로 작성해 주세요.`;
}
```

---

## Webview 분기 처리 (`S04_AISummaryViewerScreen.tsx`)

```tsx
// summaryMode에 따라 Extension Host 명령 분기
useEffect(() => {
  if (!selectedCommit) return;

  if (summaryMode === 'commit') {
    // 저장본 확인
    const saved = loadCommitSummary(savePath, selectedCommit.hash);
    if (saved) {
      setSummaryContent(saved);
      setHasSavedSummary(true);
      return;
    }
    // 새로 생성
    postMessage('START_AI_SUMMARY_COMMIT', {
      commitHash: selectedCommit.hash,
      commitMessage: selectedCommit.message,
      provider: activeAIProvider,
      savePath,
    });
  } else {
    // F05 파일 요약 로직 (기존)
    postMessage('START_AI_SUMMARY_FILE', {
      commitHash: selectedCommit.hash,
      commitMessage: selectedCommit.message,
      filePath: selectedFile!.path,
      provider: activeAIProvider,
      savePath,
    });
  }
}, [summaryMode, selectedCommit]);

// TopHeader breadcrumb 분기
const breadcrumb = summaryMode === 'commit'
  ? `${selectedCommit?.message} > 커밋 전체 요약`
  : `${selectedCommit?.message} > ${selectedFile?.path}`;
```

---

## Business Rules

1. 저장 파일명은 `전체_파일_정리.md`이며 `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md`에 저장한다. 기존 `{savePath}/{commitHash}/_commit_summary.md`는 읽기 폴백으로 유지한다.
2. F05의 `hasSavedSummary`는 `ChangedFile` 단위이고, 커밋 요약은 별도 상태로 관리
3. `OverwriteConfirmDialog`, `RegenerateButton`, `StreamingTextRenderer`는 F05와 동일 컴포넌트 재사용
4. `summaryMode`는 Zustand 전역 상태에서 관리

---

## References

- [F05b spec.md](./spec.md)
- [F05b blueprint.md](./blueprint.md)
- [F05 implementation_prompt.md](../F05_ai_summary_file/implementation_prompt.md)
- [state_model.md](../../core/state_model.md)
