import { create } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../bridge/vscodeApi';
import type { ChangedFile, Commit, FilterState, ScreenID, SummaryMode } from '../types/commit';

const PAGE_SIZE = 200;
const DEMO_PAGE_SIZE = 12;

interface CommitsLoadedPayload {
  commits: Commit[];
  page: number;
  pageSize: number;
}

interface AppState extends FilterState {
  commitList: Commit[];
  authorList: string[];
  selectedCommit: Commit | null;
  changedFiles: ChangedFile[];
  selectedFile: ChangedFile | null;
  isLoadingChangedFiles: boolean;
  changedFilesError: string | null;
  savePath: string | null;
  summaryMode: SummaryMode;
  isBatchRunning: boolean;
  batchTotal: number;
  batchCurrent: number;
  commitPage: number;
  hasMoreCommits: boolean;
  isLoadingCommits: boolean;
  isGitRepoDetected: boolean;
  currentScreen: ScreenID;
  commitLoadError: string | null;
  loadMoreError: string | null;
  hasLoadedCommits: boolean;
  loadCommits: (reset?: boolean) => void;
  loadChangedFiles: () => void;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilters: () => void;
  selectCommit: (commit: Commit) => void;
  goToCommitList: () => void;
  goToHistoryView: () => void;
  selectFileForCode: (file: ChangedFile) => void;
  selectFileForAI: (file: ChangedFile) => void;
  goToCommitAISummary: () => void;
  goToCanvasView: () => void;
  goToSettingsView: () => void;
  startBatchAISummary: () => void;
  openRepository: () => void;
  handleCommitsLoaded: (payload: CommitsLoadedPayload) => void;
  handleRepositoryNotFound: () => void;
  handleCommitsLoadFailed: (message?: string) => void;
  handleChangedFilesLoaded: (files: ChangedFile[]) => void;
  handleChangedFilesLoadFailed: (message?: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  commitList: [],
  authorList: [],
  selectedCommit: null,
  changedFiles: [],
  selectedFile: null,
  isLoadingChangedFiles: false,
  changedFilesError: null,
  savePath: null,
  summaryMode: 'file',
  isBatchRunning: false,
  batchTotal: 0,
  batchCurrent: 0,
  commitPage: 0,
  hasMoreCommits: true,
  isLoadingCommits: false,
  isGitRepoDetected: true,
  currentScreen: 'S01',
  commitLoadError: null,
  loadMoreError: null,
  hasLoadedCommits: false,
  filterDateStart: null,
  filterDateEnd: null,
  filterAuthor: null,
  filterKeyword: '',

  loadCommits: (reset = false) => {
    const state = get();

    if (state.isLoadingCommits) {
      return;
    }

    const page = reset ? 0 : state.commitPage;

    set({
      isLoadingCommits: true,
      commitLoadError: reset ? null : state.commitLoadError,
      loadMoreError: null,
      isGitRepoDetected: true,
      ...(reset ? { commitList: [], commitPage: 0, hasMoreCommits: true } : {}),
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        const filtered = filterDemoCommits(get());
        const commits = filtered.slice(page * DEMO_PAGE_SIZE, (page + 1) * DEMO_PAGE_SIZE);
        get().handleCommitsLoaded({ commits, page, pageSize: DEMO_PAGE_SIZE });
      }, 260);
      return;
    }

    postMessage('FETCH_COMMITS', {
      page,
      pageSize: PAGE_SIZE,
      filterDateStart: state.filterDateStart,
      filterDateEnd: state.filterDateEnd,
      filterAuthor: state.filterAuthor,
      filterKeyword: state.filterKeyword,
    });
  },

  loadChangedFiles: () => {
    const state = get();

    if (!state.selectedCommit || state.isLoadingChangedFiles) {
      return;
    }

    set({
      isLoadingChangedFiles: true,
      changedFilesError: null,
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleChangedFilesLoaded(demoChangedFiles);
      }, 220);
      return;
    }

