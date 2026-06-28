import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const execFileMock = vi.hoisted(() => vi.fn());
const fetchFileContentAtCommitMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();

  return {
    ...actual,
    execFile: execFileMock,
  };
});

vi.mock('../../src/extension/gitService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/extension/gitService')>();

  return {
    ...actual,
    fetchFileContentAtCommit: fetchFileContentAtCommitMock,
  };
});

const tempPaths: string[] = [];

afterEach(() => {
  vi.clearAllMocks();

  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

describe('dependencyService', () => {
  it('restores missing files from git before dependency analysis', async () => {
    const repoPath = makeTempRepoPath();
    const currentFilePath = path.join(repoPath, 'src/current.ts');
    fs.mkdirSync(path.dirname(currentFilePath), { recursive: true });
    fs.writeFileSync(currentFilePath, "import './legacy';\n", 'utf8');
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue('/tmp/git-author-explorer-restore');

    fetchFileContentAtCommitMock.mockResolvedValueOnce("import './current';\n");

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/current.ts', 'src/legacy.ts'], 'abc123');

    expect(fetchFileContentAtCommitMock).toHaveBeenCalledWith(repoPath, 'abc123', 'src/legacy.ts');
    expect(edges).toEqual([
      { from: 'src/current.ts', to: 'src/legacy.ts', kind: 'import' },
      { from: 'src/legacy.ts', to: 'src/current.ts', kind: 'import' },
    ]);

    mkdtempSpy.mockRestore();
  });
});

function makeTempRepoPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-dependency-service-'));
  tempPaths.push(tempPath);
  return tempPath;
}
