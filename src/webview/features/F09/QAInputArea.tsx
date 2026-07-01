import { useState, type FC, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface QAInputAreaProps {
  isGeneratingQA: boolean;
  onAskQuestion: (question: string) => void;
}

export const QAInputArea: FC<QAInputAreaProps> = ({ isGeneratingQA, onAskQuestion }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');

  const submitQuestion = (): void => {
    const trimmed = question.trim();
    if (!trimmed || isGeneratingQA) {
      return;
    }

    onAskQuestion(trimmed);
    setQuestion('');
  };

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  };

  return (
    <div className="flex items-stretch gap-2 border-t border-line bg-panel px-6 py-3">
      <textarea
        id="ai-summary-question"
        className="h-[52px] min-h-[52px] flex-1 resize-none rounded-md border border-line bg-elevated px-3 py-2.5 text-text outline-none focus:border-focus"
        rows={1}
        placeholder={t('ai_summary.qa_placeholder')}
        value={question}
        disabled={isGeneratingQA}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleQuestionKeyDown}
      />
      <div className="flex shrink-0">
        <button
          type="button"
          className="box-border h-[52px] min-h-[52px] rounded-sm border border-transparent bg-accent px-3.5 text-[11.5px] leading-[1.2] font-bold text-on-accent disabled:cursor-default disabled:opacity-50"
          disabled={isGeneratingQA || !question.trim()}
          onClick={submitQuestion}
        >
          {isGeneratingQA ? t('ai_summary.qa_loading') : t('ai_summary.qa_submit')}
        </button>
      </div>
    </div>
  );
};
