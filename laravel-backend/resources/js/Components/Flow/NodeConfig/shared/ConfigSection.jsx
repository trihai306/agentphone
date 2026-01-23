/**
 * ConfigSection - Reusable section wrapper for node configuration panels
 * Provides consistent styling for config sections across all node types
 */
export function ConfigSection({ title, children, isDark }) {
    return (
        <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {title}
            </label>
            {children}
        </div>
    );
}
