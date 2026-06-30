import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import type { AIProviderName } from './aiTypes';

interface StreamAISummaryOptions {
  provider: AIProviderName;
  prompt: string;
  model?: string | null;
  timeoutMs?: number;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
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
    onChunk(data.toString());
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
      onComplete();
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
      args: model ? ['--model', model, '-p'] : ['-p'],
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
    args: model ? ['exec', '--skip-git-repo-check', '--model', model, '-'] : ['exec', '--skip-git-repo-check', '-'],
    stdinPrompt: prompt,
  };
}
