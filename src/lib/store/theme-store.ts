import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeStore = {
    theme: 'dark' | 'light'
    toggleTheme: () => void
    setTheme: (theme: 'dark' | 'light') => void
}

export const useTheme = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            toggleTheme: () => set(state => {
                const newTheme = state.theme === 'dark' ? 'light' : 'dark'

                // Update DOM immediately
                if (typeof document !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark')
                    if (newTheme === 'light') {
                        document.documentElement.classList.add('light')
                    }
                }

                return { theme: newTheme }
            }),
            setTheme: (theme) => set({ theme })
        }),
        {
            name: 'theme-storage',
            // Ensure theme is applied on page load
            onRehydrateStorage: () => (state) => {
                if (state && typeof document !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark')
                    if (state.theme === 'light') {
                        document.documentElement.classList.add('light')
                    }
                }
            }
        }
    )
)