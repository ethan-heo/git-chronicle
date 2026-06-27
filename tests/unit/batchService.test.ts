import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChangedFile } from '../../src/extension/gitService';
import { runBatchAISummary } from '../../src/extension/batchService';
import { getSummaryFilePath, saveSummary } from '../../src/extension/summaryFileService';

const fetchFileDiffMock = vi.hoisted(() => vi.fn());
const streamAISummaryMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/extension/gitService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/extension/gitService')>();

  return {
    ...actual,
    fetchFileDiff: fetchFileDiffMock,
  };
});

vi.mock('../../src/extension/aiService', () => ({
  streamAISummary: streamAISummaryMock,
}));

const tempPaths: string[] = [];

afterEach(() => {
  vi.clearAllMocks();

  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

describe('batchService', () => {
  it('저장본이 있는 파일은 건너뛰고 나머지 파일을 순차 저장한다', async () => {
    const savePath = makeTempPath();
    saveSummary(savePath, 'abc123', 'src/saved.ts', '# Existing');
    fetchFileDiffMock.mockResolvedValue({ rawDiff: 'diff --git a/src/new.ts b/src/new.ts', isBinary: false, isDeleted: false });
    streamAISummaryMock.mockImplementation(({ onChunk, onComplete }) => {
      onChunk('# Generated');
      onComplete();
      return () => undefined;
    });
    const progress: Array<{ completed: number; failed: number; filePath: string; saved: boolean }> = [];

    const result = await runBatchAISummary({
      repoPath: '/repo',
      files: [
        makeFile('src/saved.ts', true),
        makeFile('src/new.ts', false),
      ],
      provider: 'claude',
      savePath,
      commitHash: 'abc123',
      commitMessage: 'feat: add batch AI summary',
      isCancelled: () => false,
      onProgress: (event) => progress.push(event),
    });

    expect(result).toEqual({ completed: 2, failed: 0, cancelled: false });
    expect(fetchFileDiffMock).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync(getSummaryFilePath(savePath, 'abc123', 'src/new.ts', 'feat: add batch AI summary'), 'utf8')).toBe('# Generated');
    expect(progress).toEqual([
      { completed: 1, failed: 0, filePath: 'src/saved.ts', saved: true },
      { completed: 2, failed: 0, filePath: 'src/new.ts', saved: true },
    ]);
  });

  it('개별 파일 실패는 실패 수를 올리고 다음 파일을 계속 처리한다', async () => {
    const savePath = makeTempPath();
    fetchFileDiffMock
      .mockResolvedValueOnce({ rawDiff: '', isBinary: true, isDeleted: false })
      .mockResolvedValueOnce({ rawDiff: 'diff --git a/src/ok.ts b/src/ok.ts', isBinary: false, isDeleted: false });
    streamAISummaryMock.mockImplementation(({ onChunk, onComplete }) => {
      onChunk('# OK');
      onComplete();
      return () => undefined;
    });

    const result = await runBatchAISummary({
      repoPath: '/repo',
      files: [makeFile('src/binary.png', false), makeFile('src/ok.ts', false)],
      provider: 'claude',
      savePath,
      commitHash: 'abc123',
      isCancelled: () => false,
      onProgress: vi.fn(),
    });

    expect(result).toEqual({ completed: 2, failed: 1, cancelled: false });
    expect(fs.existsSync(getSummaryFilePath(savePath, 'abc123', 'src/binary.png'))).toBe(false);
    expect(fs.readFileSync(getSummaryFilePath(savePath, 'abc123', 'src/ok.ts'), 'utf8')).toBe('# OK');
  });

  it('취소 플래그가 켜지면 다음 파일 처리 전에 중단한다', async () => {
    const savePath = makeTempPath();
    let cancelled = false;

    const result = await runBatchAISummary({
      repoPath: '/repo',
      files: [makeFile('src/one.ts', true), makeFile('src/two.ts', false)],
      provider: 'claude',
      savePath,
      commitHash: 'abc123',
      isCancelled: () => cancelled,
      onProgress: () => {
        cancelled = true;
      },
    });

    expect(result).toEqual({ completed: 1, failed: 0, cancelled: true });
    expect(fetchFileDiffMock).not.toHaveBeenCalled();
  });
});

function makeFile(filePath: string, hasSavedSummary: boolean): ChangedFile {
  return {
    path: filePath,
    status: 'M',
    hasSavedSummary,
  };
}

function makeTempPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-batch-summary-'));
  tempPaths.push(tempPath);
  return tempPath;
}
