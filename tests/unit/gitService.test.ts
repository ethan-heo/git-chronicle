import { beforeEach, describe, expect, it, vi } from 'vitest';

const gitRawMock = vi.hoisted(() => vi.fn());
const checkIsRepoMock = vi.hoisted(() => vi.fn());

vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    checkIsRepo: checkIsRepoMock,
    raw: gitRawMock,
  })),
}));

describe('gitService fetchCommits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkIsRepoMock.mockResolvedValue(true);
  });

  it('returns commits when the keyword matches a commit hash prefix', async () => {
    gitRawMock
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce(['abc1234567890', 'def9876543210'].join('\n'))
      .mockResolvedValueOnce('abc1234567890\x1fabc1234\x1ffeat: support hash search\x1fJane Cooper\x1f2026-07-20T10:00:00+09:00\x1e');

    const { fetchCommits } = await import('../../src/extension/gitService');
    const result = await fetchCommits({
      repoPath: '/repo',
      page: 0,
      pageSize: 20,
      keyword: 'abc1234',
      sortOrder: 'desc',
    });

    expect(result.commits).toEqual([
      {
        hash: 'abc1234567890',
        shortHash: 'abc1234',
        message: 'feat: support hash search',
        author: 'Jane Cooper',
        date: '2026-07-20T10:00:00+09:00',
      },
    ]);
    expect(result.rawCount).toBe(1);
    expect(gitRawMock).toHaveBeenNthCalledWith(
      2,
      ['rev-list', '--all'],
    );
    expect(gitRawMock).toHaveBeenNthCalledWith(
      3,
      ['log', '--date=iso-strict', '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%aI%x1e', '--no-walk=sorted', 'abc1234567890'],
    );
  });

  it('deduplicates commits that match both message and hash filters', async () => {
    gitRawMock
      .mockResolvedValueOnce('abc1234567890\x1fabc1234\x1ffix: abc1234 regression\x1fJane Cooper\x1f2026-07-20T10:00:00+09:00\x1e')
      .mockResolvedValueOnce(['abc1234567890'].join('\n'))
      .mockResolvedValueOnce('abc1234567890\x1fabc1234\x1ffix: abc1234 regression\x1fJane Cooper\x1f2026-07-20T10:00:00+09:00\x1e');

    const { fetchCommits } = await import('../../src/extension/gitService');
    const result = await fetchCommits({
      repoPath: '/repo',
      page: 0,
      pageSize: 20,
      keyword: 'abc1234',
      sortOrder: 'desc',
    });

    expect(result.commits).toHaveLength(1);
    expect(result.rawCount).toBe(1);
  });

  it('extracts a hash token from mixed text such as a tab label', async () => {
    gitRawMock
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce(['abc1234567890', 'def9876543210'].join('\n'))
      .mockResolvedValueOnce('abc1234567890\x1fabc1234\x1ffeat: support hash search\x1fJane Cooper\x1f2026-07-20T10:00:00+09:00\x1e');

    const { fetchCommits } = await import('../../src/extension/gitService');
    const result = await fetchCommits({
      repoPath: '/repo',
      page: 0,
      pageSize: 20,
      keyword: 'abc1234 · AI Summary',
      sortOrder: 'desc',
    });

    expect(result.commits).toHaveLength(1);
    expect(result.commits[0]?.shortHash).toBe('abc1234');
    expect(result.rawCount).toBe(1);
  });
});
