import type { AIProviderName, AIUsageInfo } from '../types/commit';
import type { NoteEntry } from '../types/note';

export const DEMO_COMMIT_SUMMARY_HASH = 'a1b2c3d9e';
export const DEMO_FILE_SUMMARY_PATH = 'src/components/CommitList/useInfiniteScroll.ts';
export const DEMO_COMMIT_SUMMARY_NOTE_PATH = 'summaries/무한-스크롤-커밋-요약.ai.md';
export const DEMO_FILE_SUMMARY_NOTE_PATH = 'summaries/useInfiniteScroll-파일-요약.ai.md';
export const DEMO_LEGACY_SUMMARY_NOTE_PATH = 'summaries/legacy-summary.ai.md';

export const DEMO_COMMIT_SUMMARY_CONTENT = `### 한 줄 요약
무한 스크롤 진입점을 IntersectionObserver 기반으로 바꾸고 관련 훅/테스트를 함께 정리한 커밋이다.

### 변경 목적
**성능 개선 / 리팩터링.** 스크롤 이벤트를 직접 감시하던 경로를 관찰자 기반으로 바꿔, 리스트가 길어질 때도 더 안정적으로 다음 페이지를 불러오려는 의도로 보인다.

### 주요 변경 파일 및 포인트
1. \`src/components/CommitList/useInfiniteScroll.ts\`
   - 바뀐 점: 하단 sentinel 감시를 중심으로 로딩 조건과 observer lifecycle을 다시 구성했다.
   - 중요한 점: 커밋 목록의 다음 페이지 로딩 타이밍을 결정하는 핵심 훅이라 체감 동작을 직접 바꾼다.
2. \`src/components/CommitList/CommitList.tsx\`
   - 바뀐 점: 리스트 하단에 sentinel DOM을 렌더링하고 훅 반환값을 연결했다.
   - 중요한 점: 훅 변경만으로 끝나지 않고 실제 UI에서 관찰 지점을 제공해야 해서 함께 수정됐다.
3. \`tests/CommitList.test.tsx\`
   - 바뀐 점: observer 기반 동작을 기준으로 로딩 회귀를 검증하도록 테스트를 갱신했다.
   - 중요한 점: 스크롤 이벤트 제거 이후에도 기존 UX가 유지되는지 확인하는 안전망이다.

### 기술적 판단 근거
observer 기반 패턴으로 바꾸면 스크롤 핸들러 호출 빈도를 줄일 수 있어, 커밋 목록처럼 길게 늘어나는 화면에서 유지보수성과 성능을 함께 챙기기 좋다.`;

export const DEMO_FILE_SUMMARY_CONTENT = `### 한 줄 요약
\`useInfiniteScroll\` 훅을 IntersectionObserver 중심 구조로 재작성한 변경이다.

### 변경 목적
**리팩터링 / 성능 개선.** 스크롤 위치 계산을 매번 수행하기보다 sentinel 관찰로 전환해 무한 스크롤 진입 조건을 단순화하려는 수정으로 보인다.

### 주요 포인트
1. \`observer\`
   - 바뀐 점: sentinel 요소를 감시하는 observer 생성/해제 흐름이 추가됐다.
   - 중요한 점: 다음 페이지 로딩 시점을 브라우저 관찰 API에 위임해 불필요한 계산을 줄인다.
2. \`loadMore\`
   - 바뀐 점: observer 콜백 안에서 추가 로딩 여부를 판단하도록 연결됐다.
   - 중요한 점: 로딩 중복 호출을 막는 핵심 분기라 회귀가 나기 쉬운 지점이다.

### 기술적 판단 근거
훅 단위에서 관심사를 정리해 두면 CommitList 본문은 sentinel만 렌더링하면 되고, 이후 다른 리스트에도 같은 패턴을 재사용하기 쉬워진다.`;

export const DEMO_AI_SUMMARY_PROVIDER: AIProviderName = 'claude';

