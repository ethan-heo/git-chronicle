import * as vscode from 'vscode';
import { AI_PROVIDERS, loadAISettingsState, registerAIProvider, setAIModel, setActiveAIProvider, setSavePath } from './aiProviderService';
import { streamAISummary } from './aiService';
import type { AIModelUsage, AIProviderName } from './aiTypes';
import { analyzeDependencies, DependencyCruiserNotFoundError } from './dependencyService';
import { analyzeSymbolGraph } from './intraFileDependencyService';
import { fetchChangedFiles, fetchCommitCount, fetchCommitFullDiff, fetchCommits, fetchFileDiff, GitRepositoryNotFoundError } from './gitService';
import { buildCommitSummaryPrompt, buildFileSummaryPrompt, buildSummaryQAPrompt } from './prompts';
import { appendSummaryQA, loadCommitSummary, loadSummary, saveCommitSummary, saveSummary, SummarySaveError } from './summaryFileService';

interface WebviewMessage {
  type: string;
  payload?:
    | FetchCommitsPayload
    | FetchChangedFilesPayload
    | FetchFileDiffPayload
    | AnalyzeDependenciesPayload
    | AnalyzeSymbolGraphPayload
    | StartAISummaryCommitPayload
    | StartAISummaryFilePayload
    | StartAIQAPayload
    | AIProviderPayload
    | OpenExternalUrlPayload;
}

interface FetchCommitsPayload {
  page?: number;
  pageSize?: number;
  requestId?: number;
  filterDateStart?: string | null;
  filterDateEnd?: string | null;
  filterAuthor?: string | null;
  filterKeyword?: string;
  filterExcludeKeyword?: string;
  sortOrder?: 'desc' | 'asc';
}

interface FetchChangedFilesPayload {
  commitHash?: string;
  commitMessage?: string;
  savePath?: string | null;
}

interface FetchFileDiffPayload {
  commitHash?: string;
  filePath?: string;
}

interface AnalyzeDependenciesPayload {
  filePaths?: string[];
  commitHash?: string;
}

interface AnalyzeSymbolGraphPayload {
  filePath?: string;
  commitHash?: string;
}

interface StartAISummaryCommitPayload {
  commitHash?: string;
  commitMessage?: string;
  provider?: AIProviderName | null;
  summaryModel?: string | null;
  savePath?: string | null;
  forceRegenerate?: boolean;
}

interface StartAISummaryFilePayload extends StartAISummaryCommitPayload {
  filePath?: string;
}

interface AIProviderPayload {
  name?: AIProviderName;
  providerName?: AIProviderName;
  usage?: AIModelUsage;
  model?: string;
}

interface StartAIQAPayload {
  question?: string;
  diff?: string;
  summaryContent?: string;
  commitHash?: string;
  commitMessage?: string;
  filePath?: string;
  provider?: AIProviderName | null;
  qaModel?: string | null;
  savePath?: string | null;
}

interface OpenExternalUrlPayload {
  url?: string;
}

const COMMIT_TOKEN_LIMIT_CHARS = 20_000;

function l10n(message: string): string {
  return message;
}

