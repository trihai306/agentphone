import { useTheme } from '@/Contexts/ThemeContext';

/**
 * DataList - Simple key-value list display
 */
export default function DataList({
    items = [],
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <dl className={`space-y-3 ${className}`}>
            {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                    <dt className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {item.label}
                    </dt>
                    <dd className={`text-sm font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

/**
 * DataListCard - DataList wrapped in a card
 */
export function DataListCard({ title, items = [], className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`
            p-5 rounded-xl
            ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}
            ${className}
        `}>
            {title && (
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {title}
                </h3>
            )}
            <DataList items={items} />
        </div>
    );
}
