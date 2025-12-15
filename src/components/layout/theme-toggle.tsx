"use client";

import { useTheme } from '@/lib/store/theme-store';
import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
    }, [theme]);

    return (
        <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card)';
                e.currentTarget.style.filter = 'brightness(1.2)';
                e.currentTarget.style.color = 'var(--fg)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.color = 'var(--muted)';
            }}
        >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}