export function registerMessageHandler(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
  panel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
    switch (message.type) {
      case 'PING':
        await panel.webview.postMessage({
          type: 'PONG',
          payload: {
            message: l10n('Extension Host connection is ready'),
          },
        });
        break;
      case 'FETCH_COMMITS':
        await handleFetchCommits(panel, message.payload as FetchCommitsPayload);
        break;
      case 'FETCH_CHANGED_FILES':
        await handleFetchChangedFiles(panel, context, message.payload as FetchChangedFilesPayload);
        break;
      case 'FETCH_FILE_DIFF':
        await handleFetchFileDiff(panel, message.payload as FetchFileDiffPayload);
        break;
      case 'ANALYZE_DEPENDENCIES':
        await handleAnalyzeDependencies(panel, message.payload as AnalyzeDependenciesPayload);
        break;
      case 'ANALYZE_SYMBOL_GRAPH':
        await handleAnalyzeSymbolGraph(panel, context, message.payload as AnalyzeSymbolGraphPayload);
        break;
      case 'FETCH_AI_SUMMARY_SETTINGS':
        await handleFetchAISummarySettings(panel, context);
        break;
      case 'REGISTER_AI_PROVIDER':
        await handleRegisterAIProvider(panel, context, message.payload as AIProviderPayload);
        break;
      case 'ACTIVATE_AI_PROVIDER':
      case 'SET_ACTIVE_AI_PROVIDER':
        await handleSetActiveAIProvider(panel, context, message.payload as AIProviderPayload);
        break;
      case 'SET_AI_MODEL':
        await handleSetAIModel(panel, context, message.payload as AIProviderPayload);
        break;
      case 'OPEN_EXTERNAL_URL':
        await handleOpenExternalUrl(message.payload as OpenExternalUrlPayload);
        break;
      case 'SET_SAVE_PATH':
        await handleSetSavePath(panel, context);
        break;
      case 'CLEAR_SAVE_PATH':
        await handleClearSavePath(panel, context);
        break;
      case 'START_AI_SUMMARY_COMMIT':
        await handleStartAISummaryCommit(panel, context, message.payload as StartAISummaryCommitPayload);
        break;
      case 'START_AI_SUMMARY_FILE':
        await handleStartAISummaryFile(panel, context, message.payload as StartAISummaryFilePayload);
        break;
      case 'START_AI_QA':
        await handleStartAIQA(panel, context, message.payload as StartAIQAPayload);
        break;
      case 'OPEN_REPOSITORY':
        await vscode.commands.executeCommand('vscode.openFolder');
        break;
      default:
        await panel.webview.postMessage({
          type: 'UNKNOWN_MESSAGE',
          payload: {
            message: l10n(`Unsupported message: ${message.type}`),
          },
        });
    }
  });
}

async function handleFetchAISummarySettings(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = loadAISettingsState(context);

  await panel.webview.postMessage({
    type: 'AI_SUMMARY_SETTINGS_LOADED',
    payload: {
      ...state,
    },
  });
}

async function handleRegisterAIProvider(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
  const providerName = payload.providerName ?? payload.name;

  if (!providerName) {
    await postAISettingsError(panel, l10n('No AI provider selected'));
    return;
  }

  try {
    const state = await registerAIProvider(context, providerName);

    await panel.webview.postMessage({
      type: 'AI_PROVIDER_REGISTERED',
      payload: {
        ...state,
        providerName,
      },
    });
  } catch (error) {
    const provider = AI_PROVIDERS.find((candidate) => candidate.name === providerName);

    await panel.webview.postMessage({
      type: 'AI_PROVIDER_REGISTRATION_FAILED',
      payload: {
        providerName,
        installUrl: provider?.installUrl,
        message: error instanceof Error ? error.message : l10n('Failed to connect'),
      },
    });
  }
}

async function handleSetActiveAIProvider(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
  const providerName = payload.providerName ?? payload.name;

  if (!providerName) {
    await postAISettingsError(panel, l10n('No AI provider selected'));
    return;
  }

  const state = await setActiveAIProvider(context, providerName);

  await panel.webview.postMessage({
    type: 'AI_PROVIDER_STATE_UPDATED',
    payload: {
      ...state,
      providerName,
    },
  });
}

async function handleSetAIModel(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
  const providerName = payload.providerName ?? payload.name;

  if (!providerName || !payload.usage || !payload.model) {
    await postAISettingsError(panel, l10n('AI model update payload is invalid'));
    return;
  }

  const state = await setAIModel(context, providerName, payload.usage, payload.model);

  await panel.webview.postMessage({
    type: 'AI_MODEL_UPDATED',
    payload: {
      ...state,
      providerName,
    },
  });
}

async function handleOpenExternalUrl(payload: OpenExternalUrlPayload = {}): Promise<void> {
  if (!payload.url) {
    return;
  }

  await vscode.env.openExternal(vscode.Uri.parse(payload.url));
}

