import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { CommitGroup } from '../../types/commit';

interface CommitGroupFilterDropdownProps {
  groups: CommitGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onEditGroup: (group: CommitGroup) => void;
  onDeleteGroup: (id: string) => void;
}

export const CommitGroupFilterDropdown: FC<CommitGroupFilterDropdownProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-col py-1" role="listbox" aria-label={t('commit.group_filter_title')}>
      <button
        className={[
          'flex items-center px-3 py-1.5 text-left text-xs',
          selectedGroupId === null ? 'bg-hover text-text' : 'text-muted hover:bg-hover hover:text-text',
        ].join(' ')}
        type="button"
        role="option"
        aria-selected={selectedGroupId === null}
        onClick={() => onSelectGroup(null)}
      >
        {t('commit.all')}
      </button>
      {groups.length === 0 ? (
        <div className="px-3 py-3 text-center text-[11px] text-muted">{t('commit.group_filter_empty')}</div>
      ) : (
        groups.map((group) => (
          <CommitGroupFilterRow
            key={group.id}
            group={group}
            isSelected={group.id === selectedGroupId}
            onSelect={() => onSelectGroup(group.id === selectedGroupId ? null : group.id)}
            onEdit={() => onEditGroup(group)}
            onDelete={() => onDeleteGroup(group.id)}
          />
        ))
      )}
    </div>
  );
};

const CommitGroupFilterRow: FC<{
  group: CommitGroup;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ group, isSelected, onSelect, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div
      className={[
        'group flex items-center gap-1 px-1.5 py-0.5',
        isSelected ? 'bg-hover' : 'hover:bg-hover',
      ].join(' ')}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1 text-left"
        type="button"
        role="option"
        aria-selected={isSelected}
        title={`${group.name} (${group.commitHashes.length})`}
        onClick={onSelect}
      >
        <span className={['min-w-0 truncate text-xs', isSelected ? 'font-medium text-text' : 'text-muted'].join(' ')}>
          {group.name}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-1.5 py-px text-[10px] font-medium text-muted">
          {group.commitHashes.length}
        </span>
      </button>
      <button
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-panel text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-text focus-visible:opacity-100"
        type="button"
        aria-label={t('commit.group_edit_aria', { name: group.name })}
        title={t('commit.group_edit_aria', { name: group.name })}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M11 2.5l2.5 2.5-8 8-3 .5.5-3z" />
        </svg>
      </button>
      <button
        className={[
          'inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-panel opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
          isConfirmingDelete ? 'bg-danger/15 text-danger' : 'text-muted hover:bg-hover hover:text-text',
        ].join(' ')}
        type="button"
        aria-label={isConfirmingDelete ? t('commit.group_delete_confirm_aria', { name: group.name }) : t('commit.group_delete_aria', { name: group.name })}
        title={isConfirmingDelete ? t('commit.group_delete_confirm_aria', { name: group.name }) : t('commit.group_delete_aria', { name: group.name })}
        onClick={(event) => {
          event.stopPropagation();
          if (isConfirmingDelete) {
            onDelete();
            setIsConfirmingDelete(false);
            return;
          }
          setIsConfirmingDelete(true);
        }}
        onBlur={() => setIsConfirmingDelete(false)}
      >
        {isConfirmingDelete ? (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 8.4 6.3 11.5 13 4.5" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5" />
          </svg>
        )}
      </button>
    </div>
  );
};
