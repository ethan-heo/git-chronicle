export default {
  execute: 'pnpm changelog && node scripts/finalize-release-changelog.mjs && git add CHANGELOG.md',
  commit: 'chore(release): v%s',
  tag: 'v%s',
  push: false,
};