async function handleSetSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: l10n('Save to this folder'),
    title: l10n('Choose a folder to save AI summaries'),
  });

  const selectedPath = selected?.[0]?.fsPath;

  if (!selectedPath) {
    return;
  }

  const state = await setSavePath(context, selectedPath);

  await panel.webview.postMessage({
    type: 'SAVE_PATH_SET',
    payload: state,
  });
}

async function handleClearSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = await setSavePath(context, null);

  await panel.webview.postMessage({
    type: 'SAVE_PATH_CLEARED',
    payload: state,
  });
}

async function handleAnalyzeDependencies(panel: vscode.WebviewPanel, payload: AnalyzeDependenciesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOAD_FAILED',
      payload: {
        message: l10n('No Git repository detected'),
      },
    });
    return;
  }

  try {
    const edges = await analyzeDependencies(repoPath, payload.filePaths ?? [], payload.commitHash ?? '');

    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOADED',
      payload: {
        edges,
      },
    });
  } catch (error) {
    const message =
      error instanceof DependencyCruiserNotFoundError
        ? 'dependency-cruiser is not installed. Run pnpm install and try again.'
        : error instanceof Error
          ? error.message
          : 'Failed to analyze dependencies';

    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOAD_FAILED',
      payload: {
        message,
      },
    });
  }
}

async function handleAnalyzeSymbolGraph(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AnalyzeSymbolGraphPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath || !payload.filePath) {
    await panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_LOAD_FAILED',
      payload: { message: l10n('Failed to analyze symbol graph') },
    });
    return;
  }

  try {
    const commitHash = payload.commitHash ?? '';
    const result = await analyzeSymbolGraph(repoPath, payload.filePath, commitHash);
    await panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_LOADED',
      payload: result,
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_LOAD_FAILED',
      payload: { message: error instanceof Error ? error.message : l10n('Failed to analyze symbol graph') },
    });
  }
  void context;
}

async function handleFetchCommits(panel: vscode.WebviewPanel, payload: FetchCommitsPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'GIT_REPOSITORY_NOT_FOUND',
      payload: {
        message: 'No Git repository detected',
      },
    });
    return;
  }

  try {
    const page = payload.page ?? 0;
    const pageSize = payload.pageSize ?? 200;
    const requestId = payload.requestId;
    const excludeKeywords = (payload.filterExcludeKeyword ?? '')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const result = await fetchCommits({
      repoPath,
      page,
      pageSize,
      dateStart: payload.filterDateStart,
      dateEnd: payload.filterDateEnd,
      author: payload.filterAuthor,
      keyword: payload.filterKeyword,
      sortOrder: payload.sortOrder,
      excludeKeywords,
    });
    const filteredCount = result.rawCount;
    const hasMore = payload.sortOrder === 'asc'
      ? (await fetchCommitCount({
          repoPath,
          dateStart: payload.filterDateStart,
          dateEnd: payload.filterDateEnd,
          author: payload.filterAuthor,
          keyword: payload.filterKeyword,
        })) > (page + 1) * pageSize
      : filteredCount >= pageSize;

    await panel.webview.postMessage({
      type: 'COMMITS_LOADED',
      payload: {
        commits: result.commits,
        page,
        pageSize,
        ...(requestId !== undefined ? { requestId } : {}),
        hasMore,
      },
    });
  } catch (error) {
    if (error instanceof GitRepositoryNotFoundError) {
      await panel.webview.postMessage({
        type: 'GIT_REPOSITORY_NOT_FOUND',
        payload: {
          message: 'No Git repository detected',
        },
      });
      return;
    }

    await panel.webview.postMessage({
      type: 'COMMITS_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load commit list',
      },
    });
  }
}

async function handleFetchChangedFiles(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: FetchChangedFilesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: 'No Git repository detected',
      },
    });
    return;
  }

  if (!payload.commitHash) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: 'No commit selected',
      },
    });
    return;
  }

  try {
    const settings = loadAISettingsState(context);
    const changedFiles = await fetchChangedFiles(repoPath, payload.commitHash, payload.savePath ?? settings.savePath, payload.commitMessage);

    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOADED',
      payload: {
        files: changedFiles.files,
        hasSavedCommitSummary: changedFiles.hasSavedCommitSummary,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load changed files',
      },
    });
  }
}

