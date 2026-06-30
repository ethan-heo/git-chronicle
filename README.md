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

Supported languages: **JavaScript/TypeScript**, **Python**, **Go** (other file types appear as nodes without dependency edges).

### Intra-file Symbol Dependency Canvas

Inspect the internal structure of a single file by visualizing functions, classes, variables, types, and imported symbols as a symbol graph. Hover and click symbols to explore calls, references, inheritance, and implementation relationships, then open the code panel to jump to the relevant lines.

Supported languages: **JavaScript/TypeScript** (`.js .jsx .ts .tsx .mjs .cjs .mts .cts`), **Python**, **Go**.

### AI Summary

Generate markdown summaries of your work using your local AI CLI (Claude, Gemini, or Codex). Summaries are streamed in real time, saved to a local path, and reused instantly on revisit — no repeated API calls.

- **File-level summary** — summarizes the diff of a single file
- **Commit-level summary** — summarizes all changes in a commit at once
- **Batch generation** — auto-generates summaries for every file in a commit; runs in the background with a progress bar and can be cancelled at any time
- **Regenerate** — re-run AI generation on demand with an overwrite confirmation; previously generated files are skipped in batch mode
- **Split view** — view the code diff and AI summary side by side in a resizable panel
- **Q&A** — ask follow-up questions about any summary; answers stream in real time and are appended to the saved `.md` file

## Requirements

- VSCode `1.85.0` or later
- A Git repository open in your workspace
- _(Optional)_ A local AI CLI installed and configured — `claude`, `gemini`, or `codex`

## Usage

1. Open the Command Palette (`⌘+Shift+P` / `Ctrl+Shift+P`)
2. Run **`GitChronicle: Open`**
3. Browse commits → select a commit → explore changed files, diffs, dependencies, symbol graphs, and AI summaries

## Extension Settings

The following settings can be configured in `settings.json`:

| Setting                         | Default | Description                                            |
| ------------------------------- | ------- | ------------------------------------------------------ |
| `gitChronicle.activeAIProvider` | `""`    | Active AI CLI provider (`claude` / `gemini` / `codex`) |
| `gitChronicle.savePath`         | `""`    | Local directory path where AI summaries are saved      |

The in-extension settings screen (⚙ icon) exposes additional options not available in `settings.json`:

- **AI provider registration** — detect and register installed CLI tools; only one provider can be active at a time
- **Model selection** — choose separate models for summary generation and Q&A per provider

| Provider | Default summary model    | Default Q&A model        |
| -------- | ------------------------ | ------------------------ |
| Claude   | `claude-haiku-4-5`       | `claude-haiku-4-5`       |
| Gemini   | `gemini-2.5-flash`       | `gemini-2.5-flash`       |
| Codex    | `gpt-5.4-mini`           | `gpt-5.4-mini`           |

**Per-project isolation**: active provider, model choices, and save path are workspace-scoped — each project keeps its own configuration. CLI registration is shared globally across all projects.
