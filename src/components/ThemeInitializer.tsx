"use client"

import { useEffect } from 'react'
import { useTheme } from '@/lib/store/theme-store'

export default function ThemeInitializer() {
    const { theme } = useTheme()

    useEffect(() => {
        // Remove both classes first
        document.documentElement.classList.remove('light', 'dark')

        // Add current theme class
        if (theme === 'light') {
            document.documentElement.classList.add('light')
        } else {
            document.documentElement.classList.add('dark')
        }
    }, [theme])

    return null
}
