import { EventEmitter } from 'node:events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const spawnMock = vi.hoisted(() => vi.fn());
const fetchFileContentAtCommitMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();

  return {
    ...actual,
    spawn: spawnMock,
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
  it('resolves every file from the commit snapshot when a commit hash is given, even if the file still exists on disk', async () => {
    const repoPath = makeTempRepoPath();
    const currentFilePath = path.join(repoPath, 'src/current.ts');
    fs.mkdirSync(path.dirname(currentFilePath), { recursive: true });
    // On-disk content deliberately differs from the commit snapshot below (no './legacy' import) to
    // prove the analysis uses the git-show content, not this stale on-disk state.
    fs.writeFileSync(currentFilePath, "import './unrelated';\n", 'utf8');
    const tmpDir = '/tmp/git-rewind-restore';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    fetchFileContentAtCommitMock.mockResolvedValueOnce("import './legacy';\n").mockResolvedValueOnce("import './current';\n");
    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/current.ts'),
          dependencies: [
            {
              resolved: path.join(tmpDir, 'src/legacy.ts'),
              dependencyTypes: ['local'],
            },
          ],
        },
        {
          source: path.join(tmpDir, 'src/legacy.ts'),
          dependencies: [
            {
              resolved: path.join(tmpDir, 'src/current.ts'),
              dependencyTypes: ['local'],
            },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/current.ts', 'src/legacy.ts'], 'abc123');

    expect(fetchFileContentAtCommitMock).toHaveBeenCalledWith(repoPath, 'abc123', 'src/current.ts');
    expect(fetchFileContentAtCommitMock).toHaveBeenCalledWith(repoPath, 'abc123', 'src/legacy.ts');
    expect(edges).toEqual([
      { from: 'src/current.ts', to: 'src/legacy.ts', kind: 'import' },
      { from: 'src/legacy.ts', to: 'src/current.ts', kind: 'import' },
    ]);

    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('falls back to on-disk content only when no commit hash is given', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'src', 'current.ts'), "import './legacy';\n", 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src', 'legacy.ts'), 'export const value = 1;\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-disk-fallback';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/current.ts'),
          dependencies: [
            {
              resolved: path.join(tmpDir, 'src/legacy.ts'),
              dependencyTypes: ['local'],
            },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/current.ts', 'src/legacy.ts']);

    expect(fetchFileContentAtCommitMock).not.toHaveBeenCalled();
    expect(edges).toEqual([{ from: 'src/current.ts', to: 'src/legacy.ts', kind: 'import' }]);

    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('detects a dependency that only existed at commit time, when the importing file survives with a refactored import and the imported file was later removed', async () => {
    const repoPath = makeTempRepoPath();
    const fromFilePath = path.join(repoPath, 'src/from.ts');
    fs.mkdirSync(path.dirname(fromFilePath), { recursive: true });
    // Current on-disk content: refactored, no longer imports './to' — mirrors CommitList.tsx today,
    // which no longer imports InfiniteScrollTrigger from its original F01-local path.
    fs.writeFileSync(fromFilePath, "export const from = 1;\n", 'utf8');
    const tmpDir = '/tmp/git-rewind-historical-edge';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    // src/to.ts no longer exists on disk (deleted/moved since the commit) — only git show has it.
    fetchFileContentAtCommitMock.mockImplementation(async (_repoPath: string, _commitHash: string, filePath: string) => {
      if (filePath === 'src/from.ts') {
        return "import { to } from './to';\n\nconsole.log(to);\n";
      }

      if (filePath === 'src/to.ts') {
        return 'export const to = 1;\n';
      }

      return null;
    });
    mockSpawnForJson({ modules: [] });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/from.ts', 'src/to.ts'], 'deadbeef');

    expect(edges).toEqual([{ from: 'src/from.ts', to: 'src/to.ts', kind: 'import' }]);

    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('analyzes python imports without dependency-cruiser', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'pkg', 'a.py'), 'from . import b\nimport pkg.b\n', 'utf8');
    fs.writeFileSync(path.join(repoPath, 'pkg', 'b.py'), 'value = 1\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-python';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['pkg/a.py', 'pkg/b.py']);

    expect(edges).toEqual([{ from: 'pkg/a.py', to: 'pkg/b.py', kind: 'import' }]);
    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('analyzes go imports without dependency-cruiser', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'service'), { recursive: true });
    fs.writeFileSync(
      path.join(repoPath, 'service', 'a.go'),
      `package service\n\nimport (\n  "service"\n)\n`,
      'utf8',
    );
    fs.writeFileSync(path.join(repoPath, 'service', 'service.go'), 'package service\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-go';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['service/a.go', 'service/service.go']);

    expect(edges).toEqual([{ from: 'service/a.go', to: 'service/service.go', kind: 'import' }]);
    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
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
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/feature.ts'),
          dependencies: [
            {
              resolved: path.join(tmpDir, 'src/constants/queryKey.ts'),
              dependencyTypes: ['local', 'export'],
            },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/feature.ts', 'src/constants/queryKey.ts']);

    expect(edges).toEqual([{ from: 'src/feature.ts', to: 'src/constants/queryKey.ts', kind: 'import' }]);
    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('resolves a nested-directory dependency when dependency-cruiser reports "resolved" as a baseDir-relative path with several ".." segments', async () => {
    const repoPath = makeTempRepoPath();
    const nestedDir = path.join(repoPath, 'src', 'features', 'foo');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'A.tsx'), "import { B } from './B';\n", 'utf8');
    fs.writeFileSync(path.join(nestedDir, 'B.tsx'), 'export const B = 1;\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-nested-dep';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    // dependency-cruiser reports "resolved" relative to baseDir (repoPath), which in production is
    // always a different directory tree than tmpDir (tmpDir lives under os.tmpdir()) — this produces a
    // long "../../..." chain rather than the short absolute tmp paths the other tests mock for simplicity.
    const resolvedRelativeToBaseDir = path.relative(repoPath, path.join(tmpDir, 'src/features/foo/B.tsx'));

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/features/foo/A.tsx'),
          dependencies: [
            {
              resolved: resolvedRelativeToBaseDir,
              dependencyTypes: ['local'],
            },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/features/foo/A.tsx', 'src/features/foo/B.tsx']);

    expect(edges).toEqual([{ from: 'src/features/foo/A.tsx', to: 'src/features/foo/B.tsx', kind: 'import' }]);
    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('resolves path-alias dependencies even when dependency-cruiser only returns the module specifier', async () => {
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
    const tmpDir = '/tmp/git-rewind-analyze-alias-module';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/feature.ts'),
          dependencies: [
            {
              module: '@/constants/queryKey',
              dependencyTypes: ['local', 'export'],
            },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/feature.ts', 'src/constants/queryKey.ts']);

    expect(edges).toEqual([{ from: 'src/feature.ts', to: 'src/constants/queryKey.ts', kind: 'import' }]);
    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('resolves relative dependencies from the source file even when dependency-cruiser only returns module specifiers for re-exports', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src', 'components'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'src', 'components', 'Button.tsx'), 'export default function Button() { return null; }\n', 'utf8');
    fs.writeFileSync(
      path.join(repoPath, 'src', 'components', 'index.ts'),
      "export { default as Button } from './Button';\nexport { Button } from './Button';\n",
      'utf8',
    );
    const tmpDir = '/tmp/git-rewind-analyze-relative-module';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/components/index.ts'),
          dependencies: [
            {
              module: './Button',
              dependencyTypes: ['local', 'export'],
            },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/components/index.ts', 'src/components/Button.tsx']);

    expect(edges).toEqual([{ from: 'src/components/index.ts', to: 'src/components/Button.tsx', kind: 'import' }]);
    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('resolves CSS Modules and JSON imports as valid dependency edge targets', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(repoPath, 'src', 'Button.tsx'),
      "import styles from './Button.module.css';\nimport data from './data.json';\n",
      'utf8',
    );
    fs.writeFileSync(path.join(repoPath, 'src', 'Button.module.css'), '.button { color: red; }\n', 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src', 'data.json'), '{ "label": "Click" }\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-asset-module';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/Button.tsx'),
          dependencies: [
            { resolved: path.join(tmpDir, 'src/Button.module.css'), dependencyTypes: ['local'] },
            { resolved: path.join(tmpDir, 'src/data.json'), dependencyTypes: ['local'] },
          ],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/Button.tsx', 'src/Button.module.css', 'src/data.json']);

    expect(edges).toEqual([
      { from: 'src/Button.tsx', to: 'src/Button.module.css', kind: 'import' },
      { from: 'src/Button.tsx', to: 'src/data.json', kind: 'import' },
    ]);

    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });

  it('does not treat a plain (non-module) CSS file as an analyzable dependency target', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'src', 'main.tsx'), "import './global.css';\n", 'utf8');
    fs.writeFileSync(path.join(repoPath, 'src', 'global.css'), 'body { margin: 0; }\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-plain-css';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);
    const realpathSpy = vi.spyOn(fs.promises, 'realpath').mockResolvedValue(tmpDir);

    mockSpawnForJson({
      modules: [
        {
          source: path.join(tmpDir, 'src/main.tsx'),
          dependencies: [{ resolved: path.join(tmpDir, 'src/global.css'), dependencyTypes: ['local'] }],
        },
      ],
    });

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['src/main.tsx', 'src/global.css']);

    expect(edges).toEqual([]);

    mkdtempSpy.mockRestore();
    realpathSpy.mockRestore();
  });
});

function mockSpawnForJson(stdoutValue: unknown): void {
  spawnMock.mockImplementationOnce(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdin: EventEmitter & { end: (chunk?: string | Buffer) => void };
      stdout: EventEmitter;
      stderr: EventEmitter;
    };

    child.stdin = new EventEmitter() as EventEmitter & { end: (chunk?: string | Buffer) => void };
    child.stdin.end = vi.fn();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    setImmediate(() => {
      child.stdout.emit('data', Buffer.from(JSON.stringify(stdoutValue)));
      child.emit('close', 0);
    });

    return child;
  });
}

function makeTempRepoPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-dependency-service-'));
  tempPaths.push(tempPath);
  return tempPath;
}
