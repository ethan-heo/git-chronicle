import * as vscode from 'vscode';
import type { SummaryLanguage } from '../summaryFileService';

export function l10n(message: string): string {
  return message;
}

export function getCurrentSummaryLanguage(): SummaryLanguage {
  return vscode.env.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
