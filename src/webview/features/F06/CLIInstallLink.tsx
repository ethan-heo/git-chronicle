import type { FC, MouseEvent } from 'react';

interface CLIInstallLinkProps {
  url: string;
  label: string;
  ariaLabel: string;
  onOpen: (url: string) => void;
}

export const CLIInstallLink: FC<CLIInstallLinkProps> = ({ url, label, ariaLabel, onOpen }) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    onOpen(url);
  };

  return (
    <a className="cli-install-link" href={url} target="_blank" rel="noopener" aria-label={ariaLabel} onClick={handleClick}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M6 3H3.5v9.5h9.5V10" />
        <path d="M9 3h4v4M13 3 7.5 8.5" />
      </svg>
      {label}
    </a>
  );
};
