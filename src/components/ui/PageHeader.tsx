interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <header className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--fg)]">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>
                        )}
                    </div>
                    {action}
                </div>
            </div>
        </header>
    )
}