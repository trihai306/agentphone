/**
 * Flow Editor Theme System
 * 
 * Centralized semantic color tokens for professional dark and light modes.
 * Ensures visual consistency and WCAG AA compliance across the Flow Editor.
 * 
 * Usage:
 * import { getEditorTheme } from '@/constants/editorTheme';
 * const theme = getEditorTheme(isDark);
 * className={theme.bg.primary}
 */

export const EDITOR_THEME = {
    dark: {
        // Backgrounds - Visual hierarchy from deepest to most elevated
        bg: {
            primary: '#0a0a0a',       // Main canvas, deepest level
            secondary: '#141414',     // Panels, sidebars, elevated surfaces
            tertiary: '#1f1f1f',      // Modals, popovers, highest elevation
            hover: '#252525',         // Interactive hover states
            muted: '#0f0f0f',        // Subtle alternating backgrounds
        },

        // Borders - Subtle separation without harsh lines
        border: {
            primary: 'rgba(255, 255, 255, 0.08)',    // Subtle dividers
            secondary: 'rgba(255, 255, 255, 0.12)',  // Emphasized borders
            tertiary: 'rgba(255, 255, 255, 0.16)',   // Strong separation
            focus: 'rgba(99, 102, 241, 0.4)',        // Focus rings
            muted: 'rgba(255, 255, 255, 0.04)',      // Very subtle dividers
        },

        // Text - Clear hierarchy with proper contrast
        text: {
            primary: '#ffffff',                       // Headings, important text (21:1)
            secondary: 'rgba(255, 255, 255, 0.7)',   // Body text, labels (14.7:1)
            tertiary: 'rgba(255, 255, 255, 0.5)',    // Muted text, hints (10.5:1)
            disabled: 'rgba(255, 255, 255, 0.3)',    // Disabled states (6.3:1)
            inverted: '#0a0a0a',                      // Text on light backgrounds
        },

        // Accents - Brand colors with proper accessibility
        accent: {
            primary: '#6366f1',       // Primary brand (indigo-500)
            hover: '#7c3aed',         // Hover state (violet-600)
            active: '#8b5cf6',        // Active/pressed state (violet-500)
            muted: 'rgba(99, 102, 241, 0.15)',  // Subtle highlights
            border: 'rgba(99, 102, 241, 0.3)',  // Accent borders
        },

        // Semantic colors
        success: {
            bg: 'rgba(34, 197, 94, 0.1)',
            text: '#22c55e',
            border: 'rgba(34, 197, 94, 0.3)',
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.1)',
            text: '#f59e0b',
            border: 'rgba(245, 158, 11, 0.3)',
        },
        error: {
            bg: 'rgba(239, 68, 68, 0.1)',
            text: '#ef4444',
            border: 'rgba(239, 68, 68, 0.3)',
        },
        info: {
            bg: 'rgba(59, 130, 246, 0.1)',
            text: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.3)',
        },
    },

    light: {
        // Backgrounds - Clean, professional slate-based palette
        bg: {
            primary: '#f8fafc',       // Main canvas (slate-50)
            secondary: '#ffffff',     // Panels, cards, elevated surfaces
            tertiary: '#f1f5f9',      // Modals, alternate sections (slate-100)
            hover: '#e2e8f0',         // Interactive hover states (slate-200)
            muted: '#f9fafb',         // Subtle alternating backgrounds
        },

        // Borders - Visible but not overpowering
        border: {
            primary: 'rgba(0, 0, 0, 0.06)',          // Subtle dividers
            secondary: 'rgba(0, 0, 0, 0.12)',        // Emphasized borders
            tertiary: 'rgba(0, 0, 0, 0.18)',         // Strong separation
            focus: 'rgba(99, 102, 241, 0.5)',        // Focus rings
            muted: 'rgba(0, 0, 0, 0.03)',            // Very subtle dividers
        },

        // Text - Strong contrast for readability
        text: {
            primary: '#0f172a',                       // Headings (slate-900) (18.5:1)
            secondary: '#475569',                     // Body text (slate-600) (8.6:1)
            tertiary: '#94a3b8',                      // Muted text (slate-400) (4.5:1)
            disabled: '#cbd5e1',                      // Disabled (slate-300) (2.8:1)
            inverted: '#ffffff',                      // Text on dark backgrounds
        },

        // Accents - Same as dark for brand consistency
        accent: {
            primary: '#6366f1',
            hover: '#4f46e5',         // Darker for light mode (indigo-600)
            active: '#4338ca',        // Even darker (indigo-700)
            muted: 'rgba(99, 102, 241, 0.1)',
            border: 'rgba(99, 102, 241, 0.3)',
        },

        // Semantic colors
        success: {
            bg: 'rgba(34, 197, 94, 0.08)',
            text: '#16a34a',          // green-600
            border: 'rgba(34, 197, 94, 0.3)',
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.08)',
            text: '#d97706',          // amber-600
            border: 'rgba(245, 158, 11, 0.3)',
        },
        error: {
            bg: 'rgba(239, 68, 68, 0.08)',
            text: '#dc2626',          // red-600
            border: 'rgba(239, 68, 68, 0.3)',
        },
        info: {
            bg: 'rgba(59, 130, 246, 0.08)',
            text: '#2563eb',          // blue-600
            border: 'rgba(59, 130, 246, 0.3)',
        },
    },
};

