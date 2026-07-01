import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
}

export const DateRangeFilter: FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const { t } = useTranslation();
  const handleStartDateChange = (date: string): void => {
    onStartDateChange(date || null);

    if (date && endDate && date > endDate) {
      onEndDateChange(date);
    }
  };

  const handleEndDateChange = (date: string): void => {
    if (date && startDate && date < startDate) {
      onEndDateChange(startDate);
      return;
    }

    onEndDateChange(date || null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] text-muted">{t('commit.filter_title')}</span>
      <div className="flex items-center gap-1.5">
        <input
          className="min-w-0 flex-1 rounded-sm border border-transparent bg-[var(--vscode-input-background,#3c3c3c)] px-1.5 py-[3px] text-sm text-[var(--vscode-input-foreground,var(--color-text))] [color-scheme:dark] focus:border-focus focus:outline-none"
          type="date"
          aria-label={t('common.start_date')}
          value={startDate ?? ''}
          onChange={(event) => handleStartDateChange(event.target.value)}
        />
        <span className="text-sm text-muted" aria-hidden="true">~</span>
        <input
          className="min-w-0 flex-1 rounded-sm border border-transparent bg-[var(--vscode-input-background,#3c3c3c)] px-1.5 py-[3px] text-sm text-[var(--vscode-input-foreground,var(--color-text))] [color-scheme:dark] focus:border-focus focus:outline-none"
          type="date"
          aria-label={t('common.end_date')}
          value={endDate ?? ''}
          onChange={(event) => handleEndDateChange(event.target.value)}
        />
      </div>
    </div>
  );
};
