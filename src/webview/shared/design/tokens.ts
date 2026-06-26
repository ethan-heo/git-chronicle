export const colorTokens = {
  surface: {
    primary: 'var(--gae-color-surface-primary)',
    secondary: 'var(--gae-color-surface-secondary)',
    elevated: 'var(--gae-color-surface-elevated)',
    hover: 'var(--gae-color-surface-hover)',
    selected: 'var(--gae-color-surface-selected)',
  },
  text: {
    primary: 'var(--gae-color-text-primary)',
    secondary: 'var(--gae-color-text-secondary)',
    disabled: 'var(--gae-color-text-disabled)',
    link: 'var(--gae-color-text-link)',
    onAccent: 'var(--gae-color-text-on-accent)',
  },
  status: {
    added: 'var(--gae-color-status-added)',
    modified: 'var(--gae-color-status-modified)',
    deleted: 'var(--gae-color-status-deleted)',
    renamed: 'var(--gae-color-status-renamed)',
  },
  diff: {
    added: 'var(--gae-color-diff-added)',
    removed: 'var(--gae-color-diff-removed)',
  },
  accent: {
    primary: 'var(--gae-color-accent-primary)',
    primaryHover: 'var(--gae-color-accent-primary-hover)',
    secondary: 'var(--gae-color-accent-secondary)',
    secondaryHover: 'var(--gae-color-accent-secondary-hover)',
  },
  semantic: {
    error: 'var(--gae-color-semantic-error)',
    warning: 'var(--gae-color-semantic-warning)',
    info: 'var(--gae-color-semantic-info)',
  },
} as const;

export const typographyTokens = {
  family: {
    base: 'var(--gae-font-family-base)',
    mono: 'var(--gae-font-family-mono)',
  },
  size: {
    xs: 'var(--gae-font-size-xs)',
    sm: 'var(--gae-font-size-sm)',
    base: 'var(--gae-font-size-base)',
    md: 'var(--gae-font-size-md)',
  },
  weight: {
    regular: 'var(--gae-font-weight-regular)',
    medium: 'var(--gae-font-weight-medium)',
    bold: 'var(--gae-font-weight-bold)',
  },
} as const;

export const spacingTokens = {
  xs: 'var(--gae-spacing-xs)',
  sm: 'var(--gae-spacing-sm)',
  md: 'var(--gae-spacing-md)',
  lg: 'var(--gae-spacing-lg)',
  xl: 'var(--gae-spacing-xl)',
} as const;

export const borderTokens = {
  color: {
    default: 'var(--gae-border-color-default)',
    focus: 'var(--gae-border-color-focus)',
  },
  radius: {
    sm: 'var(--gae-border-radius-sm)',
    md: 'var(--gae-border-radius-md)',
    round: 'var(--gae-border-radius-round)',
  },
} as const;

export const motionTokens = {
  duration: {
    fast: 'var(--gae-motion-duration-fast)',
    base: 'var(--gae-motion-duration-base)',
  },
  easing: {
    default: 'var(--gae-motion-easing-default)',
  },
} as const;
