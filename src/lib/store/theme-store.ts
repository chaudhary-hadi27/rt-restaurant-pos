// lib/store/theme-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

type ThemeStore = {
    theme: Theme;
    toggleTheme: () => void;
};

export const useTheme = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            toggleTheme: () =>
                set((state) => {
                    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
                    document.documentElement.classList.toggle('light', newTheme === 'light');
                    return { theme: newTheme };
                }),
        }),
        { name: 'theme-storage' }
    )
);