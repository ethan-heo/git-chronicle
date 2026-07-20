import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import type { AIProviderName, AIUsageInfo } from './aiTypes';

interface StreamAISummaryOptions {
  provider: AIProviderName;
  prompt: string;
  model?: string | null;
  timeoutMs?: number;
  onChunk: (chunk: string) => void;
  onComplete: (usage: AIUsageInfo | null) => void;
  onError: (message: string) => void;
}

const DEFAULT_TIMEOUT_MS = 120_000;

export function streamAISummary(options: StreamAISummaryOptions): () => void {
  const { provider, prompt, onChunk, onComplete, onError } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const invocation = getProviderCommand(provider, options.model ?? null, prompt);
  const { command, args, stdinPrompt } = invocation;
  let settled = false;
  let stderr = '';
  let usage: AIUsageInfo | null = null;
  let stdoutBuffer = '';

  let process: ChildProcessWithoutNullStreams;

  try {
    process = spawn(command, args, {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    onError('Connected CLI was not found. Check your settings.');
    return () => undefined;
  }

  const timeout = setTimeout(() => {
    if (settled) {
      return;
    }

    settled = true;
    process.kill('SIGTERM');
    onError('Generation failed');
  }, timeoutMs);

  process.stdout.on('data', (data: Buffer) => {
    const chunk = data.toString();

    if (provider === 'gemini') {
      onChunk(chunk);
      return;
    }

    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      usage = parseProviderJsonLine(provider, line, onChunk, usage);
    }
  });

  process.stderr.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  process.on('error', () => {
    if (settled) {
      return;
    }

    settled = true;
    clearTimeout(timeout);
    onError('Connected CLI was not found. Check your settings.');
  });

  process.on('close', (code) => {
    if (settled) {
      return;
    }

    settled = true;
    clearTimeout(timeout);

    if (code === 0) {
      if (provider !== 'gemini' && stdoutBuffer.trim()) {
        usage = parseProviderJsonLine(provider, stdoutBuffer, onChunk, usage);
      }

      onComplete(provider === 'gemini' ? null : usage);
      return;
    }

    onError(getCLIErrorMessage(provider, stderr));
  });

  process.stdin.end(stdinPrompt ?? undefined);

  return () => {
    if (!settled) {
      settled = true;
      clearTimeout(timeout);
      process.kill('SIGTERM');
    }
  };
}

interface ProviderCommand {
  command: string;
  args: string[];
  stdinPrompt?: string;
}

const AUTH_ERROR_PATTERNS: Record<AIProviderName, readonly RegExp[]> = {
  claude: [/login/i, /auth/i, /api key/i, /unauthorized/i, /invalid api key/i],
  gemini: [/login/i, /auth/i, /credential/i, /api key/i, /unauthorized/i, /authenticated/i],
  codex: [/login/i, /auth/i, /unauthorized/i, /not logged in/i, /authentication/i],
};

export function getCLIErrorMessage(provider: AIProviderName, stderr: string): string {
  const message = stderr.trim();

  if (!message) {
    return 'Generation failed';
  }

  if (AUTH_ERROR_PATTERNS[provider].some((pattern) => pattern.test(message))) {
    return getAuthRequiredMessage(provider);
  }

  return message;
}

function getAuthRequiredMessage(provider: AIProviderName): string {
  if (provider === 'claude') {
    return 'Claude CLI is installed but not logged in. Run `claude login` in your terminal and try again.';
  }

  if (provider === 'gemini') {
    return 'Gemini CLI is installed but not authenticated. Run `gemini` in your terminal and complete the login flow, then try again.';
  }

  return 'Codex CLI is installed but not logged in. Run `codex login` in your terminal and try again.';
}

export function getProviderCommand(provider: AIProviderName, model: string | null, prompt: string): ProviderCommand {
  if (provider === 'claude') {
    return {
      command: 'claude',
      args: model
        ? ['--model', model, '-p', '--output-format', 'stream-json', '--include-partial-messages', '--verbose']
        : ['-p', '--output-format', 'stream-json', '--include-partial-messages', '--verbose'],
      stdinPrompt: prompt,
    };
  }

  if (provider === 'gemini') {
    return {
      command: 'gemini',
      args: model ? ['--model', model, '--skip-trust', '--prompt', prompt] : ['--skip-trust', '--prompt', prompt],
    };
  }

  return {
    command: 'codex',
    args: model
      ? ['exec', '--skip-git-repo-check', '--model', model, '--json', '-']
      : ['exec', '--skip-git-repo-check', '--json', '-'],
    stdinPrompt: prompt,
  };
}

export function parseProviderJsonLine(
  provider: Exclude<AIProviderName, 'gemini'>,
  line: string,
  onChunk: (chunk: string) => void,
  currentUsage: AIUsageInfo | null,
): AIUsageInfo | null {
  try {
    const parsed = JSON.parse(line) as Record<string, unknown>;

    if (provider === 'claude') {
      // "assistant" events carry the same turn's text already emitted incrementally via
      // content_block_delta above — handling both would double every chunk.
      const event = parsed.type === 'stream_event' ? asRecord(parsed.event) : null;
      const delta = event?.type === 'content_block_delta' ? asRecord(event.delta) : null;

      if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
        onChunk(delta.text);
      }

      if (parsed.type === 'result') {
        const parsedUsage = asRecord(parsed.usage);
        return toUsageInfo(parsedUsage?.input_tokens, parsedUsage?.output_tokens, parsed.total_cost_usd);
      }

      return currentUsage;
    }

    if (parsed.type === 'item.completed') {
      const item = asRecord(parsed.item);
      if (item?.type === 'agent_message' && typeof item.text === 'string') {
        onChunk(item.text);
      }
      return currentUsage;
    }

    if (parsed.type === 'turn.completed') {
      const parsedUsage = asRecord(parsed.usage);
      return toUsageInfo(parsedUsage?.input_tokens, parsedUsage?.output_tokens, null);
    }
  } catch {
    return currentUsage;
  }

  return currentUsage;
}

function toUsageInfo(inputTokens: unknown, outputTokens: unknown, costUsd: unknown): AIUsageInfo | null {
  if (typeof inputTokens !== 'number' || typeof outputTokens !== 'number') {
    return null;
  }

  return {
    inputTokens,
    outputTokens,
    costUsd: typeof costUsd === 'number' ? costUsd : null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}
