import { describe, expect, it } from 'vitest';
import { getCLIErrorMessage, getProviderCommand } from '../../src/extension/aiService';

describe('aiService', () => {
  it('keeps Claude on non-interactive print mode with stdin prompt delivery', () => {
    expect(getProviderCommand('claude', 'claude-haiku-4-5', 'Summarize this diff')).toEqual({
      command: 'claude',
      args: ['--model', 'claude-haiku-4-5', '-p'],
      stdinPrompt: 'Summarize this diff',
    });
  });

  it('passes Gemini prompts with the --prompt argument instead of stdin-only', () => {
    expect(getProviderCommand('gemini', 'gemini-2.5-flash', 'Summarize this diff')).toEqual({
      command: 'gemini',
      args: ['--model', 'gemini-2.5-flash', '--skip-trust', '--prompt', 'Summarize this diff'],
    });
  });

  it('adds the repository trust bypass while keeping stdin-based prompt delivery for Codex', () => {
    expect(getProviderCommand('codex', 'gpt-5.4-mini', 'Explain the commit')).toEqual({
      command: 'codex',
      args: ['exec', '--skip-git-repo-check', '--model', 'gpt-5.4-mini', '-'],
      stdinPrompt: 'Explain the commit',
    });
  });

  it('maps Claude authentication failures to a login instruction', () => {
    expect(getCLIErrorMessage('claude', 'Error: Unauthorized. Please login again.')).toBe(
      'Claude CLI is installed but not logged in. Run `claude login` in your terminal and try again.',
    );
  });

  it('maps Gemini authentication failures to a login instruction', () => {
    expect(getCLIErrorMessage('gemini', 'No valid credentials found. Please login.')).toBe(
      'Gemini CLI is installed but not authenticated. Run `gemini` in your terminal and complete the login flow, then try again.',
    );
  });

  it('maps Codex authentication failures to a login instruction', () => {
    expect(getCLIErrorMessage('codex', 'Not logged in. Run codex login.')).toBe(
      'Codex CLI is installed but not logged in. Run `codex login` in your terminal and try again.',
    );
  });

  it('keeps non-auth CLI stderr messages intact', () => {
    expect(getCLIErrorMessage('gemini', 'Rate limit exceeded')).toBe('Rate limit exceeded');
  });

  it('falls back to a generic generation failure when stderr is empty', () => {
    expect(getCLIErrorMessage('codex', '')).toBe('Generation failed');
  });
});
