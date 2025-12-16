import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    color?: string
    onClick?: () => void
}

export function StatCard({ label, value, icon: Icon, color = '#3b82f6', onClick }: StatCardProps) {
    return (
        <div
            onClick={onClick}
            className={`p-5 bg-[var(--card)] border border-[var(--border)] rounded-xl transition-all ${onClick ? 'cursor-pointer hover:border-blue-600 hover:shadow-lg' : ''}`}
        >
            <Icon className="w-6 h-6 mb-3" style={{ color }} />
            <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
            <p className="text-3xl font-bold text-[var(--fg)]">{value}</p>
        </div>
    )
}