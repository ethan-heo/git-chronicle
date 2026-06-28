import * as fs from 'node:fs';
import * as path from 'node:path';

const sourceRoot = fs.realpathSync('node_modules/dependency-cruiser');
const targetRoot = path.resolve('dist/node_modules/dependency-cruiser');

fs.mkdirSync(path.dirname(targetRoot), { recursive: true });
fs.rmSync(targetRoot, { recursive: true, force: true });
copyDirectory(sourceRoot, targetRoot);
copyPackageDependencies(sourceRoot, targetRoot);

function copyPackageDependencies(sourcePackageRoot, targetPackageRoot) {
  const queue = [[sourcePackageRoot, targetPackageRoot]];
  const visited = new Set();

  while (queue.length > 0) {
    const currentEntry = queue.shift();
    if (!currentEntry) {
      continue;
    }

    const [currentSourceRoot, currentTargetRoot] = currentEntry;
    if (!currentSourceRoot || visited.has(currentSourceRoot)) {
      continue;
    }

    visited.add(currentSourceRoot);

    const packageJsonPath = path.join(currentSourceRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies ?? {});
    const currentTargetNodeModules = path.join(currentTargetRoot, 'node_modules');

    for (const dependencyName of dependencies) {
      const sourceDependencyPath = resolvePackagePath(currentSourceRoot, dependencyName);
      if (!sourceDependencyPath) {
        continue;
      }

      const targetDependencyPath = path.join(currentTargetNodeModules, dependencyName);
      if (!fs.existsSync(targetDependencyPath)) {
        copyDirectory(sourceDependencyPath, targetDependencyPath);
        queue.push([sourceDependencyPath, targetDependencyPath]);
      }
    }
  }
}

function resolvePackagePath(startPackageRoot, packageName) {
  let currentDir = startPackageRoot;

  while (true) {
    const candidate = path.join(currentDir, 'node_modules', packageName);
    if (fs.existsSync(candidate)) {
      return fs.realpathSync(candidate);
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function copyDirectory(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, dereference: true });
}
