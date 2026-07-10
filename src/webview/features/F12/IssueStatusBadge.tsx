import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { IssueState } from './types';

const STATE_LABEL_KEYS: Record<IssueState, string> = {
  open: 'github.status_open',
  closed: 'github.status_closed',
};

const STATE_COLOR_CLASSNAME: Record<IssueState, string> = {
  open: 'text-added',
  closed: 'text-deleted',
};

export const IssueStatusBadge: FC<{ state: IssueState }> = ({ state }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${STATE_COLOR_CLASSNAME[state]}`}
    >
      {t(STATE_LABEL_KEYS[state])}
    </span>
  );
};