    postMessage('FETCH_CHANGED_FILES', {
      commitHash: state.selectedCommit.hash,
      savePath: state.savePath,
    });
  },

  setFilter: (filter) => {
    set(filter);
    get().loadCommits(true);
  },

  clearFilters: () => {
    set({
      filterDateStart: null,
      filterDateEnd: null,
      filterAuthor: null,
      filterKeyword: '',
    });
    get().loadCommits(true);
  },

  selectCommit: (commit) => {
    set({
      selectedCommit: commit,
      selectedFile: null,
      changedFiles: [],
      changedFilesError: null,
      isLoadingChangedFiles: false,
      currentScreen: 'S02',
    });
  },

  goToCommitList: () => {
    set({
      currentScreen: 'S01',
    });
  },

  goToHistoryView: () => {
    set({
      currentScreen: 'S02',
    });
  },

  selectFileForCode: (file) => {
    set({
      selectedFile: file,
      currentScreen: 'S03',
    });
  },

  selectFileForAI: (file) => {
    set({
      selectedFile: file,
      summaryMode: 'file',
      currentScreen: 'S04',
    });
  },

  goToCommitAISummary: () => {
    set({
      selectedFile: null,
      summaryMode: 'commit',
      currentScreen: 'S04',
    });
  },

  goToCanvasView: () => {
    set({
      currentScreen: 'S05',
    });
  },

  goToSettingsView: () => {
    set({
      currentScreen: 'S06',
    });
  },

  startBatchAISummary: () => {
    const total = get().changedFiles.length;

    if (total === 0) {
      return;
    }

    set({
      isBatchRunning: true,
      batchTotal: total,
      batchCurrent: 0,
    });

    if (isVSCodeRuntime()) {
      const state = get();
      postMessage('START_BATCH_AI_SUMMARY', {
        commitHash: state.selectedCommit?.hash,
        files: state.changedFiles.map((file) => file.path),
      });
    }
  },

  openRepository: () => postMessage('OPEN_REPOSITORY'),

  handleCommitsLoaded: ({ commits, page, pageSize }) => {
    const current = get();
    const nextCommitList = page === 0 ? commits : [...current.commitList, ...commits];

    set({
      commitList: nextCommitList,
      authorList: extractAuthors(nextCommitList),
      commitPage: page + 1,
      hasMoreCommits: commits.length >= pageSize,
      isLoadingCommits: false,
      isGitRepoDetected: true,
      commitLoadError: null,
      loadMoreError: null,
      hasLoadedCommits: true,
    });
  },

  handleRepositoryNotFound: () => {
    set({
      commitList: [],
      authorList: [],
      commitPage: 0,
      hasMoreCommits: false,
      isLoadingCommits: false,
      isGitRepoDetected: false,
      commitLoadError: null,
      loadMoreError: null,
      hasLoadedCommits: true,
    });
  },

  handleCommitsLoadFailed: (message = '커밋 목록을 불러오지 못했습니다') => {
    const hasExistingCommits = get().commitList.length > 0;

    set({
      isLoadingCommits: false,
      commitLoadError: hasExistingCommits ? null : message,
      loadMoreError: hasExistingCommits ? message : null,
      hasLoadedCommits: true,
    });
  },

  handleChangedFilesLoaded: (files) => {
    set({
      changedFiles: files,
      isLoadingChangedFiles: false,
      changedFilesError: null,
    });
  },

  handleChangedFilesLoadFailed: (message = '변경 파일 목록을 불러오지 못했습니다') => {
    set({
      changedFiles: [],
      isLoadingChangedFiles: false,
      changedFilesError: message,
    });
  },
}));

