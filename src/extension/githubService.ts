import simpleGit from 'simple-git';
import * as vscode from 'vscode';
import type {
  FetchListResult,
  GithubAuthStatus,
  IssueDetail,
  IssueSummary,
  PullRequestDetail,
  PullRequestSummary,
} from './githubTypes';
import type { Commit } from './gitService';

const GITHUB_SCOPES = ['repo'];
const LIST_PER_PAGE = 30;
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

interface RawPullRequestCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string | null;
      date: string | null;
    } | null;
  };
}

interface RawTimelineEvent {
  event: string;
  commit_id?: string | null;
}

interface RawCommitDetail {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string | null;
      date: string | null;
    } | null;
  };
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

function toCommit(raw: RawPullRequestCommit | RawCommitDetail): Commit {
  return {
    hash: raw.sha,
    shortHash: raw.sha.slice(0, 7),
    message: raw.commit.message.split('\n')[0] ?? '',
    author: raw.commit.author?.name ?? 'unknown',
    date: raw.commit.author?.date ?? '',
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
  const pr = await githubApiRequest<RawPullRequest>(token, `/repos/${repoRef.owner}/${repoRef.repo}/pulls/${number}`);

  return {
    ...toPullRequestSummary(pr),
    bodyMarkdown: pr.body ?? '',
  };
}

export async function fetchIssueDetail(repoPath: string, number: number): Promise<IssueDetail> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const issue = await githubApiRequest<RawIssue>(token, `/repos/${repoRef.owner}/${repoRef.repo}/issues/${number}`);

  return {
    ...toIssueSummary(issue),
    bodyMarkdown: issue.body ?? '',
  };
}

export async function fetchPullRequestCommits(repoPath: string, number: number, page = 1): Promise<FetchListResult<Commit>> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const raw = await githubApiRequest<RawPullRequestCommit[]>(
    token,
    `/repos/${repoRef.owner}/${repoRef.repo}/pulls/${number}/commits?per_page=${LIST_PER_PAGE}&page=${page}`,
  );

  return {
    items: raw.map(toCommit),
    hasMore: raw.length >= LIST_PER_PAGE,
  };
}

export async function fetchIssueRelatedCommits(repoPath: string, number: number, page = 1): Promise<FetchListResult<Commit>> {
  const repoRef = await resolveGithubRepo(repoPath);

  if (!repoRef) {
    throw new GithubNoRemoteError();
  }

  const token = await requireAccessToken();
  const rawTimeline = await githubApiRequest<RawTimelineEvent[]>(
    token,
    `/repos/${repoRef.owner}/${repoRef.repo}/issues/${number}/timeline?per_page=${LIST_PER_PAGE}&page=${page}`,
  );

  const commitIds = Array.from(
    new Set(
      rawTimeline
        .filter((event) => (event.event === 'closed' || event.event === 'referenced') && Boolean(event.commit_id))
        .map((event) => event.commit_id as string),
    ),
  );

  const commitDetails = await Promise.all(
    commitIds.map((sha) => githubApiRequest<RawCommitDetail>(token, `/repos/${repoRef.owner}/${repoRef.repo}/commits/${sha}`)),
  );

  return {
    items: commitDetails.map(toCommit),
    hasMore: rawTimeline.length >= LIST_PER_PAGE,
  };
}
