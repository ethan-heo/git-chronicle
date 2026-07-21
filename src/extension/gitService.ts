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
  branch?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  author?: string | null;
  keyword?: string;
  sortOrder?: 'desc' | 'asc';
  excludeKeywords?: string[];
  commitHashes?: string[];
}

export interface FetchCommitCountOptions {
  repoPath: string;
  branch?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  author?: string | null;
  keyword?: string;
  excludeKeywords?: string[];
}

export interface FileDiffResult {
  rawDiff: string;
  isBinary: boolean;
  isDeleted: boolean;
}

export interface Branch {
  name: string;
  scope: 'local' | 'remote';
  isCurrent: boolean;
  upstream: string | null;
  ahead: number;
  behind: number;
}

const DEFAULT_PAGE_SIZE = 200;
const FIELD_SEPARATOR = '\x1f';
const RECORD_SEPARATOR = '\x1e';
const BRANCH_FIELD_SEPARATOR = '\t';
const COMMIT_HASH_PATTERN = /[0-9a-f]{4,40}/gi;

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
  const isGroupScoped = Boolean(options.commitHashes?.length);
  const keyword = options.keyword?.trim() ?? '';

  if (!isGroupScoped && keyword) {
    return fetchCommitsByKeyword(git, {
      ...options,
      keyword,
      pageSize,
      sortOrder: options.sortOrder,
    });
  }

  const args = ['log', '--date=iso-strict', `--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%aI%x1e`];

  if (isGroupScoped) {
    // 그룹은 사용자가 직접 고른 소규모 집합이므로 페이지네이션 없이 --no-walk로 지정된 커밋만 조회한다.
    args.push('--no-walk=sorted');
  } else if (!shouldReverse) {
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

  if (keyword) {
    args.push('--regexp-ignore-case');
    args.push(`--grep=${keyword}`);
  }

  if (shouldReverse) {
    args.push('--reverse');
  }

  if (isGroupScoped) {
    args.push(...options.commitHashes!);
  } else if (options.branch?.trim()) {
    args.push(options.branch.trim());
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
    .filter((commit) => matchesExcludeKeywords(commit, options.excludeKeywords));

  if (isGroupScoped || !shouldReverse) {
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

  const keyword = options.keyword?.trim() ?? '';

  if (keyword) {
    const result = await fetchCommitsByKeyword(git, {
      repoPath: options.repoPath,
      page: 0,
      pageSize: Number.MAX_SAFE_INTEGER,
      branch: options.branch,
      dateStart: options.dateStart,
      dateEnd: options.dateEnd,
      author: options.author,
      keyword,
      sortOrder: 'desc',
      excludeKeywords: options.excludeKeywords,
    });

    return result.rawCount;
  }

  const args = ['rev-list', '--count', options.branch?.trim() || 'HEAD'];

  if (options.dateStart) {
    args.push(`--after=${options.dateStart}`);
  }

  if (options.dateEnd) {
    args.push(`--before=${options.dateEnd}T23:59:59`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  const output = await git.raw(args);
  return Number.parseInt(output.trim(), 10) || 0;
}

async function fetchCommitsByKeyword(
  git: SimpleGit,
  options: FetchCommitsOptions & { keyword: string; pageSize: number },
): Promise<FetchCommitsResult> {
  const shouldReverse = options.sortOrder === 'asc';
  const messageMatches = await runLogQuery(git, {
    branch: options.branch,
    dateStart: options.dateStart,
    dateEnd: options.dateEnd,
    author: options.author,
    keyword: options.keyword,
    reverse: shouldReverse,
  });

  const commitsByHash = new Map(messageMatches.map((commit) => [commit.hash, commit]));

  const hashKeywords = extractCommitHashKeywords(options.keyword);

  if (hashKeywords.length > 0) {
    const hashCandidates = await listCommitHashes(git, {
      dateStart: options.dateStart,
      dateEnd: options.dateEnd,
      author: options.author,
    });

    const matchingHashes = hashCandidates.filter((hash) => hashKeywords.some((candidate) => hash.startsWith(candidate)));

    if (matchingHashes.length > 0) {
      const hashMatches = await runLogQuery(git, {
        branch: null,
        reverse: shouldReverse,
        commitHashes: matchingHashes,
      });

      for (const commit of hashMatches) {
        commitsByHash.set(commit.hash, commit);
      }
    }
  }

  const commits = [...commitsByHash.values()].filter((commit) => matchesExcludeKeywords(commit, options.excludeKeywords));
  const sortedCommits = sortCommits(commits, options.sortOrder ?? 'desc');
  const start = Math.max(options.page, 0) * options.pageSize;
  const end = start + options.pageSize;

  return {
    commits: sortedCommits.slice(start, end),
    rawCount: sortedCommits.length,
  };
}

async function runLogQuery(
  git: SimpleGit,
  options: {
    branch?: string | null;
    dateStart?: string | null;
    dateEnd?: string | null;
    author?: string | null;
    keyword?: string;
    reverse?: boolean;
    commitHashes?: string[];
  },
): Promise<Commit[]> {
  const args = ['log', '--date=iso-strict', `--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%aI%x1e`];

  if (options.dateStart) {
    args.push(`--after=${options.dateStart}`);
  }

  if (options.dateEnd) {
    args.push(`--before=${options.dateEnd}T23:59:59`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  if (options.keyword) {
    args.push('--regexp-ignore-case');
    args.push(`--grep=${options.keyword}`);
  }

  if (options.reverse) {
    args.push('--reverse');
  }

  if (options.commitHashes?.length) {
    args.push('--no-walk=sorted');
    args.push(...options.commitHashes);
  } else if (options.branch?.trim()) {
    args.push(options.branch.trim());
  }

  const output = await git.raw(args);
  return parseCommitRecords(output);
}

async function listCommitHashes(
  git: SimpleGit,
  options: {
    dateStart?: string | null;
    dateEnd?: string | null;
    author?: string | null;
  },
): Promise<string[]> {
  const args = ['rev-list', '--all'];

  if (options.dateStart) {
    args.push(`--after=${options.dateStart}`);
  }

  if (options.dateEnd) {
    args.push(`--before=${options.dateEnd}T23:59:59`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  const output = await git.raw(args);
  return output
    .split('\n')
    .map((hash) => hash.trim().toLowerCase())
    .filter(Boolean);
}

function parseCommitRecords(output: string): Commit[] {
  return output
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
}

function sortCommits(commits: Commit[], sortOrder: 'desc' | 'asc'): Commit[] {
  const sorted = [...commits].sort((left, right) => left.date.localeCompare(right.date));
  return sortOrder === 'asc' ? sorted : sorted.reverse();
}

function extractCommitHashKeywords(keyword: string): string[] {
  return [...new Set((keyword.toLowerCase().match(COMMIT_HASH_PATTERN) ?? []).map((value) => value.trim()).filter(Boolean))];
}

function matchesExcludeKeywords(commit: Commit, excludeKeywords?: string[]): boolean {
  const normalizedKeywords = excludeKeywords?.filter(Boolean).map((item) => item.toLowerCase()) ?? [];

  if (normalizedKeywords.length === 0) {
    return true;
  }

  const message = commit.message.toLowerCase();
  return !normalizedKeywords.some((keyword) => message.includes(keyword));
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

  await git.raw([
    'fetch',
    '--prune',
    primaryRemote.name,
    `+refs/heads/*:refs/remotes/${primaryRemote.name}/*`,
  ]);
}

function parseTrack(track: string | undefined): Pick<Branch, 'ahead' | 'behind'> {
  if (!track) {
    return { ahead: 0, behind: 0 };
  }

  const aheadMatch = track.match(/ahead (\d+)/);
  const behindMatch = track.match(/behind (\d+)/);

  return {
    ahead: aheadMatch ? Number.parseInt(aheadMatch[1], 10) : 0,
    behind: behindMatch ? Number.parseInt(behindMatch[1], 10) : 0,
  };
}

function parseBranchRecords(output: string, scope: Branch['scope']): Branch[] {
  return output
    .split('\n')
    .map((record) => record.trimEnd())
    .filter(Boolean)
    .map((record) => {
      const [headMarker, name, upstream, track, symref] = record.split(BRANCH_FIELD_SEPARATOR);

      if (!name || symref || name.endsWith('/HEAD')) {
        return null;
      }

      const { ahead, behind } = parseTrack(track);

      return {
        name,
        scope,
        isCurrent: scope === 'local' && headMarker === '*',
        upstream: upstream || null,
        ahead: scope === 'local' ? ahead : 0,
        behind: scope === 'local' ? behind : 0,
      } satisfies Branch;
    })
    .filter((branch): branch is Branch => Boolean(branch));
}

export async function fetchBranches(repoPath: string, options: { refresh?: boolean } = {}): Promise<Branch[]> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  if (options.refresh) {
    await fetchLatestRemoteRefs(git);
  }

  const localOutput = await git.raw([
    'for-each-ref',
    `--format=%(HEAD)${BRANCH_FIELD_SEPARATOR}%(refname:short)${BRANCH_FIELD_SEPARATOR}%(upstream:short)${BRANCH_FIELD_SEPARATOR}%(upstream:track)${BRANCH_FIELD_SEPARATOR}%(symref)`,
    'refs/heads',
  ]);
  const remoteOutput = await git.raw([
    'for-each-ref',
    `--format=%(HEAD)${BRANCH_FIELD_SEPARATOR}%(refname:short)${BRANCH_FIELD_SEPARATOR}%(upstream:short)${BRANCH_FIELD_SEPARATOR}%(upstream:track)${BRANCH_FIELD_SEPARATOR}%(symref)`,
    'refs/remotes',
  ]);

  return [...parseBranchRecords(localOutput, 'local'), ...parseBranchRecords(remoteOutput, 'remote')]
    .sort((left, right) => {
      if (left.scope !== right.scope) {
        return left.scope === 'local' ? -1 : 1;
      }

      if (left.isCurrent !== right.isCurrent) {
        return left.isCurrent ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
}

export { fetchLatestRemoteRefs };

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
