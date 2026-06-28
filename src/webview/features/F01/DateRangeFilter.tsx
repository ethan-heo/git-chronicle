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
    <div className="commit-filter-field">
      <span className="commit-filter-label">{t('commit.filter_title')}</span>
      <div className="date-range-filter">
        <input
          type="date"
          aria-label={t('common.start_date')}
          value={startDate ?? ''}
          onChange={(event) => handleStartDateChange(event.target.value)}
        />
        <span aria-hidden="true">~</span>
        <input
          type="date"
          aria-label={t('common.end_date')}
          value={endDate ?? ''}
          onChange={(event) => handleEndDateChange(event.target.value)}
        />
      </div>
    </div>
  );
};
