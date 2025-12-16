"use client"

import { useEffect } from 'react'
import { useTheme } from '@/lib/store/theme-store'

export default function ThemeInitializer() {
    const { theme } = useTheme()

    useEffect(() => {
        // Apply theme on mount and when it changes
        document.documentElement.classList.remove('light', 'dark')
        if (theme === 'light') {
            document.documentElement.classList.add('light')
        }
    }, [theme])

    return null
}