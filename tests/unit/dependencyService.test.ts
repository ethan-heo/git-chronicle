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
  it('restores missing files from git before dependency analysis', async () => {
    const repoPath = makeTempRepoPath();
    const currentFilePath = path.join(repoPath, 'src/current.ts');
    fs.mkdirSync(path.dirname(currentFilePath), { recursive: true });
    fs.writeFileSync(currentFilePath, "import './legacy';\n", 'utf8');
    const tmpDir = '/tmp/git-rewind-restore';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);

    fetchFileContentAtCommitMock.mockResolvedValueOnce("import './current';\n");
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

    expect(fetchFileContentAtCommitMock).toHaveBeenCalledWith(repoPath, 'abc123', 'src/legacy.ts');
    expect(edges).toEqual([
      { from: 'src/current.ts', to: 'src/legacy.ts', kind: 'import' },
      { from: 'src/legacy.ts', to: 'src/current.ts', kind: 'import' },
    ]);

    mkdtempSpy.mockRestore();
  });

  it('analyzes python imports without dependency-cruiser', async () => {
    const repoPath = makeTempRepoPath();
    fs.mkdirSync(path.join(repoPath, 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'pkg', 'a.py'), 'from . import b\nimport pkg.b\n', 'utf8');
    fs.writeFileSync(path.join(repoPath, 'pkg', 'b.py'), 'value = 1\n', 'utf8');
    const tmpDir = '/tmp/git-rewind-python';
    const mkdtempSpy = vi.spyOn(fs.promises, 'mkdtemp').mockResolvedValue(tmpDir);

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['pkg/a.py', 'pkg/b.py']);

    expect(edges).toEqual([{ from: 'pkg/a.py', to: 'pkg/b.py', kind: 'import' }]);
    mkdtempSpy.mockRestore();
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

    const { analyzeDependencies } = await import('../../src/extension/dependencyService');
    const edges = await analyzeDependencies(repoPath, ['service/a.go', 'service/service.go']);

    expect(edges).toEqual([{ from: 'service/a.go', to: 'service/service.go', kind: 'import' }]);
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
