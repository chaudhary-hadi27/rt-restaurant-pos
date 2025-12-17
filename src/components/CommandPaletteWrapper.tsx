// src/components/CommandPaletteWrapper.tsx
"use client"

import { useState, useEffect } from 'react'
import UnifiedSidebar from '@/components/layout/UnifiedSidebar'
import CommandPalette from '@/components/CommandPalette'

export default function CommandPaletteWrapper() {
    const [commandOpen, setCommandOpen] = useState(false)

    // Global keyboard shortcut for Command Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K to open Command Palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setCommandOpen(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <>
            <UnifiedSidebar onCommandOpen={() => setCommandOpen(true)} />
            <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
        </>
    )
}