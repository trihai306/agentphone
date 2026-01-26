import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Avatar - User avatar with image or initials fallback
 */
export default function Avatar({
    src,
    name,
    size = 'md',
    className = '',
    ...props
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizeStyles = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-20 h-20 text-xl',
    };

    // Generate initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Generate consistent color from name
    const getColor = (name) => {
        if (!name) return 'from-gray-500 to-gray-600';
        const colors = [
            'from-purple-500 to-indigo-500',
            'from-blue-500 to-cyan-500',
            'from-emerald-500 to-teal-500',
            'from-orange-500 to-amber-500',
            'from-pink-500 to-rose-500',
            'from-violet-500 to-purple-500',
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    if (src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={`
                    ${sizeStyles[size]} rounded-full object-cover
                    ${className}
                `}
                {...props}
            />
        );
    }

    return (
        <div
            className={`
                ${sizeStyles[size]} rounded-full flex items-center justify-center
                bg-gradient-to-br ${getColor(name)} text-white font-medium
                ${className}
            `}
            {...props}
        >
            {getInitials(name)}
        </div>
    );
}

/**
 * AvatarGroup - Stack multiple avatars
 */
export function AvatarGroup({ avatars = [], max = 3, size = 'md' }) {
    const displayed = avatars.slice(0, max);
    const remaining = avatars.length - max;

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizeStyles = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    return (
        <div className="flex -space-x-3">
            {displayed.map((avatar, i) => (
                <Avatar
                    key={i}
                    src={avatar.src}
                    name={avatar.name}
                    size={size}
                    className={`ring-2 ${isDark ? 'ring-[#0d0d0d]' : 'ring-white'}`}
                />
            ))}
            {remaining > 0 && (
                <div
                    className={`
                        ${sizeStyles[size]} rounded-full flex items-center justify-center
                        font-medium ring-2
                        ${isDark
                            ? 'bg-[#2a2a2a] text-gray-300 ring-[#0d0d0d]'
                            : 'bg-gray-200 text-gray-600 ring-white'
                        }
                    `}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}
