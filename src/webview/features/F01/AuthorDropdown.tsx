import type { FC } from 'react';

interface AuthorDropdownProps {
  authorList: string[];
  selectedAuthor: string | null;
  onAuthorChange: (author: string | null) => void;
}

export const AuthorDropdown: FC<AuthorDropdownProps> = ({ authorList, selectedAuthor, onAuthorChange }) => {
  return (
    <div className="commit-filter-field">
      <label className="commit-filter-label" htmlFor="commit-author-filter">
        작성자
      </label>
      <select
        id="commit-author-filter"
        value={selectedAuthor ?? ''}
        onChange={(event) => onAuthorChange(event.target.value || null)}
        aria-label="작성자 필터"
      >
        <option value="">전체</option>
        {authorList.map((author) => (
          <option key={author} value={author}>
            {author}
          </option>
        ))}
      </select>
    </div>
  );
};
