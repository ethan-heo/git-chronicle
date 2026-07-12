import * as vscode from 'vscode';
import { handleAnalyzeDependencies, type AnalyzeDependenciesPayload } from './messageHandler/dependencyHandlers';
import { handleAnalyzeSymbolGraph, type AnalyzeSymbolGraphPayload } from './messageHandler/symbolHandlers';
import {
  handleClearSavePath,
  handleFetchAISummarySettings,
  handleOpenExternalUrl,
  handleRegisterAIProvider,
  handleSetActiveAIProvider,
  handleSetAIModel,
  handleSetSavePath,
  handleStartAISummaryCommit,
  handleStartAISummaryFile,
  handleStartAIQA,
  type AIProviderPayload,
  type OpenExternalUrlPayload,
  type StartAISummaryCommitPayload,
  type StartAISummaryFilePayload,
  type StartAIQAPayload,
} from './messageHandler/aiHandlers';
import { handleFetchChangedFiles, handleFetchCommits, handleFetchFileDiff, type FetchChangedFilesPayload, type FetchCommitsPayload, type FetchFileDiffPayload } from './messageHandler/gitHandlers';
import {
  handleConnectGithub,
  handleFetchGithubAuthState,
  handleFetchIssueDetail,
  handleFetchIssueRelatedCommits,
  handleFetchIssues,
  handleFetchPRDetail,
  handleFetchPRRelatedCommits,
  handleFetchPullRequests,
  type FetchIssueDetailPayload,
  type FetchIssuesPayload,
  type FetchPRDetailPayload,
  type FetchPullRequestsPayload,
  type FetchRelatedCommitsPayload,
} from './messageHandler/githubHandlers';
import {
  handleCreateNote,
  handleDeleteNote,
  handleFetchNote,
  handleFetchNoteTree,
  handleMoveNote,
  handleSaveNote,
  type NotePayload,
} from './messageHandler/noteHandlers';
import { l10n } from './messageHandler/shared';

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
    | OpenExternalUrlPayload
    | NotePayload
    | FetchPullRequestsPayload
    | FetchIssuesPayload
    | FetchPRDetailPayload
    | FetchIssueDetailPayload
    | FetchRelatedCommitsPayload;
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
      case 'FETCH_NOTE':
        await handleFetchNote(panel, message.payload as NotePayload);
        break;
      case 'FETCH_NOTE_TREE':
        await handleFetchNoteTree(panel, context, message.payload as NotePayload);
        break;
      case 'CREATE_NOTE':
        await handleCreateNote(panel, context, message.payload as NotePayload);
        break;
      case 'DELETE_NOTE':
        await handleDeleteNote(panel, context, message.payload as NotePayload);
        break;
      case 'MOVE_NOTE':
        await handleMoveNote(panel, context, message.payload as NotePayload);
        break;
      case 'SAVE_NOTE':
        await handleSaveNote(panel, context, message.payload as NotePayload);
        break;
      case 'FETCH_GITHUB_AUTH_STATE':
        await handleFetchGithubAuthState(panel);
        break;
      case 'CONNECT_GITHUB':
        await handleConnectGithub(panel);
        break;
      case 'FETCH_PULL_REQUESTS':
        await handleFetchPullRequests(panel, message.payload as FetchPullRequestsPayload);
        break;
      case 'FETCH_ISSUES':
        await handleFetchIssues(panel, message.payload as FetchIssuesPayload);
        break;
      case 'FETCH_PR_DETAIL':
        await handleFetchPRDetail(panel, message.payload as FetchPRDetailPayload);
        break;
      case 'FETCH_ISSUE_DETAIL':
        await handleFetchIssueDetail(panel, message.payload as FetchIssueDetailPayload);
        break;
      case 'FETCH_PR_RELATED_COMMITS':
        await handleFetchPRRelatedCommits(panel, message.payload as FetchRelatedCommitsPayload);
        break;
      case 'FETCH_ISSUE_RELATED_COMMITS':
        await handleFetchIssueRelatedCommits(panel, message.payload as FetchRelatedCommitsPayload);
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
