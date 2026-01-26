import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Table - Data table component with dark mode support
 */
export default function Table({
    columns = [],
    data = [],
    onRowClick,
    emptyMessage = 'No data available',
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (data.length === 0) {
        return (
            <div className={`
                p-12 text-center rounded-xl
                ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}
                ${className}
            `}>
                <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`
            rounded-xl overflow-hidden
            ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}
            ${className}
        `}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            {columns.map((column, i) => (
                                <th
                                    key={i}
                                    className={`
                                        text-left py-3 px-4 text-xs font-medium uppercase tracking-wider
                                        ${isDark ? 'text-gray-500' : 'text-gray-400'}
                                        ${column.className || ''}
                                    `}
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                        {data.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                onClick={() => onRowClick?.(row)}
                                className={`
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                    ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}
                                `}
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`py-3 px-4 ${column.cellClassName || ''}`}
                                    >
                                        {column.render
                                            ? column.render(row[column.accessor], row, rowIndex)
                                            : row[column.accessor]
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * TableCell - Helper for custom table cell styling
 */
export function TableCell({ children, className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} ${className}`}>
            {children}
        </span>
    );
}

/**
 * TableHeader - Styled text for table headers
 */
export function TableHeader({ children, className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'} ${className}`}>
            {children}
        </span>
    );
}
