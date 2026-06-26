import type { Config } from 'tailwindcss';

export default {
  content: ['./src/webview/**/*.{ts,tsx,html}'],
  theme: {
    extend: {},
  },
} satisfies Config;