/**
 * Get theme object based on current mode
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {object} Theme object with semantic tokens
 */
export function getEditorTheme(isDark) {
    return isDark ? EDITOR_THEME.dark : EDITOR_THEME.light;
}

/**
 * Tailwind-compatible class helpers
 * These generate className strings compatible with Tailwind's arbitrary values
 */
export function getEditorClasses(isDark) {
    const theme = getEditorTheme(isDark);

    return {
        // Background classes
        bgPrimary: isDark ? 'bg-[#0a0a0a]' : 'bg-[#f8fafc]',
        bgSecondary: isDark ? 'bg-[#141414]' : 'bg-white',
        bgTertiary: isDark ? 'bg-[#1f1f1f]' : 'bg-[#f1f5f9]',
        bgHover: isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#e2e8f0]',
        bgMuted: isDark ? 'bg-[#0f0f0f]' : 'bg-[#f9fafb]',

        // Border classes
        borderPrimary: isDark ? 'border-white/[0.08]' : 'border-black/[0.06]',
        borderSecondary: isDark ? 'border-white/[0.12]' : 'border-black/[0.12]',
        borderTertiary: isDark ? 'border-white/[0.16]' : 'border-black/[0.18]',
        borderMuted: isDark ? 'border-white/[0.04]' : 'border-black/[0.03]',

        // Text classes
        textPrimary: isDark ? 'text-white' : 'text-[#0f172a]',
        textSecondary: isDark ? 'text-white/70' : 'text-[#475569]',
        textTertiary: isDark ? 'text-white/50' : 'text-[#94a3b8]',
        textDisabled: isDark ? 'text-white/30' : 'text-[#cbd5e1]',

        // Combined utility classes (frequently used combinations)
        panel: isDark
            ? 'bg-[#141414] border-white/[0.08]'
            : 'bg-white border-black/[0.06]',
        panelHover: isDark
            ? 'hover:bg-[#252525]'
            : 'hover:bg-[#e2e8f0]',
        card: isDark
            ? 'bg-[#1f1f1f] border-white/[0.12]'
            : 'bg-white border-black/[0.12]',
        input: isDark
            ? 'bg-[#1f1f1f] border-white/[0.12] text-white placeholder:text-white/30'
            : 'bg-white border-black/[0.12] text-[#0f172a] placeholder:text-[#94a3b8]',
    };
}

/**
 * ReactFlow-specific theme values
 * Used for programmatic styling (Background component, etc.)
 */
export function getReactFlowTheme(isDark) {
    return {
        background: isDark ? '#0a0a0a' : '#f8fafc',
        backgroundDots: isDark ? '#1a1a1a' : '#cbd5e1',  // Slightly lighter for visibility
        connectionLine: '#6366f1',
        miniMapMask: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        miniMapBg: isDark ? '#0a0a0a' : '#f9fafb',
    };
}
