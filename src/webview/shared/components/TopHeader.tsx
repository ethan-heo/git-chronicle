import type { FC } from 'react';

interface TopHeaderProps {
  title: string;
  context?: string;
}

export const TopHeader: FC<TopHeaderProps> = ({ title, context }) => {
  return (
    <header className="top-header">
      <div>
        <h1>{title}</h1>
        {context ? <p>{context}</p> : null}
      </div>
    </header>
  );
};
