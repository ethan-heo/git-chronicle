export default {
  execute: 'pnpm changelog && git add CHANGELOG.md',
  commit: 'chore(release): v%s',
  tag: 'v%s',
  push: false,
};
