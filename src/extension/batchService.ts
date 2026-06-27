import type { AIProviderName } from './aiTypes';
import { streamAISummary } from './aiService';
import type { ChangedFile } from './gitService';
import { fetchFileDiff } from './gitService';
import { buildFileSummaryPrompt } from './prompts';
import { hasSavedSummary, saveSummary } from './summaryFileService';

interface RunBatchAISummaryOptions {
  repoPath: string;
  files: ChangedFile[];
  provider: AIProviderName;
  savePath: string;
  commitHash: string;
  onProgress: (progress: BatchAISummaryProgress) => void;
  isCancelled: () => boolean;
}

export interface BatchAISummaryProgress {
  completed: number;
  failed: number;
  filePath: string;
  saved: boolean;
}

export interface BatchAISummaryResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

export async function runBatchAISummary(options: RunBatchAISummaryOptions): Promise<BatchAISummaryResult> {
  let completed = 0;
  let failed = 0;
  let cancelled = false;

  for (const file of options.files) {
    if (options.isCancelled()) {
      cancelled = true;
      break;
    }

    const alreadySaved = file.hasSavedSummary || hasSavedSummary(options.savePath, options.commitHash, file.path);

    if (alreadySaved) {
      completed += 1;
      options.onProgress({ completed, failed, filePath: file.path, saved: true });
      continue;
    }

    try {
      const diff = await fetchFileDiff(options.repoPath, options.commitHash, file.path);

      if (diff.isBinary) {
        throw new Error('바이너리 파일은 AI 정리를 생성할 수 없습니다');
      }

      const prompt = buildFileSummaryPrompt(file.path, diff.rawDiff);
      const content = await collectAISummary({
        provider: options.provider,
        prompt,
      });

      saveSummary(options.savePath, options.commitHash, file.path, content);
      completed += 1;
      options.onProgress({ completed, failed, filePath: file.path, saved: true });
    } catch {
      failed += 1;
      completed += 1;
      options.onProgress({ completed, failed, filePath: file.path, saved: false });
    }
  }

  cancelled = cancelled || options.isCancelled();

  return {
    completed,
    failed,
    cancelled,
  };
}

function collectAISummary(options: { provider: AIProviderName; prompt: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    let content = '';

    streamAISummary({
      provider: options.provider,
      prompt: options.prompt,
      onChunk: (chunk) => {
        content += chunk;
      },
      onComplete: () => {
        resolve(content);
      },
      onError: (message) => {
        reject(new Error(message));
      },
    });
  });
}
