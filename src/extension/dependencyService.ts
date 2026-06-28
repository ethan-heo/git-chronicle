import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { fetchFileContentAtCommit } from './gitService';

const execFileAsync = promisify(execFile);

const ANALYZABLE_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;

export type DependencyKind = 'import' | 'require';

export interface DependencyEdge {
  from: string;
  to: string;
  kind: DependencyKind;
}

export class DependencyCruiserNotFoundError extends Error {
  constructor(analyzerPath: string) {
    super(`dependency-cruiser executable was not found at ${analyzerPath}`);
    this.name = 'DependencyCruiserNotFoundError';
  }
}

interface DependencyCruiserModule {
  source?: string;
  dependencies?: Array<{
    resolved?: string;
    module?: string;
    dependencyTypes?: string[];
  }>;
}

interface DependencyCruiserResult {
  modules?: DependencyCruiserModule[];
}

export async function analyzeDependencies(repoPath: string, filePaths: string[], commitHash: string = ''): Promise<DependencyEdge[]> {
  const analyzableFiles = [...new Set(filePaths.filter(isAnalyzableFile))];

  if (analyzableFiles.length === 0) {
    return [];
  }

  const analyzerPath = getDependencyCruiserBinPath();

  if (!fs.existsSync(analyzerPath)) {
    throw new DependencyCruiserNotFoundError(analyzerPath);
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-author-explorer-'));
  const resolvedFiles: string[] = [];
  const changedFileSet = new Set<string>();

  try {
    for (const filePath of analyzableFiles) {
      const onDiskPath = path.resolve(repoPath, filePath);
      const tmpFilePath = path.join(tmpDir, filePath);
      const normalizedRelativePath = normalizePath(filePath);

      if (fs.existsSync(onDiskPath)) {
        await fs.promises.mkdir(path.dirname(tmpFilePath), { recursive: true });
        await fs.promises.copyFile(onDiskPath, tmpFilePath);
        resolvedFiles.push(tmpFilePath);
        changedFileSet.add(normalizedRelativePath);
        continue;
      }

      if (!commitHash) {
        continue;
      }

      const content = await fetchFileContentAtCommit(repoPath, commitHash, filePath);

      if (content === null) {
        continue;
      }

      await fs.promises.mkdir(path.dirname(tmpFilePath), { recursive: true });
      await fs.promises.writeFile(tmpFilePath, content, 'utf8');
      resolvedFiles.push(tmpFilePath);
      changedFileSet.add(normalizedRelativePath);
    }

    if (resolvedFiles.length === 0) {
      return [];
    }

    const args = [
      analyzerPath,
      '--output-type',
      'json',
      '--no-config',
      '--ts-pre-compilation-deps',
      ...resolvedFiles,
    ];

    const { stdout } = await execFileAsync(process.execPath, args, {
      cwd: repoPath,
      maxBuffer: 1024 * 1024 * 8,
    });

    const result = JSON.parse(stdout) as DependencyCruiserResult;
    const edges: DependencyEdge[] = [];
    const seenEdges = new Set<string>();

    for (const module of result.modules ?? []) {
      const from = normalizePath(path.relative(tmpDir, module.source ?? ''));

      if (!changedFileSet.has(from)) {
        continue;
      }

      for (const dependency of module.dependencies ?? []) {
        const to = normalizePath(path.relative(tmpDir, dependency.resolved ?? dependency.module ?? ''));

        if (!changedFileSet.has(to)) {
          continue;
        }

        const kind = dependency.dependencyTypes?.some((type) => type.toLowerCase().includes('require')) ? 'require' : 'import';
        const key = `${from}\0${to}\0${kind}`;

        if (!seenEdges.has(key)) {
          edges.push({ from, to, kind });
          seenEdges.add(key);
        }
      }
    }

    return edges;
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

function isAnalyzableFile(filePath: string): boolean {
  return ANALYZABLE_FILE_PATTERN.test(filePath);
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function getDependencyCruiserBinPath(): string {
  return path.resolve(__dirname, '..', '..', 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruise.mjs');
}
