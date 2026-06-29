module.exports = {
  options: {
    preset: {
      name: 'conventionalcommits',
      types: [
        { type: 'feat', section: 'Features' },
        { type: 'feature', section: 'Features' },
        { type: 'fix', section: 'Bug Fixes' },
        { type: 'perf', section: 'Performance Improvements' },
        { type: 'revert', section: 'Reverts' },
        { type: 'docs', section: 'Documentation', hidden: false },
        { type: 'style', section: 'Styles', hidden: true },
        { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
        { type: 'refactor', section: 'Code Refactoring', hidden: true },
        { type: 'test', section: 'Tests', hidden: true },
        { type: 'build', section: 'Build System', hidden: true },
        { type: 'ci', section: 'Continuous Integration', hidden: true }
      ]
    }
  },
  writerOpts: {
    commitsSort: (a, b) => {
      const left = new Date(b.committerDate).getTime();
      const right = new Date(a.committerDate).getTime();

      return left - right;
    },
  },
};
