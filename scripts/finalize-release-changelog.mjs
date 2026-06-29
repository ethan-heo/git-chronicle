import { readFile, writeFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const changelogUrl = new URL('../CHANGELOG.md', import.meta.url);
const changelog = await readFile(changelogUrl, 'utf8');
const unreleasedHeader = '## [Unreleased]';
const versionHeader = `## [${packageJson.version}]`;

if (!changelog.includes(unreleasedHeader)) {
  process.exit(0);
}

const updated = changelog.replace(unreleasedHeader, versionHeader);
await writeFile(changelogUrl, updated);
