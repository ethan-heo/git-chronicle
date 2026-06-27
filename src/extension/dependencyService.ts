import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

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

export async function analyzeDependencies(repoPath: string, filePaths: string[]): Promise<DependencyEdge[]> {
  const analyzableFiles = [...new Set(filePaths.filter(isAnalyzableFile))];

  if (analyzableFiles.length === 0) {
    return [];
  }

  const analyzerPath = getDependencyCruiserBinPath();

  if (!fs.existsSync(analyzerPath)) {
    throw new DependencyCruiserNotFoundError(analyzerPath);
  }

  const args = [
    analyzerPath,
    '--output-type',
    'json',
    '--no-config',
    '--ts-pre-compilation-deps',
    ...analyzableFiles,
  ];

  const { stdout } = await execFileAsync(process.execPath, args, {
    cwd: repoPath,
    maxBuffer: 1024 * 1024 * 8,
  });

  const result = JSON.parse(stdout) as DependencyCruiserResult;
  const changedFileSet = new Set(analyzableFiles.map(normalizePath));
  const edges: DependencyEdge[] = [];
  const seenEdges = new Set<string>();

  for (const module of result.modules ?? []) {
    const from = normalizePath(module.source ?? '');

    if (!changedFileSet.has(from)) {
      continue;
    }

    for (const dependency of module.dependencies ?? []) {
      const to = normalizePath(dependency.resolved ?? dependency.module ?? '');

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
