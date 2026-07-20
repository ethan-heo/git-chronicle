import * as vscode from 'vscode';
import { AI_PROVIDERS, loadAISettingsState, registerAIProvider, setAIModel, setActiveAIProvider, setSavePath } from '../aiProviderService';
import { streamAISummary } from '../aiService';
import type { AIProviderName } from '../aiTypes';
import { filterDiffForSummary } from '../diffFilterService';
import { fetchCommitFullDiff, fetchFileDiff } from '../gitService';
import { readNote, NoteFileError } from '../noteFileService';
import { buildCommitSummaryPrompt, buildFileSummaryPrompt, buildSummaryQAPrompt } from '../prompts';
import { appendSummaryQA, SummarySaveError } from '../summaryFileService';
import { getLinkedNoteRelativePath } from '../summaryNoteLinkService';
import { getCurrentSummaryLanguage, l10n } from './shared';

const COMMIT_TOKEN_LIMIT_CHARS = 20_000;

export interface StartAISummaryCommitPayload {
  commitHash?: string;
  commitMessage?: string;
  provider?: AIProviderName | null;
  summaryModel?: string | null;
  savePath?: string | null;
  forceRegenerate?: boolean;
}

export interface StartAISummaryFilePayload extends StartAISummaryCommitPayload {
  filePath?: string;
}

export interface AIProviderPayload {
  name?: AIProviderName;
  providerName?: AIProviderName;
  model?: string;
}

export interface StartAIQAPayload {
  question?: string;
  diff?: string;
  summaryContent?: string;
  commitHash?: string;
  commitMessage?: string;
  filePath?: string;
  provider?: AIProviderName | null;
  savePath?: string | null;
  noteRelativePath?: string | null;
}

export interface OpenExternalUrlPayload {
  url?: string;
}

export async function handleFetchAISummarySettings(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = loadAISettingsState(context);

  await panel.webview.postMessage({
    type: 'AI_SUMMARY_SETTINGS_LOADED',
    payload: {
      ...state,
    },
  });
}

export async function handleRegisterAIProvider(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
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

export async function handleSetActiveAIProvider(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
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

export async function handleSetAIModel(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AIProviderPayload = {}): Promise<void> {
  const providerName = payload.providerName ?? payload.name;

  if (!providerName || !payload.model) {
    await postAISettingsError(panel, l10n('AI model update payload is invalid'));
    return;
  }

  const state = await setAIModel(context, providerName, payload.model);

  await panel.webview.postMessage({
    type: 'AI_MODEL_UPDATED',
    payload: {
      ...state,
      providerName,
    },
  });
}

export async function handleOpenExternalUrl(payload: OpenExternalUrlPayload = {}): Promise<void> {
  if (!payload.url) {
    return;
  }

  await vscode.env.openExternal(vscode.Uri.parse(payload.url));
}

export async function handleSetSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
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

export async function handleClearSavePath(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  const state = await setSavePath(context, null);

  await panel.webview.postMessage({
    type: 'SAVE_PATH_CLEARED',
    payload: state,
  });
}

export async function handleStartAISummaryCommit(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAISummaryCommitPayload = {}): Promise<void> {
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
      const linkedNoteRelativePath = getLinkedNoteRelativePath(context, { commitHash: payload.commitHash });

      if (linkedNoteRelativePath) {
        try {
          const linkedNote = readNote(savePath, linkedNoteRelativePath);
          await panel.webview.postMessage({
            type: 'AI_SUMMARY_LOADED',
            payload: {
              content: linkedNote.content,
              savedPath: linkedNote.savedPath,
              noteRelativePath: linkedNoteRelativePath,
              provider,
              fromSaved: true,
            },
          });
          return;
        } catch (error) {
          if (!(error instanceof NoteFileError) || error.code !== 'NOT_FOUND') {
            throw error;
          }
        }
      }
    }

    const diff = await fetchCommitFullDiff(repoPath, payload.commitHash);
    const filteredDiff = filterDiffForSummary(diff);

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_TOKEN_WARNING',
      payload: {
        isOverLimit: filteredDiff.length > COMMIT_TOKEN_LIMIT_CHARS,
      },
    });

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_STARTED',
      payload: {
        provider,
      },
    });

    const prompt = buildCommitSummaryPrompt(payload.commitHash, filteredDiff, payload.commitMessage, getCurrentSummaryLanguage());
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
      onComplete: (usage) => {
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_DONE',
          payload: {
            content,
            provider,
            usage,
          },
        });
      },
      onError: (message) => {
        void postAISummaryError(panel, message);
      },
    });
  } catch (error) {
    await postAISummaryError(panel, error instanceof Error ? error.message : 'Generation failed');
  }
}

export async function handleStartAISummaryFile(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAISummaryFilePayload = {}): Promise<void> {
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
      const linkedNoteRelativePath = getLinkedNoteRelativePath(context, {
        commitHash: payload.commitHash,
        filePath: payload.filePath,
      });

      if (linkedNoteRelativePath) {
        try {
          const linkedNote = readNote(savePath, linkedNoteRelativePath);
          await panel.webview.postMessage({
            type: 'AI_SUMMARY_LOADED',
            payload: {
              content: linkedNote.content,
              savedPath: linkedNote.savedPath,
              noteRelativePath: linkedNoteRelativePath,
              provider,
              fromSaved: true,
            },
          });
          return;
        } catch (error) {
          if (!(error instanceof NoteFileError) || error.code !== 'NOT_FOUND') {
            throw error;
          }
        }
      }
    }

    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    await panel.webview.postMessage({
      type: 'AI_SUMMARY_STARTED',
      payload: {
        provider,
      },
    });

    const prompt = buildFileSummaryPrompt(payload.filePath, diff.rawDiff, payload.commitMessage, getCurrentSummaryLanguage());
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
      onComplete: (usage) => {
        void panel.webview.postMessage({
          type: 'AI_SUMMARY_DONE',
          payload: {
            content,
            provider,
            usage,
          },
        });
      },
      onError: (message) => {
        void postAISummaryError(panel, message);
      },
    });
  } catch (error) {
    await postAISummaryError(panel, error instanceof Error ? error.message : 'Generation failed');
  }
}

export async function handleStartAIQA(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: StartAIQAPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const settings = loadAISettingsState(context);
  const provider = payload.provider ?? settings.activeAIProvider;
  const savePath = payload.savePath ?? settings.savePath;
  const summaryModel = settings.summaryModel;

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

  const linkedNoteRelativePath = payload.noteRelativePath ?? getLinkedNoteRelativePath(context, {
    commitHash: payload.commitHash,
    filePath: payload.filePath,
  });

  if (!linkedNoteRelativePath) {
    await postAIQAError(panel, 'Saved summary could not be found');
    return;
  }

  let savedPath: string;
  try {
    savedPath = readNote(savePath, linkedNoteRelativePath).savedPath;
  } catch (error) {
    await postAIQAError(panel, getSummarySaveErrorMessage(error));
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

  const prompt = buildSummaryQAPrompt(payload.summaryContent, diff, payload.question, getCurrentSummaryLanguage());
  let answer = '';

  streamAISummary({
    provider,
    model: summaryModel,
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
  if (error instanceof SummarySaveError || error instanceof NoteFileError) {
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
