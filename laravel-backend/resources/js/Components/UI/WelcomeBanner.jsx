import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * WelcomeBanner - Animated gradient welcome section
 */
export default function WelcomeBanner({
    user,
    stats = {},
    className = ''
}) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl p-8 ${className}`}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 animate-gradient-x" />

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                        style={{
                            left: `${10 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${3 + i * 0.5}s`,
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <p className="text-purple-200 text-lg mb-1">{getGreeting()},</p>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                            {user?.name || 'User'}! 👋
                        </h1>
                        <p className="text-purple-100/80 max-w-md">
                            Đây là tổng quan hoạt động của bạn hôm nay. Tiếp tục phát triển!
                        </p>
                    </div>

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-4">
                        <QuickStat
                            icon="💰"
                            value={stats.balance || '0 ₫'}
                            label="Số dư"
                        />
                        <QuickStat
                            icon="📱"
                            value={stats.devices || '0'}
                            label="Thiết bị"
                        />
                        <QuickStat
                            icon="⚡"
                            value={stats.workflows || '0'}
                            label="Workflows"
                        />
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                    <QuickActionPill href="/topup" icon="💳">
                        Nạp tiền
                    </QuickActionPill>
                    <QuickActionPill href="/packages" icon="📦">
                        Mua gói
                    </QuickActionPill>
                    <QuickActionPill href="/devices" icon="📱">
                        Thiết bị
                    </QuickActionPill>
                </div>
            </div>
        </div>
    );
}

function QuickStat({ icon, value, label }) {
    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <span className="text-xl font-bold text-white">{value}</span>
            </div>
            <p className="text-sm text-purple-200">{label}</p>
        </div>
    );
}

function QuickActionPill({ href, icon, children }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white font-medium transition-all duration-200 hover:scale-105"
        >
            <span>{icon}</span>
            {children}
        </Link>
    );
}
