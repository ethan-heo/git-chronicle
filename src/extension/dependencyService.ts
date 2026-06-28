import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fetchFileContentAtCommit } from './gitService';

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

    const tsConfigPath = findTsConfigPath(repoPath);
    const args = [
      analyzerPath,
      '--output-type',
      'json',
      '--no-config',
      ...(tsConfigPath ? ['--ts-config', tsConfigPath] : []),
      '--ts-pre-compilation-deps',
      ...resolvedFiles,
    ];

    const stdout = await runDependencyCruiser(args, repoPath);

    const result = JSON.parse(stdout) as DependencyCruiserResult;
    const edges: DependencyEdge[] = [];
    const seenEdges = new Set<string>();

    for (const module of result.modules ?? []) {
      const from = normalizePath(path.relative(tmpDir, resolveRepoRelativePath(repoPath, module.source ?? '')));

      if (!changedFileSet.has(from)) {
        continue;
      }

      for (const dependency of module.dependencies ?? []) {
        const to = normalizePath(
          path.relative(tmpDir, resolveRepoRelativePath(repoPath, dependency.resolved ?? dependency.module ?? '')),
        );

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

function resolveRepoRelativePath(repoPath: string, candidatePath: string): string {
  if (!candidatePath) {
    return candidatePath;
  }

  return path.isAbsolute(candidatePath) ? candidatePath : path.resolve(repoPath, candidatePath);
}

function findTsConfigPath(repoPath: string): string | undefined {
  let currentDir = repoPath;

  while (true) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');

    if (fs.existsSync(tsConfigPath)) {
      return tsConfigPath;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function getDependencyCruiserBinPath(): string {
  return path.resolve(__dirname, '..', '..', 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruise.mjs');
}

function runDependencyCruiser(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.on('error', reject);

    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8');
      const stderr = Buffer.concat(stderrChunks).toString('utf8');

      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `dependency-cruiser exited with code ${code ?? 'unknown'}`));
    });
  });
}
