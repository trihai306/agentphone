import { Component } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
class ErrorBoundaryClass extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            const { isDark } = this.props;

            return (
                <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
                    <div className={`max-w-md w-full p-8 rounded-2xl border ${isDark
                            ? 'bg-[#141414] border-[#2a2a2a]'
                            : 'bg-white border-gray-200'
                        }`}>
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/30' : 'bg-red-100'
                                }`}>
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Error Message */}
                        <h2 className={`text-xl font-semibold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            Đã xảy ra lỗi
                        </h2>
                        <p className={`text-center text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
                        </p>

                        {/* Error Details (Dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className={`mb-6 p-4 rounded-lg text-xs font-mono overflow-auto max-h-32 ${isDark ? 'bg-[#1a1a1a] text-red-400' : 'bg-gray-100 text-red-600'
                                }`}>
                                {this.state.error.toString()}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRefresh}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark
                                        ? 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tải lại trang
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                            >
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Wrapper to inject theme context into class component
 */
export default function ErrorBoundary({ children }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <ErrorBoundaryClass isDark={isDark}>
            {children}
        </ErrorBoundaryClass>
    );
}
