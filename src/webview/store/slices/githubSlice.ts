import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type {
  GithubAuthStatus,
  IssueDetail,
  IssueSummary,
  PullRequestDetail,
  PullRequestSummary,
} from '../../features/F12/types';
import type { AppState } from '../appStore';

const DEMO_DELAY_MS = 220;

export interface GithubDetailEntry<TDetail> {
  detail: TDetail | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

export const EMPTY_PR_DETAIL_STATE: GithubDetailEntry<PullRequestDetail> = {
  detail: null,
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const EMPTY_ISSUE_DETAIL_STATE: GithubDetailEntry<IssueDetail> = {
  detail: null,
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export interface GithubSlice {
  githubAuthStatus: GithubAuthStatus;
  hasCheckedGithubAuth: boolean;

  pullRequestList: PullRequestSummary[];
  isLoadingPullRequests: boolean;
  pullRequestsError: string | null;
  hasMorePullRequests: boolean;
  pullRequestPage: number;
  hasLoadedPullRequests: boolean;

  issueList: IssueSummary[];
  isLoadingIssues: boolean;
  issuesError: string | null;
  hasMoreIssues: boolean;
  issuePage: number;
  hasLoadedIssues: boolean;

  prDetailsByNumber: Record<number, GithubDetailEntry<PullRequestDetail>>;
  issueDetailsByNumber: Record<number, GithubDetailEntry<IssueDetail>>;

  fetchGithubAuthState: () => void;
  connectGithub: () => void;
  handleGithubAuthState: (status: GithubAuthStatus) => void;

  loadPullRequests: (reset?: boolean) => void;
  handlePullRequestsLoaded: (payload: { items: PullRequestSummary[]; hasMore: boolean; page: number }) => void;
  handlePullRequestsLoadFailed: (message?: string) => void;

  loadIssues: (reset?: boolean) => void;
  handleIssuesLoaded: (payload: { items: IssueSummary[]; hasMore: boolean; page: number }) => void;
  handleIssuesLoadFailed: (message?: string) => void;

  loadPRDetail: (number: number) => void;
  handlePRDetailLoaded: (detail: PullRequestDetail) => void;
  handlePRDetailLoadFailed: (payload: { number?: number; message?: string }) => void;

  loadIssueDetail: (number: number) => void;
  handleIssueDetailLoaded: (detail: IssueDetail) => void;
  handleIssueDetailLoadFailed: (payload: { number?: number; message?: string }) => void;
}

const demoPullRequests: PullRequestSummary[] = [
  { number: 42, title: 'fix: race condition in commit loader', author: 'ethan-heo', state: 'open', labels: ['bug'], updatedAt: '2026-07-08T09:12:00+09:00' },
  { number: 41, title: 'feat: add dependency canvas legend', author: 'jane-cooper', state: 'merged', labels: ['enhancement'], updatedAt: '2026-07-05T14:02:00+09:00' },
  { number: 39, title: 'chore: bump vite to 6', author: 'ethan-heo', state: 'closed', labels: [], updatedAt: '2026-07-01T11:20:00+09:00' },
];

const demoIssues: IssueSummary[] = [
  { number: 7, title: 'Crash on empty repository', author: 'jane-cooper', state: 'open', labels: ['bug', 'p1'], updatedAt: '2026-07-09T08:40:00+09:00' },
  { number: 5, title: 'Slow render on large diff', author: 'ethan-heo', state: 'open', labels: ['performance'], updatedAt: '2026-07-07T17:15:00+09:00' },
  { number: 3, title: 'Docs: update install guide', author: 'jane-cooper', state: 'closed', labels: ['docs'], updatedAt: '2026-06-28T10:00:00+09:00' },
];

function getDemoPRDetail(number: number): PullRequestDetail {
  const summary = demoPullRequests.find((pr) => pr.number === number) ?? demoPullRequests[0];

  return {
    ...summary,
    number,
    bodyMarkdown: '이 PR은 데모 데이터입니다.\n\n- 항목 1\n- 항목 2',
    comments: [
      { author: 'reviewer-a', bodyMarkdown: '질문이 있습니다. 이 부분 의도가 맞나요?', createdAt: '2026-07-08T10:00:00+09:00' },
    ],
    reviews: [
      { author: 'reviewer-b', state: 'APPROVED', bodyMarkdown: 'LGTM', submittedAt: '2026-07-08T11:00:00+09:00' },
    ],
  };
}

function getDemoIssueDetail(number: number): IssueDetail {
  const summary = demoIssues.find((issue) => issue.number === number) ?? demoIssues[0];

  return {
    ...summary,
    number,
    bodyMarkdown: '이 Issue는 데모 데이터입니다.',
    comments: [
      { author: 'ethan-heo', bodyMarkdown: '재현 방법을 확인했습니다.', createdAt: '2026-07-09T09:00:00+09:00' },
    ],
  };
}

function getPRDetailEntry(state: AppState, number: number): GithubDetailEntry<PullRequestDetail> {
  return state.prDetailsByNumber[number] ?? EMPTY_PR_DETAIL_STATE;
}

function getIssueDetailEntry(state: AppState, number: number): GithubDetailEntry<IssueDetail> {
  return state.issueDetailsByNumber[number] ?? EMPTY_ISSUE_DETAIL_STATE;
}

export const createGithubSlice: StateCreator<AppState, [], [], GithubSlice> = (set, get) => ({
  githubAuthStatus: 'unauthenticated',
  hasCheckedGithubAuth: false,

  pullRequestList: [],
  isLoadingPullRequests: false,
  pullRequestsError: null,
  hasMorePullRequests: true,
  pullRequestPage: 0,
  hasLoadedPullRequests: false,

  issueList: [],
  isLoadingIssues: false,
  issuesError: null,
  hasMoreIssues: true,
  issuePage: 0,
  hasLoadedIssues: false,

  prDetailsByNumber: {},
  issueDetailsByNumber: {},

  fetchGithubAuthState: () => {
    if (!isVSCodeRuntime()) {
      window.setTimeout(() => get().handleGithubAuthState('authenticated'), DEMO_DELAY_MS);
      return;
    }

    postMessage('FETCH_GITHUB_AUTH_STATE');
  },

  connectGithub: () => {
    if (!isVSCodeRuntime()) {
      get().handleGithubAuthState('authenticated');
      return;
    }

    postMessage('CONNECT_GITHUB');
  },

  handleGithubAuthState: (status) => {
    const wasAuthenticated = get().githubAuthStatus === 'authenticated';
    set({ githubAuthStatus: status, hasCheckedGithubAuth: true });

    if (status === 'authenticated' && !wasAuthenticated) {
      get().loadPullRequests(true);
      get().loadIssues(true);
    }
  },

  loadPullRequests: (reset = false) => {
    const state = get();

    if (state.isLoadingPullRequests) {
      return;
    }

    const page = reset ? 1 : state.pullRequestPage + 1;

    set({
      isLoadingPullRequests: true,
      pullRequestsError: reset ? null : state.pullRequestsError,
      ...(reset ? { pullRequestList: [], pullRequestPage: 0, hasMorePullRequests: true } : {}),
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handlePullRequestsLoaded({ items: reset ? demoPullRequests : [], hasMore: false, page });
      }, DEMO_DELAY_MS);
      return;
    }

    postMessage('FETCH_PULL_REQUESTS', { page });
  },

  handlePullRequestsLoaded: ({ items, hasMore, page }) => {
    const current = get();

    set({
      pullRequestList: page <= 1 ? items : [...current.pullRequestList, ...items],
      pullRequestPage: page,
      hasMorePullRequests: hasMore,
      isLoadingPullRequests: false,
      pullRequestsError: null,
      hasLoadedPullRequests: true,
    });
  },

  handlePullRequestsLoadFailed: (message = 'Failed to load pull requests') => {
    const hasExisting = get().pullRequestList.length > 0;

    set({
      isLoadingPullRequests: false,
      pullRequestsError: message,
      hasLoadedPullRequests: hasExisting || get().hasLoadedPullRequests,
    });
  },

  loadIssues: (reset = false) => {
    const state = get();

    if (state.isLoadingIssues) {
      return;
    }

    const page = reset ? 1 : state.issuePage + 1;

    set({
      isLoadingIssues: true,
      issuesError: reset ? null : state.issuesError,
      ...(reset ? { issueList: [], issuePage: 0, hasMoreIssues: true } : {}),
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleIssuesLoaded({ items: reset ? demoIssues : [], hasMore: false, page });
      }, DEMO_DELAY_MS);
      return;
    }

    postMessage('FETCH_ISSUES', { page });
  },

  handleIssuesLoaded: ({ items, hasMore, page }) => {
    const current = get();

    set({
      issueList: page <= 1 ? items : [...current.issueList, ...items],
      issuePage: page,
      hasMoreIssues: hasMore,
      isLoadingIssues: false,
      issuesError: null,
      hasLoadedIssues: true,
    });
  },

  handleIssuesLoadFailed: (message = 'Failed to load issues') => {
    const hasExisting = get().issueList.length > 0;

    set({
      isLoadingIssues: false,
      issuesError: message,
      hasLoadedIssues: hasExisting || get().hasLoadedIssues,
    });
  },

  loadPRDetail: (number) => {
    const state = get();
    const entry = getPRDetailEntry(state, number);

    if (entry.isLoading || (entry.hasLoaded && !entry.error)) {
      return;
    }

    set((current) => ({
      prDetailsByNumber: {
        ...current.prDetailsByNumber,
        [number]: { ...getPRDetailEntry(current, number), isLoading: true, error: null },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => get().handlePRDetailLoaded(getDemoPRDetail(number)), DEMO_DELAY_MS);
      return;
    }

    postMessage('FETCH_PR_DETAIL', { number });
  },

  handlePRDetailLoaded: (detail) => {
    set((current) => ({
      prDetailsByNumber: {
        ...current.prDetailsByNumber,
        [detail.number]: { detail, isLoading: false, error: null, hasLoaded: true },
      },
    }));
  },

  handlePRDetailLoadFailed: ({ number, message = 'Failed to load pull request' }) => {
    if (number == null) {
      return;
    }

    set((current) => ({
      prDetailsByNumber: {
        ...current.prDetailsByNumber,
        [number]: { detail: null, isLoading: false, error: message, hasLoaded: true },
      },
    }));
  },

  loadIssueDetail: (number) => {
    const state = get();
    const entry = getIssueDetailEntry(state, number);

    if (entry.isLoading || (entry.hasLoaded && !entry.error)) {
      return;
    }

    set((current) => ({
      issueDetailsByNumber: {
        ...current.issueDetailsByNumber,
        [number]: { ...getIssueDetailEntry(current, number), isLoading: true, error: null },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => get().handleIssueDetailLoaded(getDemoIssueDetail(number)), DEMO_DELAY_MS);
      return;
    }

    postMessage('FETCH_ISSUE_DETAIL', { number });
  },

  handleIssueDetailLoaded: (detail) => {
    set((current) => ({
      issueDetailsByNumber: {
        ...current.issueDetailsByNumber,
        [detail.number]: { detail, isLoading: false, error: null, hasLoaded: true },
      },
    }));
  },

  handleIssueDetailLoadFailed: ({ number, message = 'Failed to load issue' }) => {
    if (number == null) {
      return;
    }

    set((current) => ({
      issueDetailsByNumber: {
        ...current.issueDetailsByNumber,
        [number]: { detail: null, isLoading: false, error: message, hasLoaded: true },
      },
    }));
  },
});
