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
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue('/tmp/git-rewind-restore');

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

  it('resolves repository-relative analyzer output using repoPath and passes tsconfig when available', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'tsconfig.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src/a.ts'), "import { b } from './b';\n", 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src/b.ts'), 'export const b = 1;\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-analyze';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);

    execFileMock.mockImplementationOnce(async (_command, args: string[]) => {
      expect(args).toContain('--no-config');
      expect(args).toContain('--ts-config');
      expect(args).toContain(path.join(repoPath, 'tsconfig.json'));

      const tmpSourcePath = path.join(tmpDir, 'src/a.ts');
      const tmpDependencyPath = path.join(tmpDir, 'src/b.ts');

      return {
        stdout: JSON.stringify({
          modules: [
            {
              source: path.relative(repoPath, tmpSourcePath),
              dependencies: [
                {
                  resolved: path.relative(repoPath, tmpDependencyPath),
                  dependencyTypes: ['local', 'export'],
                },
              ],
            },
          ],
        }),
      };
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/a.ts', 'src/b.ts']);

    expect(edges).toEqual([{ from: 'src/a.ts', to: 'src/b.ts', kind: 'import' }]);
    mkdtempSpy.mockRestore();
  });

  it('keeps path-alias dependencies that resolve to repository absolute paths', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src', 'constants'), { recursive: true });
    fs.writeFileSync(
      path.join(repoPath, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
          },
        },
      }),
      'utf8',
    );
    fs.writeFileSync(path.join(repoPath, 'src', 'feature.ts'), "import { queryKey } from '@/constants/queryKey';\n", 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src', 'constants', 'queryKey.ts'), 'export const queryKey = 1;\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-analyze-alias';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/feature.ts', 'src/constants/queryKey.ts']);

    expect(edges).toEqual([{ from: 'src/feature.ts', to: 'src/constants/queryKey.ts', kind: 'import' }]);
    mkdtempSpy.mockRestore();
  });

  it('falls back to no-config when tsconfig is absent', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'src/a.ts'), "require('./b');\n", 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src/b.ts'), 'export const b = 1;\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-analyze-no-config';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);

    execFileMock.mockImplementationOnce(async (_command, args: string[]) => {
      expect(args).toContain('--no-config');

      const tmpSourcePath = path.join(tmpDir, 'src/a.ts');
      const tmpDependencyPath = path.join(tmpDir, 'src/b.ts');

      return {
        stdout: JSON.stringify({
          modules: [
            {
              source: path.relative(repoPath, tmpSourcePath),
              dependencies: [
                {
                  module: path.relative(repoPath, tmpDependencyPath),
                  dependencyTypes: ['require'],
                },
              ],
            },
          ],
        }),
      };
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/a.ts', 'src/b.ts']);

    expect(edges).toEqual([{ from: 'src/a.ts', to: 'src/b.ts', kind: 'require' }]);
    mkdtempSpy.mockRestore();
  });
});

function makeTempRepoPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-dependency-service-'));
  tempPaths.push(tempPath);
  return tempPath;
}
