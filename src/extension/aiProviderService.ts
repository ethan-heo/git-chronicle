import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import type { AIProviderDefinition, AIProviderName } from './aiTypes';

const execFileAsync = promisify(execFile);

const REGISTERED_PROVIDERS_KEY = 'gitChronicle.registeredProviders';
const ACTIVE_PROVIDER_KEY = 'gitChronicle.activeAIProvider';
const SAVE_PATH_KEY = 'gitChronicle.savePath';

export const AI_PROVIDERS: AIProviderDefinition[] = [
  {
    name: 'claude',
    label: 'Claude',
    installUrl: 'https://docs.anthropic.com/claude-code',
    checkCommand: 'claude --version',
  },
  {
    name: 'gemini',
    label: 'Gemini',
    installUrl: 'https://github.com/google-gemini/gemini-cli',
    checkCommand: 'gemini --version',
  },
  {
    name: 'codex',
    label: 'Codex',
    installUrl: 'https://github.com/openai/codex',
    checkCommand: 'codex --version',
  },
];

export interface AISettingsState {
  registeredProviders: AIProviderName[];
  activeAIProvider: AIProviderName | null;
  savePath: string | null;
}

export interface CheckCLIResult {
  installed: boolean;
  version?: string;
  error?: string;
  reason?: 'not-found' | 'failed';
}

export async function checkCLIInstalled(providerName: AIProviderName): Promise<CheckCLIResult> {
  const provider = AI_PROVIDERS.find((candidate) => candidate.name === providerName);

  if (!provider) {
    return { installed: false, error: '알 수 없는 AI 제공자입니다' };
  }

  const [command, ...args] = provider.checkCommand.split(' ');

  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 5000 });
    const version = stdout.trim() || stderr.trim();

    return {
      installed: true,
      ...(version ? { version } : {}),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isNotFound = 'code' in Object(error) && Object(error).code === 'ENOENT';

    return {
      installed: false,
      error: isNotFound || message.includes('ENOENT') ? 'CLI가 감지되지 않습니다. 설치 페이지를 확인하세요' : '연동에 실패했습니다',
      reason: isNotFound || message.includes('ENOENT') ? 'not-found' : 'failed',
    };
  }
}

export async function registerAIProvider(context: vscode.ExtensionContext, providerName: AIProviderName): Promise<AISettingsState> {
  const checkResult = await checkCLIInstalled(providerName);

  if (!checkResult.installed) {
    throw new Error(checkResult.error ?? '연동에 실패했습니다');
  }

  const state = loadAISettingsState(context);
  const registeredProviders = Array.from(new Set([...state.registeredProviders, providerName]));
  const nextState = {
    ...state,
    registeredProviders,
    activeAIProvider: providerName,
  };

  await persistAISettingsState(context, nextState);

  return nextState;
}

export async function setActiveAIProvider(context: vscode.ExtensionContext, providerName: AIProviderName): Promise<AISettingsState> {
  const state = loadAISettingsState(context);
  const registeredProviders = state.registeredProviders.includes(providerName)
    ? state.registeredProviders
    : [...state.registeredProviders, providerName];
  const activeAIProvider = state.activeAIProvider === providerName ? null : providerName;
  const nextState = {
    ...state,
    registeredProviders,
    activeAIProvider,
  };

  await persistAISettingsState(context, nextState);

  return nextState;
}

export async function setSavePath(context: vscode.ExtensionContext, savePath: string | null): Promise<AISettingsState> {
  await context.globalState.update(SAVE_PATH_KEY, savePath ?? undefined);

  return loadAISettingsState(context);
}

export function loadAISettingsState(context: vscode.ExtensionContext): AISettingsState {
  const configuration = vscode.workspace.getConfiguration('gitChronicle');
  const configuredActiveProvider = normalizeProviderName(configuration.get<string>('activeAIProvider'));
  const configuredSavePath = configuration.get<string>('savePath')?.trim() || null;
  const registeredProviders = normalizeProviderNames(context.globalState.get<AIProviderName[]>(REGISTERED_PROVIDERS_KEY, []));
  const activeAIProvider = normalizeProviderName(context.globalState.get<string>(ACTIVE_PROVIDER_KEY)) ?? configuredActiveProvider;
  const savePath = context.globalState.get<string>(SAVE_PATH_KEY) || configuredSavePath;

  return {
    registeredProviders,
    activeAIProvider,
    savePath,
  };
}

async function persistAISettingsState(context: vscode.ExtensionContext, state: AISettingsState): Promise<void> {
  await Promise.all([
    context.globalState.update(REGISTERED_PROVIDERS_KEY, state.registeredProviders),
    context.globalState.update(ACTIVE_PROVIDER_KEY, state.activeAIProvider ?? undefined),
  ]);
}

function normalizeProviderNames(names: readonly AIProviderName[]): AIProviderName[] {
  return names.filter((name): name is AIProviderName => isAIProviderName(name));
}

function normalizeProviderName(name: string | undefined | null): AIProviderName | null {
  return name && isAIProviderName(name) ? name : null;
}

function isAIProviderName(name: string): name is AIProviderName {
  return AI_PROVIDERS.some((provider) => provider.name === name);
}