function extractAuthors(commits: Commit[]): string[] {
  return [...new Set(commits.map((commit) => commit.author).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function filterDemoCommits(state: FilterState): Commit[] {
  const keyword = state.filterKeyword.trim().toLowerCase();

  return demoCommits.filter((commit) => {
    if (state.filterAuthor && commit.author !== state.filterAuthor) {
      return false;
    }

    if (state.filterDateStart && commit.date.slice(0, 10) < state.filterDateStart) {
      return false;
    }

    if (state.filterDateEnd && commit.date.slice(0, 10) > state.filterDateEnd) {
      return false;
    }

    if (keyword && !commit.message.toLowerCase().includes(keyword) && !commit.hash.includes(keyword)) {
      return false;
    }

    return true;
  });
}

const demoCommits: Commit[] = [
  { hash: 'a1b2c3d9e', shortHash: 'a1b2c3d', message: 'feat: 무한 스크롤 트리거를 IntersectionObserver로 교체', author: '김지훈', date: '2026-06-25T09:40:00+09:00' },
  { hash: 'e4f5a6b21', shortHash: 'e4f5a6b', message: 'fix: 키워드 디바운스 타이머 초기화 누락 수정', author: '이수민', date: '2026-06-25T08:12:00+09:00' },
  { hash: '9c8d7e6f0', shortHash: '9c8d7e6', message: 'refactor: CommitFilterPanel 상태 끌어올리기', author: '김지훈', date: '2026-06-24T18:01:00+09:00' },
  { hash: 'b3a2c1d44', shortHash: 'b3a2c1d', message: 'feat: AuthorDropdown 작성자 목록 자동 추출', author: '박서준', date: '2026-06-24T11:24:00+09:00' },
  { hash: 'f0e1d2c87', shortHash: 'f0e1d2c', message: 'style: CommitListItem 밀도 조정', author: '이수민', date: '2026-06-23T20:10:00+09:00' },
  { hash: '7a6b5c413', shortHash: '7a6b5c4', message: 'docs: F01 blueprint 인터랙션 모델 업데이트', author: '김지훈', date: '2026-06-23T10:16:00+09:00' },
  { hash: '1d2e3f456', shortHash: '1d2e3f4', message: 'feat: DateRangeFilter 종료일 자동 보정 로직 추가', author: '박서준', date: '2026-06-22T14:41:00+09:00' },
  { hash: 'c5b4a3901', shortHash: 'c5b4a39', message: 'test: CommitList 빈 상태 분기 스냅샷 추가', author: 'Jane Cooper', date: '2026-06-21T15:05:00+09:00' },
  { hash: '88f7e6d23', shortHash: '88f7e6d', message: 'perf: git log 페이지네이션 200개 단위로 변경', author: '이수민', date: '2026-06-20T13:22:00+09:00' },
  { hash: '2c3d4e5f6', shortHash: '2c3d4e5', message: 'fix: EmptyState noResults CTA 미표시 처리', author: '김지훈', date: '2026-06-20T09:44:00+09:00' },
  { hash: 'a9b8c7d10', shortHash: 'a9b8c7d', message: 'feat: TopHeader 설정 아이콘 키보드 포커스 지원', author: '박서준', date: '2026-06-19T17:31:00+09:00' },
  { hash: '6f5e4d3c2', shortHash: '6f5e4d3', message: 'chore: VSCode 테마 토큰 매핑 정리', author: 'Jane Cooper', date: '2026-06-18T16:12:00+09:00' },
  { hash: 'd4c3b2a98', shortHash: 'd4c3b2a', message: 'refactor: CommitListItem aria-label 포맷 통일', author: '이수민', date: '2026-06-18T10:07:00+09:00' },
  { hash: '3e2d1c0b7', shortHash: '3e2d1c0', message: 'feat: 무한 스크롤 하단 로딩 스피너 추가', author: '김지훈', date: '2026-06-17T18:22:00+09:00' },
  { hash: 'b7a69581c', shortHash: 'b7a6958', message: "fix: 작성자 필터 '전체' 선택 시 해제되지 않는 버그", author: '박서준', date: '2026-06-16T08:55:00+09:00' },
  { hash: '5a4b3c2d1', shortHash: '5a4b3c2', message: 'feat: 커밋 해시 7자리 truncate 표시', author: 'Jane Cooper', date: '2026-06-15T12:35:00+09:00' },
  { hash: 'e9d8c7b65', shortHash: 'e9d8c7b', message: 'docs: design_tokens spacing 토큰 추가', author: '이수민', date: '2026-06-14T10:02:00+09:00' },
  { hash: '1f2e3d4c5', shortHash: '1f2e3d4', message: 'refactor: CommitList role=list 접근성 보강', author: '김지훈', date: '2026-06-13T19:19:00+09:00' },
  { hash: 'c8b7a6954', shortHash: 'c8b7a69', message: 'feat: KeywordSearchInput 초기화 버튼 추가', author: '박서준', date: '2026-06-12T14:58:00+09:00' },
  { hash: '4d5e6f7a8', shortHash: '4d5e6f7', message: 'fix: 날짜 필터 ISO 비교 타임존 이슈 해결', author: 'Jane Cooper', date: '2026-06-11T09:25:00+09:00' },
  { hash: 'a2b3c4d56', shortHash: 'a2b3c4d', message: 'feat: CommitFilterPanel active 상태 시각적 강조', author: '이수민', date: '2026-06-10T20:17:00+09:00' },
  { hash: '7e6f5a432', shortHash: '7e6f5a4', message: 'style: 필터 패널 border-bottom 구분선 추가', author: '김지훈', date: '2026-06-09T15:44:00+09:00' },
  { hash: 'd1c2b3a90', shortHash: 'd1c2b3a', message: 'test: KeywordSearchInput 디바운스 단위 테스트', author: '박서준', date: '2026-06-08T11:39:00+09:00' },
  { hash: '9a8b7c6d5', shortHash: '9a8b7c6', message: 'feat: 좁은 너비에서 필터 패널 토글 접기 지원', author: 'Jane Cooper', date: '2026-06-07T12:44:00+09:00' },
  { hash: '3c4d5e6f7', shortHash: '3c4d5e6', message: 'init: F01_CommitLog 컴포넌트 스캐폴딩', author: '김지훈', date: '2026-06-06T10:03:00+09:00' },
  { hash: 'f6e5d4c3b', shortHash: 'f6e5d4c', message: 'init: 프로젝트 초기 설정 및 VSCode 확장 부트스트랩', author: '이수민', date: '2026-06-05T16:52:00+09:00' },
];

const demoChangedFiles: ChangedFile[] = [
  { path: 'src/components/CommitList/CommitList.tsx', status: 'M', hasSavedSummary: true },
  { path: 'src/components/CommitList/CommitListItem.tsx', status: 'M', hasSavedSummary: false },
  { path: 'src/components/CommitList/useInfiniteScroll.ts', status: 'A', hasSavedSummary: true },
  { path: 'src/components/CommitFilter/CommitFilterPanel.tsx', status: 'M', hasSavedSummary: false },
  { path: 'src/hooks/useIntersectionObserver.ts', status: 'A', hasSavedSummary: false },
  { path: 'src/hooks/useScrollTrigger.ts', status: 'D', hasSavedSummary: false },
  { path: 'src/utils/pagination.ts', status: 'M', hasSavedSummary: true },
  { path: 'src/types/commit.ts', oldPath: 'src/types/git.ts', status: 'R', hasSavedSummary: false },
  { path: 'tests/CommitList.test.tsx', status: 'M', hasSavedSummary: false },
  { path: 'docs/F01_blueprint.md', status: 'M', hasSavedSummary: false },
];
