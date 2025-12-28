import { ThemeProvider } from '@/Contexts/ThemeContext';
import Navigation from '@/Components/Navigation';
import Footer from '@/Components/Footer';

export default function MainLayout({ children }) {
    return (
        <ThemeProvider>
            <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                {/* Navigation with theme toggle */}
                <Navigation />

                {/* Main content */}
                <main className="flex-1">
                    {children}
                </main>

                {/* Footer */}
                <Footer />
            </div>
        </ThemeProvider>
    );
}
