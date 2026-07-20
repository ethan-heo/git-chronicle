import type { StateCreator } from 'zustand';
import { isVSCodeRuntime } from '../../bridge/vscodeApi';
import { DEMO_AI_SUMMARY_VIEW_CACHE } from '../../demo/aiSummarySamples';
import type { AIProviderName, AIUsageInfo } from '../../types/commit';
import type { AppState } from '../appStore';

interface CachedSummaryEntry {
  content: string;
  savedPath: string | null;
  noteRelativePath: string | null;
  provider: AIProviderName | null;
  usage: AIUsageInfo | null;
}

interface SummaryViewCacheEntry extends CachedSummaryEntry {
  hasSavedSummary: boolean;
}

export interface AISlice {
  savePath: string | null;
  registeredProviders: AIProviderName[];
  activeAIProvider: AIProviderName | null;
  summaryModel: string | null;
  currentSummaryContent: string;
  currentSummaryUsage: AIUsageInfo | null;
  isLoadingSummary: boolean;
  isGeneratingSummary: boolean;
  isGeneratingQA: boolean;
  summaryError: string | null;
  qaError: string | null;
  summarySavedPath: string | null;
  summaryNoteRelativePath: string | null;
  hasCurrentSavedSummary: boolean;
  isSummaryTokenLimitExceeded: boolean;
  activeSummaryCommitHash: string | null;
  activeSummaryTargetKey: string | null;
  completedSummaryCache: Record<string, CachedSummaryEntry>;
  summaryViewCache: Record<string, SummaryViewCacheEntry>;

  setAISummarySettings: (settings: { savePath?: string | null; registeredProviders?: AIProviderName[]; activeAIProvider?: AIProviderName | null; summaryModel?: string | null }) => void;
  resetAISummary: () => void;
  startAISummaryLoading: (options?: { preserveSavedSummary?: boolean; commitHash?: string | null; targetKey?: string | null }) => void;
  startAISummaryGeneration: (options?: { preserveSavedSummary?: boolean; commitHash?: string | null; targetKey?: string | null }) => void;
  appendAISummaryChunk: (chunk: string) => void;
  completeAISummary: (payload: { content?: string; savedPath?: string | null; noteRelativePath?: string | null; provider?: AIProviderName | null; usage?: AIUsageInfo | null; scope?: 'commit' | 'file'; commitHash?: string | null; targetKey?: string | null }) => void;
  loadSavedAISummary: (payload: { content: string; savedPath?: string | null; noteRelativePath?: string | null; provider?: AIProviderName | null; scope?: 'commit' | 'file'; commitHash?: string | null; targetKey?: string | null }) => void;
  markCurrentSummarySaved: (payload: { content?: string; savedPath?: string | null; noteRelativePath: string; provider?: AIProviderName | null; commitHash?: string | null; targetKey?: string | null }) => void;
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
  summaryModel: isVSCodeRuntime() ? null : 'claude-haiku-4-5-20251001',
  currentSummaryContent: '',
  currentSummaryUsage: null,
  isLoadingSummary: false,
  isGeneratingSummary: false,
  isGeneratingQA: false,
  summaryError: null,
  qaError: null,
  summarySavedPath: null,
  summaryNoteRelativePath: null,
  hasCurrentSavedSummary: false,
  isSummaryTokenLimitExceeded: false,
  activeSummaryCommitHash: null,
  activeSummaryTargetKey: null,
  completedSummaryCache: {},
  summaryViewCache: isVSCodeRuntime() ? {} : DEMO_AI_SUMMARY_VIEW_CACHE,

  setAISummarySettings: (settings) => {
    set({
      ...(settings.savePath !== undefined ? { savePath: settings.savePath } : {}),
      ...(settings.registeredProviders !== undefined ? { registeredProviders: settings.registeredProviders } : {}),
      ...(settings.activeAIProvider !== undefined ? { activeAIProvider: settings.activeAIProvider } : {}),
      ...(settings.summaryModel !== undefined ? { summaryModel: settings.summaryModel } : {}),
    });
  },

  resetAISummary: () => {
    set({
      currentSummaryContent: '',
      currentSummaryUsage: null,
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: null,
      summaryNoteRelativePath: null,
      hasCurrentSavedSummary: false,
      isSummaryTokenLimitExceeded: false,
      activeSummaryCommitHash: null,
      activeSummaryTargetKey: null,
    });
  },

  startAISummaryLoading: (options = {}) => {
    set((state) => ({
      currentSummaryContent: '',
      currentSummaryUsage: null,
      isLoadingSummary: true,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: options.preserveSavedSummary ? state.summarySavedPath : null,
      summaryNoteRelativePath: options.preserveSavedSummary ? state.summaryNoteRelativePath : null,
      hasCurrentSavedSummary: options.preserveSavedSummary ? state.hasCurrentSavedSummary : false,
      activeSummaryCommitHash: options.commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: options.targetKey ?? state.activeSummaryTargetKey,
    }));
  },

