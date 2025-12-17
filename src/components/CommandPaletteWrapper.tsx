"use client"

import { useState } from 'react'
import UnifiedSidebar from '@/components/layout/UnifiedSidebar'
import CommandPalette from '@/components/CommandPalette'

export default function CommandPaletteWrapper() {
    const [commandOpen, setCommandOpen] = useState(false)

    return (
        <>
            <UnifiedSidebar onCommandOpen={() => setCommandOpen(true)} />
            {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
        </>
    )
}