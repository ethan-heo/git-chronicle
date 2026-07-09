import type { StateCreator } from 'zustand';
import { mergePersistedWebviewState, readPersistedWebviewState } from '../../bridge/persistedWebviewState';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { Commit, FilterState } from '../../types/commit';
import type { AppState } from '../appStore';

const PAGE_SIZE = 200;
const DEMO_PAGE_SIZE = 12;
const DEFAULT_FILTER_STATE: FilterState = {
  filterDateStart: null,
  filterDateEnd: null,
  filterAuthor: null,
  filterKeyword: '',
  filterExcludeKeyword: '',
  sortOrder: 'desc',
};

interface CommitsLoadedPayload {
  commits: Commit[];
  page: number;
  pageSize: number;
  hasMore?: boolean;
  requestId?: number;
}

export interface CommitListSlice extends FilterState {
  commitList: Commit[];
  authorList: string[];
  commitPage: number;
  hasMoreCommits: boolean;
  isLoadingCommits: boolean;
  isGitRepoDetected: boolean;
  lastRequestId: number;
  pendingRequestId: number | null;
  hasPendingCommitReload: boolean;
  commitLoadError: string | null;
  loadMoreError: string | null;
  hasLoadedCommits: boolean;
  commitListScrollTop: number;

  loadCommits: (reset?: boolean) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilters: () => void;
  openRepository: () => void;
  handleCommitsLoaded: (payload: CommitsLoadedPayload) => void;
  handleRepositoryNotFound: () => void;
  handleCommitsLoadFailed: (message?: string) => void;
  setCommitListScrollTop: (top: number) => void;
}

function persistFilterState(state: FilterState): void {
  mergePersistedWebviewState({
    filter: {
      filterDateStart: state.filterDateStart,
      filterDateEnd: state.filterDateEnd,
      filterAuthor: state.filterAuthor,
      filterKeyword: state.filterKeyword,
      filterExcludeKeyword: state.filterExcludeKeyword,
      sortOrder: state.sortOrder,
    },
  });
}

function extractAuthors(commits: Commit[]): string[] {
  return [...new Set(commits.map((commit) => commit.author).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getDemoCommitsPage(state: FilterState, page: number, pageSize: number): Commit[] {
  const filtered = filterDemoCommits(state);
  const start = page * pageSize;
  const end = start + pageSize;

  return filtered.slice(start, end);
}

function filterDemoCommits(state: FilterState): Commit[] {
  const keyword = state.filterKeyword.trim().toLowerCase();
  const excludeKeywords = state.filterExcludeKeyword
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const filtered = demoCommits.filter((commit) => {
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

    if (excludeKeywords.some((excludeKeyword) => commit.message.toLowerCase().includes(excludeKeyword))) {
      return false;
    }

    return true;
  });

  return sortDemoCommits(filtered, state.sortOrder);
}

function sortDemoCommits(commits: Commit[], sortOrder: FilterState['sortOrder']): Commit[] {
  const sorted = [...commits].sort((left, right) => left.date.localeCompare(right.date));

  return sortOrder === 'asc' ? sorted : sorted.reverse();
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

export const createCommitListSlice: StateCreator<AppState, [], [], CommitListSlice> = (set, get) => ({
  ...DEFAULT_FILTER_STATE,
  ...readPersistedWebviewState().filter,
  commitList: [],
  authorList: [],
  commitPage: 0,
  hasMoreCommits: true,
  isLoadingCommits: false,
  isGitRepoDetected: true,
  lastRequestId: 0,
  pendingRequestId: null,
  hasPendingCommitReload: false,
  commitLoadError: null,
  loadMoreError: null,
  hasLoadedCommits: false,
  commitListScrollTop: 0,

  loadCommits: (reset = false) => {
    const state = get();

    if (state.isLoadingCommits) {
      if (reset) {
        set({ hasPendingCommitReload: true });
      }
      return;
    }

    const page = reset ? 0 : state.commitPage;
    const requestId = state.lastRequestId + 1;

    set({
      isLoadingCommits: true,
      lastRequestId: requestId,
      pendingRequestId: requestId,
      hasPendingCommitReload: false,
      commitLoadError: reset ? null : state.commitLoadError,
      loadMoreError: null,
      isGitRepoDetected: true,
      ...(reset ? { commitList: [], commitPage: 0, hasMoreCommits: true } : {}),
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        const commits = getDemoCommitsPage(get(), page, DEMO_PAGE_SIZE);
        get().handleCommitsLoaded({ commits, page, pageSize: DEMO_PAGE_SIZE, hasMore: commits.length >= DEMO_PAGE_SIZE, requestId });
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
      filterExcludeKeyword: state.filterExcludeKeyword,
      sortOrder: state.sortOrder,
      requestId,
    });
  },

  setFilter: (filter) => {
    set(filter);
    set({ commitListScrollTop: 0 });
    persistFilterState(get());
    get().loadCommits(true);
  },

  clearFilters: () => {
    set(DEFAULT_FILTER_STATE);
    set({ commitListScrollTop: 0 });
    persistFilterState(get());
    get().loadCommits(true);
  },

  openRepository: () => postMessage('OPEN_REPOSITORY'),

  handleCommitsLoaded: ({ commits, page, pageSize, hasMore, requestId }) => {
    const current = get();
    if (requestId !== undefined && current.pendingRequestId !== requestId) {
      return;
    }

    const nextCommitList = page === 0 ? commits : [...current.commitList, ...commits];

    set({
      commitList: nextCommitList,
      authorList: extractAuthors(nextCommitList),
      commitPage: page + 1,
      hasMoreCommits: hasMore ?? commits.length >= pageSize,
      isLoadingCommits: false,
      isGitRepoDetected: true,
      commitLoadError: null,
      loadMoreError: null,
      hasLoadedCommits: true,
      pendingRequestId: null,
    });

    if (get().hasPendingCommitReload) {
      set({ hasPendingCommitReload: false });
      get().loadCommits(true);
    }
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

  handleCommitsLoadFailed: (message = 'Failed to load commit list') => {
    const hasExistingCommits = get().commitList.length > 0;

    set({
      isLoadingCommits: false,
      commitLoadError: hasExistingCommits ? null : message,
      loadMoreError: hasExistingCommits ? message : null,
      hasLoadedCommits: true,
    });
  },

  setCommitListScrollTop: (top) => {
    set({ commitListScrollTop: top });
  },
});
