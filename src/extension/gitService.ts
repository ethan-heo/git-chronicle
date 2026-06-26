import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

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
  hasSavedSummary: boolean;
}

export interface FetchCommitsOptions {
  repoPath: string;
  page: number;
  pageSize?: number;
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

export async function fetchCommits(options: FetchCommitsOptions): Promise<Commit[]> {
  const git = simpleGit(options.repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(options.repoPath);
  }

  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const args = [
    'log',
    `--max-count=${pageSize}`,
    `--skip=${Math.max(options.page, 0) * pageSize}`,
    '--date=iso-strict',
    `--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%aI%x1e`,
  ];

  if (options.dateStart) {
    args.push(`--after=${options.dateStart}`);
  }

  if (options.dateEnd) {
    args.push(`--before=${options.dateEnd}`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  if (options.keyword?.trim()) {
    args.push(`--grep=${options.keyword.trim()}`);
  }

  const output = await git.raw(args);

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

export async function fetchChangedFiles(repoPath: string, commitHash: string, savePath: string | null): Promise<ChangedFile[]> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  const output = await git.raw(['diff-tree', '--no-commit-id', '--name-status', '-r', '--root', commitHash]);

  return output
    .split('\n')
    .map((line) => parseChangedFileLine(line, commitHash, savePath))
    .filter((file): file is ChangedFile => Boolean(file));
}

export async function fetchFileDiff(repoPath: string, commitHash: string, filePath: string): Promise<FileDiffResult> {
  const git = simpleGit(repoPath);
  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    throw new GitRepositoryNotFoundError(repoPath);
  }

  const rawDiff = await git.show(['--format=', '--find-renames', '--unified=3', commitHash, '--', filePath]);
  const isBinary = /^Binary files? /m.test(rawDiff) || /^GIT binary patch$/m.test(rawDiff);
  const isDeleted = /^deleted file mode /m.test(rawDiff);

  return {
    rawDiff: isBinary ? '' : rawDiff,
    isBinary,
    isDeleted,
  };
}

function parseChangedFileLine(line: string, commitHash: string, savePath: string | null): ChangedFile | null {
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
    hasSavedSummary: hasSavedSummary(savePath, commitHash, filePath),
  };
}

function normalizeStatus(rawStatus: string): FileStatus | null {
  const status = rawStatus.charAt(0);

  if (status === 'A' || status === 'M' || status === 'D' || status === 'R') {
    return status;
  }

  return null;
}

function hasSavedSummary(savePath: string | null, commitHash: string, filePath: string): boolean {
  if (!savePath) {
    return false;
  }

  return fs.existsSync(path.join(savePath, commitHash, `${filePath}.md`));
}
