import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import type { AIProviderName } from './aiTypes';

interface StreamAISummaryOptions {
  provider: AIProviderName;
  prompt: string;
  timeoutMs?: number;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

const DEFAULT_TIMEOUT_MS = 120_000;

export function streamAISummary(options: StreamAISummaryOptions): () => void {
  const { provider, prompt, onChunk, onComplete, onError } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const [command, args] = getProviderCommand(provider);
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

    onError(stderr.trim() || 'Generation failed');
  });

  process.stdin.end(prompt);

  return () => {
    if (!settled) {
      settled = true;
      clearTimeout(timeout);
      process.kill('SIGTERM');
    }
  };
}

function getProviderCommand(provider: AIProviderName): [string, string[]] {
  if (provider === 'claude') {
    return ['claude', ['-p']];
  }

  if (provider === 'gemini') {
    return ['gemini', ['-p']];
  }

  return ['codex', ['exec', '-']];
}
