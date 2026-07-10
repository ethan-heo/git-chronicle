import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as vscode from 'vscode';
import { loadAISettingsState, setAIModel, setActiveAIProvider, setSavePath } from '../../src/extension/aiProviderService';

const { getConfiguration } = vi.hoisted(() => ({
  getConfiguration: vi.fn(),
}));

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration,
  },
}));

interface MementoLike {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: unknown): Promise<void>;
}

function createMemento(initialState: Record<string, unknown> = {}): MementoLike & { state: Record<string, unknown> } {
  const state = { ...initialState };

  return {
    state,
    get<T>(key: string, defaultValue?: T): T | undefined {
      return (key in state ? (state[key] as T) : defaultValue);
    },
    async update(key: string, value: unknown): Promise<void> {
      if (value === undefined) {
        Reflect.deleteProperty(state, key);
        return;
      }

      state[key] = value;
    },
  };
}

function createContext({
  globalState = {},
  workspaceState = {},
}: {
  globalState?: Record<string, unknown>;
  workspaceState?: Record<string, unknown>;
} = {}): vscode.ExtensionContext {
  return {
    globalState: createMemento(globalState),
    workspaceState: createMemento(workspaceState),
  } as unknown as vscode.ExtensionContext;
}

describe('aiProviderService per-project settings', () => {
  beforeEach(() => {
    getConfiguration.mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'activeAIProvider') {
          return '';
        }

        if (key === 'savePath') {
          return '';
        }

        return undefined;
      }),
    });
  });

  it('loads project-scoped settings from workspaceState while keeping registered providers global', () => {
    const context = createContext({
      globalState: {
        'gitChronicle.registeredProviders': ['claude'],
        'gitChronicle.activeAIProvider': 'gemini',
        'gitChronicle.savePath': '/global/path',
      },
      workspaceState: {
        'gitChronicle.activeAIProvider': 'codex',
        'gitChronicle.savePath': '/workspace/path',
        'gitRewind.summaryModelPerProvider': {
          claude: 'claude-sonnet-5',
        },
        'gitRewind.qaModelPerProvider': {
          codex: 'gpt-4o-mini',
        },
      },
    });

    const state = loadAISettingsState(context);

    expect(state.registeredProviders).toEqual(['claude']);
    expect(state.activeAIProvider).toBe('codex');
    expect(state.savePath).toBe('/workspace/path');
    expect(state.summaryModelPerProvider.claude).toBe('claude-sonnet-5');
    expect(state.qaModelPerProvider.codex).toBe('gpt-5.4-mini');
  });

  it('falls back to configured values when workspaceState is empty', () => {
    getConfiguration.mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'activeAIProvider') {
          return 'gemini';
        }

        if (key === 'savePath') {
          return '  /configured/path  ';
        }

        return undefined;
      }),
    });

    const context = createContext({
      globalState: {
        'gitChronicle.registeredProviders': ['gemini'],
      },
    });

    const state = loadAISettingsState(context);

    expect(state.activeAIProvider).toBe('gemini');
    expect(state.savePath).toBe('/configured/path');
  });

  it('persists project settings into workspaceState only', async () => {
    const context = createContext({
      globalState: {
        'gitChronicle.registeredProviders': ['claude'],
      },
      workspaceState: {},
    });

    await setActiveAIProvider(context, 'codex');
    await setAIModel(context, 'codex', 'summary', 'gpt-5.4');
    await setSavePath(context, '/project/notes');

    expect(context.globalState.get('gitChronicle.registeredProviders')).toEqual(['claude', 'codex']);
    expect(context.globalState.get('gitChronicle.activeAIProvider')).toBeUndefined();
    expect(context.globalState.get('gitChronicle.savePath')).toBeUndefined();
    expect(context.globalState.get('gitRewind.summaryModelPerProvider')).toBeUndefined();

    expect(context.workspaceState.get('gitChronicle.activeAIProvider')).toBe('codex');
    expect(context.workspaceState.get('gitChronicle.savePath')).toBe('/project/notes');
    expect(context.workspaceState.get('gitRewind.summaryModelPerProvider')).toEqual({
      claude: 'claude-haiku-4-5',
      gemini: 'gemini-2.5-flash',
      codex: 'gpt-5.4',
    });
  });
});
