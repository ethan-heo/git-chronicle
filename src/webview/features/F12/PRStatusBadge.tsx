import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { PullRequestState } from './types';

const STATE_LABEL_KEYS: Record<PullRequestState, string> = {
  open: 'github.status_open',
  closed: 'github.status_closed',
  merged: 'github.status_merged',
};

const STATE_COLOR_CLASSNAME: Record<PullRequestState, string> = {
  open: 'text-added',
  closed: 'text-deleted',
  merged: 'text-link',
};

export const PRStatusBadge: FC<{ state: PullRequestState }> = ({ state }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${STATE_COLOR_CLASSNAME[state]}`}
    >
      {t(STATE_LABEL_KEYS[state])}
    </span>
  );
};
