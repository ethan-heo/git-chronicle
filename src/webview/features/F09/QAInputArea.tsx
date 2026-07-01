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
    <div className="ai-summary-qa-panel">
      <textarea
        id="ai-summary-question"
        className="ai-summary-qa-textarea"
        rows={1}
        placeholder={t('ai_summary.qa_placeholder')}
        value={question}
        disabled={isGeneratingQA}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleQuestionKeyDown}
      />
      <div className="ai-summary-qa-actions">
        <button type="button" className="ai-summary-qa-button" disabled={isGeneratingQA || !question.trim()} onClick={submitQuestion}>
          {isGeneratingQA ? t('ai_summary.qa_loading') : t('ai_summary.qa_submit')}
        </button>
      </div>
    </div>
  );
};
