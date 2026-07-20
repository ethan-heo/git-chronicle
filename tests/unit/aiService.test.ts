import { describe, expect, it } from 'vitest';
import { getCLIErrorMessage, getProviderCommand, parseProviderJsonLine } from '../../src/extension/aiService';

describe('aiService', () => {
  it('keeps Claude on non-interactive print mode with stdin prompt delivery', () => {
    expect(getProviderCommand('claude', 'claude-haiku-4-5', 'Summarize this diff')).toEqual({
      command: 'claude',
      args: ['--model', 'claude-haiku-4-5', '-p', '--output-format', 'stream-json', '--include-partial-messages', '--verbose'],
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
      args: ['exec', '--skip-git-repo-check', '--model', 'gpt-5.4-mini', '--json', '-'],
      stdinPrompt: 'Explain the commit',
    });
  });

  it('parses Claude stream-json text deltas and final usage', () => {
    const chunks: string[] = [];
    let usage = parseProviderJsonLine(
      'claude',
      '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}}',
      (chunk) => chunks.push(chunk),
      null,
    );
    usage = parseProviderJsonLine(
      'claude',
      '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}}',
      (chunk) => chunks.push(chunk),
      usage,
    );
    usage = parseProviderJsonLine(
      'claude',
      '{"type":"result","usage":{"input_tokens":12,"output_tokens":34},"total_cost_usd":0.0042}',
      (chunk) => chunks.push(chunk),
      usage,
    );

    expect(chunks).toEqual(['Hello', ' world']);
    expect(usage).toEqual({
      inputTokens: 12,
      outputTokens: 34,
      costUsd: 0.0042,
    });
  });

  it('ignores Claude "assistant" snapshot events so turn text is not double-emitted', () => {
    const chunks: string[] = [];
    let usage = parseProviderJsonLine(
      'claude',
      '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello from Claude"}}}',
      (chunk) => chunks.push(chunk),
      null,
    );
    usage = parseProviderJsonLine(
      'claude',
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello from Claude"}]}}',
      (chunk) => chunks.push(chunk),
      usage,
    );
    usage = parseProviderJsonLine(
      'claude',
      '{"type":"result","usage":{"input_tokens":21,"output_tokens":8},"total_cost_usd":0.0011}',
      (chunk) => chunks.push(chunk),
      usage,
    );

    expect(chunks).toEqual(['Hello from Claude']);
    expect(usage).toEqual({
      inputTokens: 21,
      outputTokens: 8,
      costUsd: 0.0011,
    });
  });

  it('parses Codex json agent_message text and final usage', () => {
    const chunks: string[] = [];
    let usage = parseProviderJsonLine(
      'codex',
      '{"type":"item.completed","item":{"type":"agent_message","text":"Final answer"}}',
      (chunk) => chunks.push(chunk),
      null,
    );
    usage = parseProviderJsonLine(
      'codex',
      '{"type":"turn.completed","usage":{"input_tokens":55,"output_tokens":89,"cached_input_tokens":21}}',
      (chunk) => chunks.push(chunk),
      usage,
    );

    expect(chunks).toEqual(['Final answer']);
    expect(usage).toEqual({
      inputTokens: 55,
      outputTokens: 89,
      costUsd: null,
    });
  });

  it('ignores malformed json lines without leaking them into rendered output', () => {
    const chunks: string[] = [];
    let usage = parseProviderJsonLine('claude', 'not-json', (chunk) => chunks.push(chunk), null);
    usage = parseProviderJsonLine(
      'claude',
      '{"type":"result","usage":{"input_tokens":1,"output_tokens":2}}',
      (chunk) => chunks.push(chunk),
      usage,
    );

    expect(chunks).toEqual([]);
    expect(usage).toEqual({
      inputTokens: 1,
      outputTokens: 2,
      costUsd: null,
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
