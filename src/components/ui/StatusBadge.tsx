// src/components/ui/StatusBadge.tsx
import { LucideIcon } from 'lucide-react'

interface StatusBadgeProps {
    status: 'success' | 'warning' | 'danger' | 'primary'
    label: string
    icon?: LucideIcon
}

const badgeVariants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    primary: 'badge-primary'
}

export const StatusBadge = ({
                                status,
                                label,
                                icon: Icon
                            }: StatusBadgeProps) => (
    <span className={badgeVariants[status]}>
    {Icon && <Icon className="w-3 h-3" />}
        {label}
  </span>
)