export const DEMO_AI_SUMMARY_VIEW_CACHE: Record<string, {
  content: string;
  savedPath: string | null;
  noteRelativePath: string | null;
  provider: AIProviderName | null;
  usage: AIUsageInfo | null;
  hasSavedSummary: boolean;
}> = {
  [`${DEMO_COMMIT_SUMMARY_HASH}::__commit__`]: {
    content: DEMO_COMMIT_SUMMARY_CONTENT,
    savedPath: `.git-author/${DEMO_COMMIT_SUMMARY_NOTE_PATH}`,
    noteRelativePath: DEMO_COMMIT_SUMMARY_NOTE_PATH,
    provider: DEMO_AI_SUMMARY_PROVIDER,
    usage: null,
    hasSavedSummary: true,
  },
  [`${DEMO_COMMIT_SUMMARY_HASH}::${DEMO_FILE_SUMMARY_PATH}`]: {
    content: DEMO_FILE_SUMMARY_CONTENT,
    savedPath: `.git-author/${DEMO_FILE_SUMMARY_NOTE_PATH}`,
    noteRelativePath: DEMO_FILE_SUMMARY_NOTE_PATH,
    provider: DEMO_AI_SUMMARY_PROVIDER,
    usage: null,
    hasSavedSummary: true,
  },
};

export const DEMO_NOTE_CONTENTS: Record<string, string> = {
  [DEMO_COMMIT_SUMMARY_NOTE_PATH]: DEMO_COMMIT_SUMMARY_CONTENT,
  [DEMO_FILE_SUMMARY_NOTE_PATH]: DEMO_FILE_SUMMARY_CONTENT,
  [DEMO_LEGACY_SUMMARY_NOTE_PATH]: `# Legacy Summary\n\n이 샘플은 \`commitMessage\` 없는 구버전 링크를 흉내 낸 노트입니다.\n지금 dev server에서는 일반 \`note\` 탭으로 열리는 fallback 예시로 사용합니다.`,
  'ideas/todo.md': `# TODO\n\n- Notes에서 \`.ai.md\` 샘플을 클릭해 AI 요약 탭 복원을 확인하기\n- 파일 요약 샘플을 다시 클릭해도 inner panel 토글이 꺼지지 않는지 확인하기`,
  'ideas/retro.md': `# Retro\n\n이번 데모 서버 샘플은 AI 요약 저장본 재오픈 동작을 바로 눈으로 확인할 수 있게 구성했다.`,
  'scratch.md': `# Scratch\n\n일반 F11 노트는 여전히 \`.md\` 규칙을 따르고, 클릭 시 NoteEditorPanel로 열린다.`,
};

export const DEMO_AI_SUMMARY_NOTE_ENTRIES: NoteEntry[] = [
  {
    relativePath: DEMO_COMMIT_SUMMARY_NOTE_PATH,
    name: '무한-스크롤-커밋-요약.ai.md',
    updatedAt: '2026-07-12T09:00:00.000Z',
    aiSummaryLink: {
      commitHash: DEMO_COMMIT_SUMMARY_HASH,
      scope: 'commit',
      commitMessage: 'feat: 무한 스크롤 트리거를 IntersectionObserver로 교체',
    },
  },
  {
    relativePath: DEMO_FILE_SUMMARY_NOTE_PATH,
    name: 'useInfiniteScroll-파일-요약.ai.md',
    updatedAt: '2026-07-12T09:05:00.000Z',
    aiSummaryLink: {
      commitHash: DEMO_COMMIT_SUMMARY_HASH,
      filePath: DEMO_FILE_SUMMARY_PATH,
      scope: 'file',
      commitMessage: 'feat: 무한 스크롤 트리거를 IntersectionObserver로 교체',
    },
  },
  {
    relativePath: DEMO_LEGACY_SUMMARY_NOTE_PATH,
    name: 'legacy-summary.ai.md',
    updatedAt: '2026-07-12T09:10:00.000Z',
  },
];