  startAISummaryGeneration: (options = {}) => {
    set((state) => ({
      currentSummaryContent: '',
      currentSummaryUsage: null,
      isLoadingSummary: false,
      isGeneratingSummary: true,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: options.preserveSavedSummary ? state.summarySavedPath : null,
      summaryNoteRelativePath: options.preserveSavedSummary ? state.summaryNoteRelativePath : null,
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

  completeAISummary: ({ content, savedPath, noteRelativePath, provider, usage, commitHash, targetKey }) => {
    set((state) => ({
      currentSummaryContent: content ?? state.currentSummaryContent,
      currentSummaryUsage: usage ?? null,
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: savedPath ?? state.summarySavedPath,
      summaryNoteRelativePath: noteRelativePath ?? state.summaryNoteRelativePath,
      hasCurrentSavedSummary: Boolean(noteRelativePath),
      activeSummaryCommitHash: commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: targetKey ?? state.activeSummaryTargetKey,
      completedSummaryCache: commitHash
        ? {
          ...state.completedSummaryCache,
          [commitHash]: {
            content: content ?? state.currentSummaryContent,
            savedPath: savedPath ?? state.summarySavedPath,
            noteRelativePath: noteRelativePath ?? state.summaryNoteRelativePath,
            provider: provider ?? null,
            usage: usage ?? null,
          },
        }
        : state.completedSummaryCache,
      summaryViewCache: (targetKey ?? state.activeSummaryTargetKey)
        ? {
          ...state.summaryViewCache,
          [targetKey ?? state.activeSummaryTargetKey ?? '']: {
            content: content ?? state.currentSummaryContent,
            savedPath: savedPath ?? state.summarySavedPath,
            noteRelativePath: noteRelativePath ?? state.summaryNoteRelativePath,
            provider: provider ?? null,
            usage: usage ?? null,
            hasSavedSummary: Boolean(noteRelativePath),
          },
        }
        : state.summaryViewCache,
      ...(provider ? { activeAIProvider: provider } : {}),
    }));
  },

  loadSavedAISummary: ({ content, savedPath, noteRelativePath, provider, commitHash, targetKey }) => {
    set((state) => ({
      currentSummaryContent: content,
      currentSummaryUsage: null,
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: savedPath ?? null,
      summaryNoteRelativePath: noteRelativePath ?? null,
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
            noteRelativePath: noteRelativePath ?? null,
            provider: provider ?? null,
            usage: null,
          },
        }
        : state.completedSummaryCache,
      summaryViewCache: (targetKey ?? state.activeSummaryTargetKey)
        ? {
          ...state.summaryViewCache,
          [targetKey ?? state.activeSummaryTargetKey ?? '']: {
            content,
            savedPath: savedPath ?? null,
            noteRelativePath: noteRelativePath ?? null,
            provider: provider ?? null,
            usage: null,
            hasSavedSummary: true,
          },
        }
        : state.summaryViewCache,
      ...(provider ? { activeAIProvider: provider } : {}),
    }));
  },

  markCurrentSummarySaved: ({ content, savedPath, noteRelativePath, provider, commitHash, targetKey }) => {
    set((state) => ({
      currentSummaryContent: content ?? state.currentSummaryContent,
      summarySavedPath: savedPath ?? state.summarySavedPath,
      summaryNoteRelativePath: noteRelativePath,
      hasCurrentSavedSummary: true,
      activeSummaryCommitHash: commitHash ?? state.activeSummaryCommitHash,
      activeSummaryTargetKey: targetKey ?? state.activeSummaryTargetKey,
      completedSummaryCache: (commitHash ?? state.activeSummaryCommitHash)
        ? {
          ...state.completedSummaryCache,
          [commitHash ?? state.activeSummaryCommitHash ?? '']: {
            content: content ?? state.currentSummaryContent,
            savedPath: savedPath ?? state.summarySavedPath,
            noteRelativePath,
            provider: provider ?? null,
            usage: state.currentSummaryUsage,
          },
        }
        : state.completedSummaryCache,
      summaryViewCache: (targetKey ?? state.activeSummaryTargetKey)
        ? {
          ...state.summaryViewCache,
          [targetKey ?? state.activeSummaryTargetKey ?? '']: {
            content: content ?? state.currentSummaryContent,
            savedPath: savedPath ?? state.summarySavedPath,
            noteRelativePath,
            provider: provider ?? null,
            usage: state.currentSummaryUsage,
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
