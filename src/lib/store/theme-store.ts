import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeStore = {
    theme: 'dark' | 'light'
    toggleTheme: () => void
}

export const useTheme = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            toggleTheme: () => set(state => {
                const theme = state.theme === 'dark' ? 'light' : 'dark'
                document.documentElement.classList.toggle('light', theme === 'light')
                return { theme }
            })
        }),
        { name: 'theme' }
    )
)