async function handleFetchFileDiff(panel: vscode.WebviewPanel, payload: FetchFileDiffPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: 'No Git repository detected',
      },
    });
    return;
  }

  if (!payload.commitHash || !payload.filePath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: 'No file selected',
      },
    });
    return;
  }

  try {
    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOADED',
      payload: diff,
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load diff',
      },
    });
  }
}

async function handleStartAISummaryCommit(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAISummaryCommitPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const settings = loadAISettingsState(context);
  const provider = payload.provider ?? settings.activeAIProvider;
  const savePath = payload.savePath ?? settings.savePath;
  const summaryModel = payload.summaryModel ?? settings.summaryModel;

  if (!repoPath) {
    await postAISummaryError(panel, 'No Git repository detected');
    return;
  }

  if (!payload.commitHash) {
    await postAISummaryError(panel, 'No commit selected');
    return;
  }

  if (!provider) {
    await postAISummaryError(panel, 'AI is not configured');
    return;
  }

  if (!savePath) {
    await postAISummaryError(panel, 'Set a save path first');
    return;
  }

  try {
    if (!payload.forceRegenerate) {
      const savedSummary = loadCommitSummary(savePath, payload.commitHash, payload.commitMessage);

      if (savedSummary) {
        await panel.webview.postMessage({
          type: 'AI_SUMMARY_LOADED',
          payload: {
            content: savedSummary.content,
            savedPath: savedSummary.savedPath,
            provider,
            fromSaved: true,
          },
        });
        return;
      }
    }

    const diff = await fetchCommitFullDiff(repoPath, payload.commitHash);

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_TOKEN_WARNING',
      payload: {
        isOverLimit: diff.length > COMMIT_TOKEN_LIMIT_CHARS,
      },
    });

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_STARTED',
      payload: {
        provider,
      },
    });

    const prompt = buildCommitSummaryPrompt(payload.commitHash, diff);
    let content = '';

    streamAISummary({
      provider,
      model: summaryModel,
      prompt,
      onChunk: (chunk) => {
        content += chunk;
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_CHUNK',
          payload: {
            chunk,
          },
        });
      },
      onComplete: () => {
        try {
          const savedPath = saveCommitSummary(savePath, payload.commitHash ?? '', content, payload.commitMessage);
          void panel.webview.postMessage({
            type: 'AI_SUMMARY_DONE',
            payload: {
              content,
              savedPath,
              provider,
            },
          });
        } catch (error) {
          void postAISummaryError(panel, getSummarySaveErrorMessage(error));
        }
      },
      onError: (message) => {
        void postAISummaryError(panel, message);
      },
    });
  } catch (error) {
    await postAISummaryError(panel, error instanceof Error ? error.message : 'Generation failed');
  }
}

async function handleStartAISummaryFile(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAISummaryFilePayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const settings = loadAISettingsState(context);
  const provider = payload.provider ?? settings.activeAIProvider;
  const savePath = payload.savePath ?? settings.savePath;
  const summaryModel = payload.summaryModel ?? settings.summaryModel;

  if (!repoPath) {
    await postAISummaryError(panel, 'No Git repository detected');
    return;
  }

  if (!payload.commitHash || !payload.filePath) {
    await postAISummaryError(panel, 'No file selected');
    return;
  }

  if (!provider) {
    await postAISummaryError(panel, 'AI is not configured');
    return;
  }

  if (!savePath) {
    await postAISummaryError(panel, 'Set a save path first');
    return;
  }

  try {
    if (!payload.forceRegenerate) {
      const savedSummary = loadSummary(savePath, payload.commitHash, payload.filePath, payload.commitMessage);

      if (savedSummary) {
        await panel.webview.postMessage({
          type: 'AI_SUMMARY_LOADED',
          payload: {
            content: savedSummary.content,
            savedPath: savedSummary.savedPath,
            provider,
            fromSaved: true,
          },
        });
        return;
      }
    }

    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_STARTED',
      payload: {
        provider,
      },
    });

    const prompt = buildFileSummaryPrompt(payload.filePath, diff.rawDiff);
    let content = '';

    streamAISummary({
      provider,
      model: summaryModel,
      prompt,
      onChunk: (chunk) => {
        content += chunk;
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_CHUNK',
          payload: {
            chunk,
          },
        });
      },
      onComplete: () => {
        try {
          const savedPath = saveSummary(savePath, payload.commitHash ?? '', payload.filePath ?? '', content, payload.commitMessage);
          void panel.webview.postMessage({
            type: 'AI_SUMMARY_DONE',
            payload: {
              content,
              savedPath,
              provider,
            },
          });
        } catch (error) {
          void postAISummaryError(panel, getSummarySaveErrorMessage(error));
        }
      },
      onError: (message) => {
        void postAISummaryError(panel, message);
      },
    });
  } catch (error) {
    await postAISummaryError(panel, error instanceof Error ? error.message : 'Generation failed');
  }
}

