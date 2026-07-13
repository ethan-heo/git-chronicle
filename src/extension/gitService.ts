import simpleGit, { type SimpleGit } from 'simple-git';
import { loadCommitSummary } from './summaryFileService';

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export type FileStatus = 'A' | 'M' | 'D' | 'R';

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: FileStatus;
}

export interface FetchChangedFilesResult {
  files: ChangedFile[];
  hasSavedCommitSummary: boolean;
}

export interface FetchCommitsOptions {
  repoPath: string;
  page: number;
  pageSize?: number;
  dateStart?: string | null;
  dateEnd?: string | null;
  author?: string | null;
  keyword?: string;
  sortOrder?: 'desc' | 'asc';
  excludeKeywords?: string[];
}

export interface FetchCommitCountOptions {
  repoPath: string;
  dateStart?: string | null;
  dateEnd?: string | null;
  author?: string | null;
  keyword?: string;
}

export interface FileDiffResult {
  rawDiff: string;
  isBinary: boolean;
  isDeleted: boolean;
}

const DEFAULT_PAGE_SIZE = 200;
const FIELD_SEPARATOR = '\x1f';
const RECORD_SEPARATOR = '\x1e';

export class GitRepositoryNotFoundError extends Error {
  constructor(repoPath: string) {
    super(`Git repository was not found at ${repoPath}`);
    this.name = 'GitRepositoryNotFoundError';
  }
}

export class GitCommitNotFoundError extends Error {
  constructor(commitHash: string) {
    super(`This commit does not exist in the local repository: ${commitHash}`);
    this.name = 'GitCommitNotFoundError';
  }
}

export interface FetchCommitsResult {
  commits: Commit[];
  rawCount: number;
}

export async function fetchCommits(options: FetchCommitsOptions): Promise<FetchCommitsResult> {
  const git = simpleGit(options.repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(options.repoPath);
  }

  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const shouldReverse = options.sortOrder === 'asc';
  const args = ['log', '--date=iso-strict', `--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%aI%x1e`];

  if (!shouldReverse) {
    args.push(`--max-count=${pageSize}`);
    args.push(`--skip=${Math.max(options.page, 0) * pageSize}`);
  }

  if (options.dateStart) {
    args.push(`--after=${options.dateStart}`);
  }

  if (options.dateEnd) {
    args.push(`--before=${options.dateEnd}T23:59:59`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  if (options.keyword?.trim()) {
    args.push('--regexp-ignore-case');
    args.push(`--grep=${options.keyword.trim()}`);
  }

  if (shouldReverse) {
    args.push('--reverse');
  }

  const output = await git.raw(args);
  const rawCommits = output
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, shortHash, message, author, date] = record.split(FIELD_SEPARATOR);

      return {
        hash,
        shortHash,
        message,
        author,
        date,
      };
    });

  const commits = rawCommits
    .filter((commit) => {
      const excludeKeywords = options.excludeKeywords?.filter(Boolean).map((item) => item.toLowerCase()) ?? [];

      if (excludeKeywords.length === 0) {
        return true;
      }

      const message = commit.message.toLowerCase();

      return !excludeKeywords.some((keyword) => message.includes(keyword));
    });

  if (!shouldReverse) {
    return { commits, rawCount: rawCommits.length };
  }

  const start = Math.max(options.page, 0) * pageSize;
  const end = start + pageSize;

  return { commits: commits.slice(start, end), rawCount: rawCommits.length };
}

export async function fetchCommitCount(options: FetchCommitCountOptions): Promise<number> {
  const git = simpleGit(options.repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(options.repoPath);
  }

  const args = ['rev-list', '--count', 'HEAD'];

  if (options.dateStart) {
    args.push(`--after=${options.dateStart}`);
  }

  if (options.dateEnd) {
    args.push(`--before=${options.dateEnd}T23:59:59`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  if (options.keyword?.trim()) {
    args.push('--regexp-ignore-case');
    args.push(`--grep=${options.keyword.trim()}`);
  }

  const output = await git.raw(args);
  return Number.parseInt(output.trim(), 10) || 0;
}

export async function fetchChangedFiles(repoPath: string, commitHash: string, savePath: string | null, commitMessage?: string): Promise<FetchChangedFilesResult> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  await ensureCommitExistsLocallyOrFetch(git, commitHash);

  const output = await git.raw(['diff-tree', '--no-commit-id', '--name-status', '-r', '--root', commitHash]);

  return {
    files: output
      .split('\n')
      .map((line) => parseChangedFileLine(line))
      .filter((file): file is ChangedFile => Boolean(file)),
    hasSavedCommitSummary: Boolean(savePath && loadCommitSummary(savePath, commitHash, commitMessage)),
  };
}

async function ensureCommitExistsLocallyOrFetch(git: SimpleGit, commitHash: string): Promise<void> {
  try {
    await ensureCommitExists(git, commitHash);
  } catch {
    await fetchLatestRemoteRefs(git);
    await ensureCommitExists(git, commitHash);
  }
}

async function ensureCommitExists(git: SimpleGit, commitHash: string): Promise<void> {
  try {
    await git.revparse([`${commitHash}^{commit}`]);
  } catch {
    throw new GitCommitNotFoundError(commitHash);
  }
}

async function fetchLatestRemoteRefs(git: SimpleGit): Promise<void> {
  const remotes = await git.getRemotes(true);
  const primaryRemote = remotes.find((remote) => remote.name === 'origin') ?? remotes[0];

  if (!primaryRemote?.name) {
    return;
  }

  await git.fetch(primaryRemote.name);
}

export async function fetchFileDiff(repoPath: string, commitHash: string, filePath: string): Promise<FileDiffResult> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  await ensureCommitExistsLocallyOrFetch(git, commitHash);

  const rawDiff = await git.show(['--format=', '--find-renames', '--unified=99999', commitHash, '--', filePath]);
  const isBinary = /^Binary files? /m.test(rawDiff) || /^GIT binary patch$/m.test(rawDiff);
  const isDeleted = /^deleted file mode /m.test(rawDiff);

  return {
    rawDiff: isBinary ? '' : rawDiff,
    isBinary,
    isDeleted,
  };
}

export async function fetchFileContentAtCommit(repoPath: string, commitHash: string, filePath: string): Promise<string | null> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  try {
    return await git.show([`${commitHash}:${filePath}`]);
  } catch {
    return null;
  }
}

export async function fetchCommitFullDiff(repoPath: string, commitHash: string): Promise<string> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  return git.show([commitHash, '--stat', '-p', '--find-renames', '--unified=3']);
}

function parseChangedFileLine(line: string): ChangedFile | null {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const [rawStatus, firstPath, secondPath] = trimmed.split('\t');
  const status = normalizeStatus(rawStatus);

  if (!status || !firstPath) {
    return null;
  }

  const filePath = status === 'R' ? secondPath : firstPath;

  if (!filePath) {
    return null;
  }

  return {
    path: filePath,
    oldPath: status === 'R' ? firstPath : undefined,
    status,
  };
}

function normalizeStatus(rawStatus: string): FileStatus | null {
  const status = rawStatus.charAt(0);

  if (status === 'A' || status === 'M' || status === 'D' || status === 'R') {
    return status;
  }

  return null;
}
