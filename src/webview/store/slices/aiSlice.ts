import type { StateCreator } from 'zustand';
import { isVSCodeRuntime } from '../../bridge/vscodeApi';
import type { AIProviderName } from '../../types/commit';
import type { AppState } from '../appStore';

export interface AISlice {
  savePath: string | null;
  registeredProviders: AIProviderName[];
  activeAIProvider: AIProviderName | null;
  summaryModel: string | null;
  qaModel: string | null;
  currentSummaryContent: string;
  isLoadingSummary: boolean;
  isGeneratingSummary: boolean;
  isGeneratingQA: boolean;
  summaryError: string | null;
  qaError: string | null;
  summarySavedPath: string | null;
  hasCurrentSavedSummary: boolean;
  isSummaryTokenLimitExceeded: boolean;
  activeSummaryCommitHash: string | null;
  activeSummaryTargetKey: string | null;
  completedSummaryCache: Record<string, { content: string; savedPath: string | null; provider: AIProviderName | null }>;
  summaryViewCache: Record<string, { content: string; savedPath: string | null; provider: AIProviderName | null; hasSavedSummary: boolean }>;

  setAISummarySettings: (settings: { savePath?: string | null; registeredProviders?: AIProviderName[]; activeAIProvider?: AIProviderName | null; summaryModel?: string | null; qaModel?: string | null }) => void;
  resetAISummary: () => void;
  startAISummaryLoading: (options?: { preserveSavedSummary?: boolean; commitHash?: string | null; targetKey?: string | null }) => void;
  startAISummaryGeneration: (options?: { preserveSavedSummary?: boolean; commitHash?: string | null; targetKey?: string | null }) => void;
  appendAISummaryChunk: (chunk: string) => void;
  completeAISummary: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null; scope?: 'commit' | 'file'; commitHash?: string | null; targetKey?: string | null }) => void;
  loadSavedAISummary: (payload: { content: string; savedPath?: string | null; provider?: AIProviderName | null; scope?: 'commit' | 'file'; commitHash?: string | null; targetKey?: string | null }) => void;
  failAISummary: (message?: string) => void;
  startAIQA: () => void;
  appendAIQAChunk: (chunk: string) => void;
  completeAIQA: (payload: { appendedContent: string }) => void;
  failAIQA: (message?: string) => void;
  setSummaryTokenWarning: (isOverLimit: boolean) => void;
}