async function handleStartAIQA(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAIQAPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const settings = loadAISettingsState(context);
  const provider = payload.provider ?? settings.activeAIProvider;
  const savePath = payload.savePath ?? settings.savePath;
  const qaModel = payload.qaModel ?? settings.qaModel;

  if (!repoPath) {
    await postAIQAError(panel, 'No Git repository detected');
    return;
  }

  if (!provider) {
    await postAIQAError(panel, 'AI is not configured');
    return;
  }

  if (!savePath || !payload.commitHash) {
    await postAIQAError(panel, 'Saved summary could not be found');
    return;
  }

  if (!payload.question || !payload.summaryContent) {
    await postAIQAError(panel, 'Question payload is incomplete');
    return;
  }

  const savedPath = payload.filePath
    ? loadSummary(savePath, payload.commitHash, payload.filePath, payload.commitMessage)?.savedPath
    : loadCommitSummary(savePath, payload.commitHash, payload.commitMessage)?.savedPath;

  if (!savedPath) {
    await postAIQAError(panel, 'Saved summary could not be found');
    return;
  }

  const diff = payload.diff ?? (
    payload.filePath
      ? (await fetchFileDiff(repoPath, payload.commitHash, payload.filePath)).rawDiff
      : await fetchCommitFullDiff(repoPath, payload.commitHash)
  );

  if (!diff) {
    await postAIQAError(panel, 'Diff could not be loaded for Q&A');
    return;
  }

  const prompt = buildSummaryQAPrompt(payload.summaryContent, diff, payload.question);
  let answer = '';

  streamAISummary({
    provider,
    model: qaModel,
    prompt,
    onChunk: (chunk) => {
      answer += chunk;
      void panel.webview.postMessage({
        type: 'AI_QA_CHUNK',
        payload: { chunk },
      });
    },
    onComplete: () => {
      try {
        const appendedContent = appendSummaryQA(savedPath, payload.question ?? '', answer);
        void panel.webview.postMessage({
          type: 'AI_QA_COMPLETE',
          payload: { appendedContent },
        });
      } catch (error) {
        void postAIQAError(panel, getSummarySaveErrorMessage(error));
      }
    },
    onError: (message) => {
      void postAIQAError(panel, message);
    },
  });
}

async function postAISummaryError(panel: vscode.WebviewPanel, message: string): Promise<void> {
  await panel.webview.postMessage({
    type: 'AI_SUMMARY_ERROR',
    payload: {
      message,
    },
  });
}

async function postAIQAError(panel: vscode.WebviewPanel, message: string): Promise<void> {
  await panel.webview.postMessage({
    type: 'AI_QA_ERROR',
    payload: { message },
  });
}

function getSummarySaveErrorMessage(error: unknown): string {
  if (error instanceof SummarySaveError) {
    return error.message;
  }

  return error instanceof Error ? error.message : 'Generation failed';
}

async function postAISettingsError(panel: vscode.WebviewPanel, message: string): Promise<void> {
  await panel.webview.postMessage({
    type: 'AI_SETTINGS_ERROR',
    payload: {
      message,
    },
  });
}
