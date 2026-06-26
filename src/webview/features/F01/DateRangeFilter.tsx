import type { FC } from 'react';

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
      <span className="commit-filter-label">기간</span>
      <div className="date-range-filter">
        <input
          type="date"
          aria-label="시작일"
          value={startDate ?? ''}
          onChange={(event) => handleStartDateChange(event.target.value)}
        />
        <span aria-hidden="true">~</span>
        <input
          type="date"
          aria-label="종료일"
          value={endDate ?? ''}
          onChange={(event) => handleEndDateChange(event.target.value)}
        />
      </div>
    </div>
  );
};
