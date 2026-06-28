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
    <div className="commit-filter-field">
      <label className="commit-filter-label" htmlFor="commit-author-filter">
        {t('commit.author_label')}
      </label>
      <select
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
