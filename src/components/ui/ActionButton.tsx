// src/components/ui/ActionButton.tsx
import { LucideIcon } from 'lucide-react'

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    loading?: boolean
    variant?: 'primary' | 'success' | 'danger' | 'ghost'
    icon?: LucideIcon
}

export const ActionButton = ({
                                 children,
                                 loading = false,
                                 variant = 'primary',
                                 icon: Icon,
                                 ...props
                             }: ActionButtonProps) => {
    const variants = {
        primary: 'btn-primary',
        success: 'btn-success',
        danger: 'btn-danger',
        ghost: 'btn-ghost'
    }

    return (
        <button className={variants[variant]} disabled={loading} {...props}>
            {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
                <>
                    {Icon && <Icon className="w-4 h-4 mr-2 inline" />}
                    {children}
                </>
            )}
        </button>
    )
}