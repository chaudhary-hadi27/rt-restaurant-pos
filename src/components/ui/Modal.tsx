import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer }: any) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--fg)]">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:opacity-70 text-[var(--muted)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">{children}</div>

                {footer && (
                    <div className="flex gap-2 p-4 border-t border-[var(--border)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}