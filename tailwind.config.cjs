

module.exports = {
  // Use the `dark` class strategy so toggling `document.documentElement.classList.toggle('dark')`
  // switches styles (including icon visibility) at runtime.
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      // semantic utilities
      colors: {
        surface: 'oklch(var(--surface) / <alpha-value>)',
        content: 'oklch(var(--content) / <alpha-value>)',
        primary: 'oklch(var(--primary) / <alpha-value>)',
        'primary-content': 'oklch(var(--primary-content) / <alpha-value>)',
        muted: 'oklch(var(--muted) / <alpha-value>)',
        'muted-content': 'oklch(var(--muted-content) / <alpha-value>)',
        'link-color': 'oklch(var(--link-color) / <alpha-value>)',
        'link-hover-color': 'oklch(var(--link-hover-color) / <alpha-value>)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'oklch(var(--content))',
            '--tw-prose-headings': 'oklch(var(--content))',
            '--tw-prose-lead': 'oklch(var(--content))',
            '--tw-prose-links': 'oklch(var(--link-color))',
            '--tw-prose-bold': 'oklch(var(--content))',
            '--tw-prose-counters': 'oklch(var(--content))',
            '--tw-prose-bullets': 'oklch(var(--content))',
            '--tw-prose-hr': 'oklch(var(--muted))',
            '--tw-prose-quotes': 'oklch(var(--content))',
            '--tw-prose-code': 'oklch(var(--content))',
            '--tw-prose-pre-bg': 'oklch(var(--surface))',
            '--tw-prose-th-borders': 'oklch(var(--muted))',
            '--tw-prose-td-borders': 'oklch(var(--muted))',
            // Ensure lists show bullets/numbers
            'ul > li': {
              position: 'relative',
            },
            'ul > li::before': {
              content: '"•"',
              position: 'absolute',
              left: '-1em',
              color: 'var(--tw-prose-bullets)',
            },
            'ol > li': {
              position: 'relative',
            },
            'ol': {
              counterReset: 'list-counter',
            },
            'ol > li': {
              counterIncrement: 'list-counter',
            },
            'ol > li::before': {
              content: 'counter(list-counter) "."',
              position: 'absolute',
              left: '-1.5em',
              color: 'var(--tw-prose-counters)',
            },
            // Link hover color
            'a:hover': {
              color: 'oklch(var(--link-hover-color))',
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-invert-body': 'oklch(var(--content))',
            '--tw-prose-invert-headings': 'oklch(var(--content))',
            '--tw-prose-invert-lead': 'oklch(var(--content))',
            '--tw-prose-invert-links': 'oklch(var(--link-color))',
            '--tw-prose-invert-bold': 'oklch(var(--content))',
            '--tw-prose-invert-counters': 'oklch(var(--content))',
            '--tw-prose-invert-bullets': 'oklch(var(--content))',
            '--tw-prose-invert-hr': 'oklch(var(--muted))',
            '--tw-prose-invert-quotes': 'oklch(var(--content))',
            '--tw-prose-invert-code': 'oklch(var(--content))',
            '--tw-prose-invert-pre-bg': 'oklch(var(--surface))',
            '--tw-prose-invert-th-borders': 'oklch(var(--muted))',
            '--tw-prose-invert-td-borders': 'oklch(var(--muted))',
            // Link hover color for dark mode
            'a:hover': {
              color: 'oklch(var(--link-hover-color))',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}; 