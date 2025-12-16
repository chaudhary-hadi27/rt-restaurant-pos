// src/components/ui/ConfirmDialog.tsx
import { ActionButton } from './ActionButton'

interface ConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'primary' | 'success' | 'danger' | 'ghost'
    loading?: boolean
}

export const ConfirmDialog = ({
                                  open,
                                  onClose,
                                  onConfirm,
                                  title = 'Confirm Action',
                                  description,
                                  confirmText = 'Confirm',
                                  cancelText = 'Cancel',
                                  variant = 'danger',
                                  loading = false
                              }: ConfirmDialogProps) => {
    if (!open) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                    {title}
                </h3>
                {description && (
                    <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                        {description}
                    </p>
                )}
                <div className="flex gap-3">
                    <ActionButton variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
                        {cancelText}
                    </ActionButton>
                    <ActionButton variant={variant} onClick={onConfirm} className="flex-1" loading={loading}>
                        {confirmText}
                    </ActionButton>
                </div>
            </div>
        </div>
    )
}