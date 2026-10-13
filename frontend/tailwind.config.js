/** @type {import('tailwindcss').Config} */

// Semantic colors come from CSS variables (src/index.css) so light and dark themes share one palette.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                canvas: token('canvas'),
                surface: { DEFAULT: token('surface'), muted: token('surface-muted'), hover: token('surface-hover') },
                line: { DEFAULT: token('line'), strong: token('line-strong') },
                fg: { DEFAULT: token('fg'), muted: token('fg-muted'), subtle: token('fg-subtle') },
                brand: {
                    DEFAULT: token('brand'),
                    hover: token('brand-hover'),
                    fg: token('brand-fg'),
                    soft: token('brand-soft'),
                    text: token('brand-text'),
                },
                success: { DEFAULT: token('success'), soft: token('success-soft') },
                danger: { DEFAULT: token('danger'), hover: token('danger-hover'), soft: token('danger-soft') },
                warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
                info: { DEFAULT: token('info'), soft: token('info-soft') },
                whatsapp: { DEFAULT: token('whatsapp'), hover: token('whatsapp-hover') },
                chart: token('chart'),
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
            },
            fontSize: {
                '2xs': ['0.6875rem', { lineHeight: '1rem' }],
            },
            boxShadow: {
                card: '0 1px 2px rgb(0 0 0 / 0.04)',
                popover: '0 8px 24px rgb(0 0 0 / 0.12)',
            },
            keyframes: {
                shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
                'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
                'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
            },
            animation: {
                shimmer: 'shimmer 1.5s infinite',
                'fade-in': 'fade-in 150ms ease-out',
                'slide-up': 'slide-up 200ms ease-out',
            },
        },
    },
    plugins: [],
}
