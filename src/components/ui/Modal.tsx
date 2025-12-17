// src/components/ui/Modal.tsx
import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    children: ReactNode
    footer?: ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
    if (!open) return null

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className={`bg-[var(--card)] border border-[var(--border)] rounded-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
                    <h3 className="text-xl font-bold text-[var(--fg)]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex gap-3 p-6 border-t border-[var(--border)] sticky bottom-0 bg-[var(--card)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}