import simpleGit from 'simple-git';

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
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