export const createAISlice: StateCreator<AppState, [], [], AISlice> = (set) => ({
  savePath: isVSCodeRuntime() ? null : '.git-author',
  registeredProviders: isVSCodeRuntime() ? [] : ['claude', 'gemini'],
  activeAIProvider: isVSCodeRuntime() ? null : 'claude',
  summaryModel: isVSCodeRuntime() ? null : 'claude-haiku-4-5',
  qaModel: isVSCodeRuntime() ? null : 'claude-haiku-4-5',
  currentSummaryContent: '',
  isLoadingSummary: false,
  isGeneratingSummary: false,
  isGeneratingQA: false,
  summaryError: null,
  qaError: null,
  summarySavedPath: null,
  hasCurrentSavedSummary: false,
  isSummaryTokenLimitExceeded: false,
  activeSummaryCommitHash: null,
  activeSummaryTargetKey: null,
  completedSummaryCache: {},
  summaryViewCache: {},

  setAISummarySettings: (settings) => {
    set({
      ...(settings.savePath !== undefined ? { savePath: settings.savePath } : {}),
      ...(settings.registeredProviders !== undefined ? { registeredProviders: settings.registeredProviders } : {}),
      ...(settings.activeAIProvider !== undefined ? { activeAIProvider: settings.activeAIProvider } : {}),
      ...(settings.summaryModel !== undefined ? { summaryModel: settings.summaryModel } : {}),
      ...(settings.qaModel !== undefined ? { qaModel: settings.qaModel } : {}),
    });
  },

  resetAISummary: () => {
    set({
      currentSummaryContent: '',
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: null,
      hasCurrentSavedSummary: false,
      isSummaryTokenLimitExceeded: false,
      activeSummaryCommitHash: null,
      activeSummaryTargetKey: null,
    });
  },

  startAISummaryLoading: (options = {}) => {
    set((state) => ({
      currentSummaryContent: '',
      isLoadingSummary: true,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: options.preserveSavedSummary ? state.summarySavedPath : null,
      hasCurrentSavedSummary: options.preserveSavedSummary ? state.hasCurrentSavedSummary : false,
      activeSummaryCommitHash: options.commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: options.targetKey ?? state.activeSummaryTargetKey,
    }));
  },

  startAISummaryGeneration: (options = {}) => {
    set((state) => ({
      currentSummaryContent: '',
      isLoadingSummary: false,
      isGeneratingSummary: true,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: options.preserveSavedSummary ? state.summarySavedPath : null,
      hasCurrentSavedSummary: options.preserveSavedSummary ? state.hasCurrentSavedSummary : false,
      activeSummaryCommitHash: options.commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: options.targetKey ?? state.activeSummaryTargetKey,
    }));
  },

  appendAISummaryChunk: (chunk) => {
    set((state) => ({
      currentSummaryContent: `${state.currentSummaryContent}${chunk}`,
      isLoadingSummary: false,
      isGeneratingSummary: true,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
    }));
  },

  completeAISummary: ({ content, savedPath, provider, commitHash, targetKey }) => {
    set((state) => ({
      currentSummaryContent: content ?? state.currentSummaryContent,
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: savedPath ?? null,
      hasCurrentSavedSummary: true,
      activeSummaryCommitHash: commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: targetKey ?? state.activeSummaryTargetKey,
      completedSummaryCache: commitHash
        ? {
          ...state.completedSummaryCache,
          [commitHash]: {
            content: content ?? state.currentSummaryContent,
            savedPath: savedPath ?? null,
            provider: provider ?? null,
          },
        }
        : state.completedSummaryCache,
      summaryViewCache: (targetKey ?? state.activeSummaryTargetKey)
        ? {
          ...state.summaryViewCache,
          [targetKey ?? state.activeSummaryTargetKey ?? '']: {
            content: content ?? state.currentSummaryContent,
            savedPath: savedPath ?? null,
            provider: provider ?? null,
            hasSavedSummary: true,
          },
        }
        : state.summaryViewCache,
      ...(provider ? { activeAIProvider: provider } : {}),
    }));
  },

  loadSavedAISummary: ({ content, savedPath, provider, commitHash, targetKey }) => {
    set((state) => ({
      currentSummaryContent: content,
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: savedPath ?? null,
      hasCurrentSavedSummary: true,
      isSummaryTokenLimitExceeded: false,
      activeSummaryCommitHash: commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: targetKey ?? state.activeSummaryTargetKey,
      completedSummaryCache: commitHash
        ? {
          ...state.completedSummaryCache,
          [commitHash]: {
            content,
            savedPath: savedPath ?? null,
            provider: provider ?? null,
          },
        }
        : state.completedSummaryCache,
      summaryViewCache: (targetKey ?? state.activeSummaryTargetKey)
        ? {
          ...state.summaryViewCache,
          [targetKey ?? state.activeSummaryTargetKey ?? '']: {
            content,
            savedPath: savedPath ?? null,
            provider: provider ?? null,
            hasSavedSummary: true,
          },
        }
        : state.summaryViewCache,
      ...(provider ? { activeAIProvider: provider } : {}),
    }));
  },

  failAISummary: (message = 'Generation failed') => {
    set({
      isLoadingSummary: false,
      isGeneratingSummary: false,
      summaryError: message,
      isGeneratingQA: false,
    });
  },

  startAIQA: () => {
    set({
      isGeneratingQA: true,
      qaError: null,
    });
  },

  appendAIQAChunk: (chunk) => {
    set((state) => ({
      currentSummaryContent: `${state.currentSummaryContent}${chunk}`,
      isGeneratingQA: true,
      qaError: null,
    }));
  },

  completeAIQA: ({ appendedContent }) => {
    set((state) => ({
      currentSummaryContent: `${state.currentSummaryContent}${appendedContent}`,
      isGeneratingQA: false,
      qaError: null,
    }));
  },

  failAIQA: (message = 'Q&A generation failed') => {
    set({
      isGeneratingQA: false,
      qaError: message,
    });
  },

  setSummaryTokenWarning: (isOverLimit) => {
    set({
      isSummaryTokenLimitExceeded: isOverLimit,
    });
  },
});
