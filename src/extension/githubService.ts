import simpleGit from 'simple-git';
import * as vscode from 'vscode';
import type {
  CommentSummary,
  FetchListResult,
  GithubAuthStatus,
  IssueDetail,
  IssueSummary,
  PullRequestDetail,
  PullRequestSummary,
  ReviewSummary,
} from './githubTypes';

const GITHUB_SCOPES = ['repo'];
const LIST_PER_PAGE = 30;
const DETAIL_PER_PAGE = 100;
const GITHUB_API_BASE_URL = 'https://api.github.com';

export class GithubNoRemoteError extends Error {
  constructor() {
    super('No GitHub remote was found for this repository');
    this.name = 'GithubNoRemoteError';
  }
}

export class GithubAuthRequiredError extends Error {
  constructor() {
    super('GitHub authentication is required');
    this.name = 'GithubAuthRequiredError';
  }
}

export class GithubRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubRequestError';
  }
}

interface RawUser {
  login: string;
}

interface RawLabel {
  name: string;
}

interface RawPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged_at: string | null;
  user: RawUser | null;
  labels: RawLabel[];
  updated_at: string;
  body: string | null;
}

interface RawIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: RawUser | null;
  labels: (RawLabel | string)[];
  updated_at: string;
  body: string | null;
  pull_request?: unknown;
}

interface RawComment {
  user: RawUser | null;
  body: string | null;
  created_at: string;
}

interface RawReview {
  user: RawUser | null;
  state: string;
  body: string | null;
  submitted_at: string | null;
}

export async function resolveGithubRepo(repoPath: string): Promise<{ owner: string; repo: string } | null> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    return null;
  }

  const remotes = await git.getRemotes(true);
  const origin = remotes.find((remote) => remote.name === 'origin') ?? remotes[0];
  const url = origin?.refs?.fetch || origin?.refs?.push;

  return url ? parseGithubRemoteUrl(url) : null;
}

function parseGithubRemoteUrl(url: string): { owner: string; repo: string } | null {
  const match = /github\.com[/:]([^/]+)\/([^/.]+?)(\.git)?\/?$/.exec(url.trim());

  return match ? { owner: match[1], repo: match[2] } : null;
}

async function getGithubSession(createIfNone: boolean): Promise<vscode.AuthenticationSession | undefined> {
  return vscode.authentication.getSession('github', GITHUB_SCOPES, createIfNone ? { createIfNone: true } : { createIfNone: false, silent: true });
}

export async function getGithubAuthStatus(repoPath: string): Promise<GithubAuthStatus> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    return 'no-remote';
  }

  const session = await getGithubSession(false);
  return session ? 'authenticated' : 'unauthenticated';
}

export async function connectToGithub(repoPath: string): Promise<GithubAuthStatus> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    return 'no-remote';
  }

  const session = await getGithubSession(true);
  return session ? 'authenticated' : 'unauthenticated';
}

async function requireAccessToken(): Promise<string> {
  // Data-fetch calls assume the caller already confirmed 'authenticated' via getGithubAuthStatus.
  // Use a silent, non-prompting check here so a background fetch never pops a surprise login dialog —
  // only the explicit connectToGithub() flow (CONNECT_GITHUB message) is allowed to prompt.
  const session = await getGithubSession(false);

  if (!session) {
    throw new GithubAuthRequiredError();
  }

  return session.accessToken;
}

async function githubApiRequest<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'GitChronicle-VSCode-Extension',
    },
  });

  if (!response.ok) {
    throw new GithubRequestError(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function toPullRequestSummary(raw: RawPullRequest): PullRequestSummary {
  return {
    number: raw.number,
    title: raw.title,
    author: raw.user?.login ?? 'unknown',
    state: raw.merged_at ? 'merged' : raw.state,
    labels: raw.labels.map((label) => label.name),
    updatedAt: raw.updated_at,
  };
}

function toIssueSummary(raw: RawIssue): IssueSummary {
  return {
    number: raw.number,
    title: raw.title,
    author: raw.user?.login ?? 'unknown',
    state: raw.state,
    labels: raw.labels.map((label) => (typeof label === 'string' ? label : label.name)),
    updatedAt: raw.updated_at,
  };
}

function toCommentSummary(raw: RawComment): CommentSummary {
  return {
    author: raw.user?.login ?? 'unknown',
    bodyMarkdown: raw.body ?? '',
    createdAt: raw.created_at,
  };
}

function toReviewSummary(raw: RawReview): ReviewSummary | null {
  if (raw.state !== 'APPROVED' && raw.state !== 'CHANGES_REQUESTED' && raw.state !== 'COMMENTED') {
    return null;
  }

  return {
    author: raw.user?.login ?? 'unknown',
    state: raw.state,
    bodyMarkdown: raw.body ?? '',
    submittedAt: raw.submitted_at ?? '',
  };
}

export async function fetchPullRequests(repoPath: string, page = 1): Promise<FetchListResult<PullRequestSummary>> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const raw = await githubApiRequest<RawPullRequest[]>(
    token,
    `/repos/${repoRef.owner}/${repoRef.repo}/pulls?state=all&sort=updated&direction=desc&per_page=${LIST_PER_PAGE}&page=${page}`,
  );

  return {
    items: raw.map(toPullRequestSummary),
    hasMore: raw.length >= LIST_PER_PAGE,
  };
}

export async function fetchIssues(repoPath: string, page = 1): Promise<FetchListResult<IssueSummary>> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const raw = await githubApiRequest<RawIssue[]>(
    token,
    `/repos/${repoRef.owner}/${repoRef.repo}/issues?state=all&sort=updated&direction=desc&per_page=${LIST_PER_PAGE}&page=${page}`,
  );

  return {
    items: raw.filter((item) => !item.pull_request).map(toIssueSummary),
    hasMore: raw.length >= LIST_PER_PAGE,
  };
}

export async function fetchPullRequestDetail(repoPath: string, number: number): Promise<PullRequestDetail> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const [pr, comments, reviews] = await Promise.all([
    githubApiRequest<RawPullRequest>(token, `/repos/${repoRef.owner}/${repoRef.repo}/pulls/${number}`),
    githubApiRequest<RawComment[]>(token, `/repos/${repoRef.owner}/${repoRef.repo}/issues/${number}/comments?per_page=${DETAIL_PER_PAGE}`),
    githubApiRequest<RawReview[]>(token, `/repos/${repoRef.owner}/${repoRef.repo}/pulls/${number}/reviews?per_page=${DETAIL_PER_PAGE}`),
  ]);

  return {
    ...toPullRequestSummary(pr),
    bodyMarkdown: pr.body ?? '',
    comments: comments.map(toCommentSummary),
    reviews: reviews.map(toReviewSummary).filter((review): review is ReviewSummary => review !== null),
  };
}

export async function fetchIssueDetail(repoPath: string, number: number): Promise<IssueDetail> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const [issue, comments] = await Promise.all([
    githubApiRequest<RawIssue>(token, `/repos/${repoRef.owner}/${repoRef.repo}/issues/${number}`),
    githubApiRequest<RawComment[]>(token, `/repos/${repoRef.owner}/${repoRef.repo}/issues/${number}/comments?per_page=${DETAIL_PER_PAGE}`),
  ]);

  return {
    ...toIssueSummary(issue),
    bodyMarkdown: issue.body ?? '',
    comments: comments.map(toCommentSummary),
  };
}
