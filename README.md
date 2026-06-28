# GitChronicle

Rewind your Git history — explore commits, visualize file changes, analyze dependencies, and generate AI summaries, all inside VSCode.

## Features

### Commit Log

Browse your full Git history with powerful filters: date range, author, and include/exclude keywords. Scroll through commits instantly without leaving your editor.

### Changed File Tree

Select any commit and see every changed file organized in a directory tree. Each file shows its change status (Added / Modified / Deleted) at a glance.

### Code Diff Viewer

View file-level unified diffs with syntax highlighting powered by [Shiki](https://shiki.style), using the same TextMate grammars as VSCode itself.

### Dependency Canvas

Visualize import/require relationships between changed files as an interactive node-edge graph. Zoom, pan, and select nodes to explore how files connect.

### AI Summary

Generate markdown summaries of your work using your local AI CLI (Claude, Gemini, or Codex). Summaries are streamed in real time, saved to a local path, and reused instantly on revisit — no repeated API calls.

- **File-level summary** — summarizes the diff of a single file
- **Commit-level summary** — summarizes all changes in a commit at once
- **Batch generation** — auto-generates summaries for every file in a commit

## Requirements

- VSCode `1.85.0` or later
- A Git repository open in your workspace
- _(Optional)_ A local AI CLI installed and configured — `claude`, `gemini`, or `codex`

## Usage

1. Open the Command Palette (`⌘+Shift+P` / `Ctrl+Shift+P`)
2. Run **`GitChronicle: Open`**
3. Browse commits → select a commit → explore changed files, diffs, dependencies, and AI summaries

## Extension Settings

| Setting                      | Default | Description                                            |
| ---------------------------- | ------- | ------------------------------------------------------ |
| `gitChronicle.activeAIProvider` | `""`    | Active AI CLI provider (`claude` / `gemini` / `codex`) |
| `gitChronicle.savePath`         | `""`    | Local directory path where AI summaries are saved      |

Settings can also be configured from the in-extension settings screen (⚙ icon).
