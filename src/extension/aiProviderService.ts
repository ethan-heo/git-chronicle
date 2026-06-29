import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import type { AIModelUsage, AIProviderDefinition, AIProviderModelMap, AIProviderName } from './aiTypes';

const execFileAsync = promisify(execFile);

const REGISTERED_PROVIDERS_KEY = 'gitChronicle.registeredProviders';
const ACTIVE_PROVIDER_KEY = 'gitChronicle.activeAIProvider';
const SAVE_PATH_KEY = 'gitChronicle.savePath';
const SUMMARY_MODEL_KEY = 'gitRewind.summaryModelPerProvider';
const QA_MODEL_KEY = 'gitRewind.qaModelPerProvider';

export const AI_PROVIDER_MODELS: Record<AIProviderName, readonly string[]> = {
  claude: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'],
  gemini: ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  codex: ['gpt-4o-mini', 'gpt-4o', 'o4-mini'],
};

const DEFAULT_SUMMARY_MODELS: AIProviderModelMap = {
  claude: 'claude-haiku-4-5',
  gemini: 'gemini-2.0-flash-lite',
  codex: 'gpt-4o-mini',
};

const DEFAULT_QA_MODELS: AIProviderModelMap = {
  claude: 'claude-haiku-4-5',
  gemini: 'gemini-2.0-flash-lite',
  codex: 'gpt-4o-mini',
};

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
  summaryModel: string | null;
  qaModel: string | null;
  summaryModelPerProvider: AIProviderModelMap;
  qaModelPerProvider: AIProviderModelMap;
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
    return { installed: false, error: 'Unknown AI provider' };
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
      error: isNotFound || message.includes('ENOENT') ? 'CLI was not detected. Check the installation page.' : 'Connection failed',
      reason: isNotFound || message.includes('ENOENT') ? 'not-found' : 'failed',
    };
  }
}

export async function registerAIProvider(context: vscode.ExtensionContext, providerName: AIProviderName): Promise<AISettingsState> {
  const checkResult = await checkCLIInstalled(providerName);

  if (!checkResult.installed) {
    throw new Error(checkResult.error ?? 'Connection failed');
  }

  const state = loadAISettingsState(context);
  const registeredProviders = Array.from(new Set([...state.registeredProviders, providerName]));
  const nextState = {
    ...state,
    registeredProviders,
    activeAIProvider: providerName,
    summaryModelPerProvider: ensureModelSelection(state.summaryModelPerProvider, providerName, 'summary'),
    qaModelPerProvider: ensureModelSelection(state.qaModelPerProvider, providerName, 'qa'),
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
    summaryModelPerProvider: activeAIProvider ? ensureModelSelection(state.summaryModelPerProvider, activeAIProvider, 'summary') : state.summaryModelPerProvider,
    qaModelPerProvider: activeAIProvider ? ensureModelSelection(state.qaModelPerProvider, activeAIProvider, 'qa') : state.qaModelPerProvider,
  };

  await persistAISettingsState(context, nextState);

  return nextState;
}

export async function setSavePath(context: vscode.ExtensionContext, savePath: string | null): Promise<AISettingsState> {
  await context.globalState.update(SAVE_PATH_KEY, savePath ?? undefined);

  return loadAISettingsState(context);
}

export async function setAIModel(
  context: vscode.ExtensionContext,
  providerName: AIProviderName,
  usage: AIModelUsage,
  model: string,
): Promise<AISettingsState> {
  const state = loadAISettingsState(context);
  const nextState = {
    ...state,
    summaryModelPerProvider: usage === 'summary' ? { ...state.summaryModelPerProvider, [providerName]: model } : state.summaryModelPerProvider,
    qaModelPerProvider: usage === 'qa' ? { ...state.qaModelPerProvider, [providerName]: model } : state.qaModelPerProvider,
  };

  await persistAISettingsState(context, nextState);

  return loadAISettingsState(context);
}

export function loadAISettingsState(context: vscode.ExtensionContext): AISettingsState {
  const configuration = vscode.workspace.getConfiguration('gitChronicle');
  const configuredActiveProvider = normalizeProviderName(configuration.get<string>('activeAIProvider'));
  const configuredSavePath = configuration.get<string>('savePath')?.trim() || null;
  const registeredProviders = normalizeProviderNames(context.globalState.get<AIProviderName[]>(REGISTERED_PROVIDERS_KEY, []));
  const activeAIProvider = normalizeProviderName(context.globalState.get<string>(ACTIVE_PROVIDER_KEY)) ?? configuredActiveProvider;
  const savePath = context.globalState.get<string>(SAVE_PATH_KEY) || configuredSavePath;
  const summaryModelPerProvider = normalizeModelMap(context.globalState.get<Partial<Record<AIProviderName, string>>>(SUMMARY_MODEL_KEY), DEFAULT_SUMMARY_MODELS);
  const qaModelPerProvider = normalizeModelMap(context.globalState.get<Partial<Record<AIProviderName, string>>>(QA_MODEL_KEY), DEFAULT_QA_MODELS);

  return {
    registeredProviders,
    activeAIProvider,
    savePath,
    summaryModel: activeAIProvider ? summaryModelPerProvider[activeAIProvider] : null,
    qaModel: activeAIProvider ? qaModelPerProvider[activeAIProvider] : null,
    summaryModelPerProvider,
    qaModelPerProvider,
  };
}

async function persistAISettingsState(context: vscode.ExtensionContext, state: AISettingsState): Promise<void> {
  await Promise.all([
    context.globalState.update(REGISTERED_PROVIDERS_KEY, state.registeredProviders),
    context.globalState.update(ACTIVE_PROVIDER_KEY, state.activeAIProvider ?? undefined),
    context.globalState.update(SUMMARY_MODEL_KEY, state.summaryModelPerProvider),
    context.globalState.update(QA_MODEL_KEY, state.qaModelPerProvider),
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

function normalizeModelMap(
  models: Partial<Record<AIProviderName, string>> | undefined,
  defaults: AIProviderModelMap,
): AIProviderModelMap {
  return {
    claude: sanitizeModelName('claude', models?.claude) ?? defaults.claude,
    gemini: sanitizeModelName('gemini', models?.gemini) ?? defaults.gemini,
    codex: sanitizeModelName('codex', models?.codex) ?? defaults.codex,
  };
}

function sanitizeModelName(providerName: AIProviderName, model: string | undefined): string | null {
  if (!model) {
    return null;
  }

  return AI_PROVIDER_MODELS[providerName].includes(model) ? model : null;
}

function ensureModelSelection(
  models: AIProviderModelMap,
  providerName: AIProviderName,
  usage: AIModelUsage,
): AIProviderModelMap {
  const nextModel = sanitizeModelName(providerName, models[providerName]) ?? getDefaultModel(providerName, usage);
  return {
    ...models,
    [providerName]: nextModel,
  };
}

export function getDefaultModel(providerName: AIProviderName, usage: AIModelUsage): string {
  return usage === 'summary' ? DEFAULT_SUMMARY_MODELS[providerName] : DEFAULT_QA_MODELS[providerName];
}
