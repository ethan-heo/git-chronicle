import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthorDropdownProps {
  authorList: string[];
  selectedAuthor: string | null;
  onAuthorChange: (author: string | null) => void;
}

export const AuthorDropdown: FC<AuthorDropdownProps> = ({ authorList, selectedAuthor, onAuthorChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className="text-[11px] text-muted" htmlFor="commit-author-filter">
        {t('commit.author_label')}
      </label>
      <select
        className="w-full min-w-0 cursor-pointer rounded-sm border border-transparent bg-[var(--vscode-input-background,#3c3c3c)] px-1.5 py-1 text-sm text-[var(--vscode-input-foreground,var(--color-text))] [color-scheme:dark] focus:border-focus focus:outline-none"
        id="commit-author-filter"
        value={selectedAuthor ?? ''}
        onChange={(event) => onAuthorChange(event.target.value || null)}
        aria-label={t('commit.filter_author_aria')}
      >
        <option value="">{t('commit.all')}</option>
        {authorList.map((author) => (
          <option key={author} value={author}>
            {author}
          </option>
        ))}
      </select>
    </div>
  );
};
