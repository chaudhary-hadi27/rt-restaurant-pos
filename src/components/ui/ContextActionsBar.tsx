import { usePathname, useRouter } from 'next/navigation'
import {
    Plus, Search, Printer, Users, DollarSign, TrendingUp,
    CheckCircle, Package, UtensilsCrossed, LayoutGrid, Clock,
    RefreshCw, FileSpreadsheet, ShoppingBag, ArrowLeftRight
} from 'lucide-react'

interface Action {
    id: string
    label: string
    icon: any
    onClick?: () => void
    href?: string
    variant?: 'primary' | 'secondary' | 'success' | 'ghost'
    hidden?: boolean
}

interface ContextActionsBarProps {
    onAction?: (actionId: string) => void
    customActions?: Action[]
}

export default function ContextActionsBar({ onAction, customActions }: ContextActionsBarProps) {
    const pathname = usePathname()
    const router = useRouter()

    // Define actions for each page
    const getActionsForPage = (): Action[] => {
        // Restaurant - Menu/Order Page
        if (pathname === '/') {
            return [
                {
                    id: 'view-cart',
                    label: 'View Cart',
                    icon: ShoppingBag,
                    onClick: () => onAction?.('view-cart'),
                    variant: 'primary'
                },
                {
                    id: 'quick-order',
                    label: 'Quick Order',
                    icon: Plus,
                    onClick: () => onAction?.('quick-order'),
                    variant: 'secondary'
                },
                {
                    id: 'view-tables',
                    label: 'View Tables',
                    icon: LayoutGrid,
                    href: '/tables',
                    variant: 'ghost'
                }
            ]
        }

        // Restaurant - Tables Page
        if (pathname === '/tables') {
            return [
                {
                    id: 'new-order',
                    label: 'New Order',
                    icon: Plus,
                    href: '/',
                    variant: 'primary'
                },
                {
                    id: 'transfer-table',
                    label: 'Transfer Table',
                    icon: ArrowLeftRight,
                    onClick: () => onAction?.('transfer-table'),
                    variant: 'secondary'
                },
                {
                    id: 'refresh',
                    label: 'Refresh',
                    icon: RefreshCw,
                    onClick: () => onAction?.('refresh'),
                    variant: 'ghost'
                }
            ]
        }

        // Restaurant - Orders Page
        if (pathname === '/orders') {
            return [
                {
                    id: 'new-order',
                    label: 'New Order',
                    icon: Plus,
                    href: '/',
                    variant: 'primary'
                },
                {
                    id: 'print-receipt',
                    label: 'Print Receipt',
                    icon: Printer,
                    onClick: () => onAction?.('print-receipt'),
                    variant: 'secondary'
                },
                {
                    id: 'split-bill',
                    label: 'Split Bill',
                    icon: Users,
                    onClick: () => onAction?.('split-bill'),
                    variant: 'secondary'
                },
                {
                    id: 'refresh',
                    label: 'Refresh',
                    icon: RefreshCw,
                    onClick: () => onAction?.('refresh'),
                    variant: 'ghost'
                }
            ]
        }

        // Admin - Dashboard
        if (pathname === '/admin') {
            return [
                {
                    id: 'quick-report',
                    label: 'Quick Report',
                    icon: TrendingUp,
                    href: '/admin/reports',
                    variant: 'primary'
                },
                {
                    id: 'add-inventory',
                    label: 'Add Inventory',
                    icon: Package,
                    href: '/admin/inventory',
                    variant: 'secondary'
                },
                {
                    id: 'view-staff',
                    label: 'View Staff',
                    icon: Users,
                    href: '/admin/waiters',
                    variant: 'ghost'
                }
            ]
        }

        // Admin - Inventory
        if (pathname === '/admin/inventory') {
            return [
                {
                    id: 'add-item',
                    label: 'Add Item',
                    icon: Plus,
                    onClick: () => onAction?.('add-item'),
                    variant: 'primary'
                },
                {
                    id: 'low-stock',
                    label: 'Low Stock',
                    icon: Package,
                    onClick: () => onAction?.('low-stock'),
                    variant: 'secondary'
                },
                {
                    id: 'export',
                    label: 'Export',
                    icon: FileSpreadsheet,
                    onClick: () => onAction?.('export'),
                    variant: 'ghost'
                }
            ]
        }

        // Admin - Menu
        if (pathname === '/admin/menu') {
            return [
                {
                    id: 'add-item',
                    label: 'Add Menu Item',
                    icon: Plus,
                    onClick: () => onAction?.('add-item'),
                    variant: 'primary'
                },
                {
                    id: 'categories',
                    label: 'Manage Categories',
                    icon: LayoutGrid,
                    onClick: () => onAction?.('categories'),
                    variant: 'secondary'
                },
                {
                    id: 'bulk-update',
                    label: 'Bulk Update',
                    icon: UtensilsCrossed,
                    onClick: () => onAction?.('bulk-update'),
                    variant: 'ghost'
                }
            ]
        }

        // Admin - Waiters
        if (pathname === '/admin/waiters') {
            return [
                {
                    id: 'add-staff',
                    label: 'Add Staff',
                    icon: Plus,
                    onClick: () => onAction?.('add-staff'),
                    variant: 'primary'
                },
                {
                    id: 'view-attendance',
                    label: 'View Shifts',
                    icon: Clock,
                    href: '/admin/attendance',
                    variant: 'secondary'
                },
                {
                    id: 'performance',
                    label: 'Performance',
                    icon: TrendingUp,
                    onClick: () => onAction?.('performance'),
                    variant: 'ghost'
                }
            ]
        }

        // Admin - Tables
        if (pathname === '/admin/tables') {
            return [
                {
                    id: 'add-table',
                    label: 'Add Table',
                    icon: Plus,
                    onClick: () => onAction?.('add-table'),
                    variant: 'primary'
                },
                {
                    id: 'floor-plan',
                    label: 'Floor Plan',
                    icon: LayoutGrid,
                    onClick: () => onAction?.('floor-plan'),
                    variant: 'secondary'
                }
            ]
        }

        // Admin - Reports
        if (pathname === '/admin/reports') {
            return [
                {
                    id: 'export-report',
                    label: 'Export Report',
                    icon: FileSpreadsheet,
                    onClick: () => onAction?.('export-report'),
                    variant: 'primary'
                },
                {
                    id: 'today',
                    label: 'Today',
                    icon: Clock,
                    onClick: () => onAction?.('filter-today'),
                    variant: 'secondary'
                },
                {
                    id: 'week',
                    label: 'This Week',
                    icon: TrendingUp,
                    onClick: () => onAction?.('filter-week'),
                    variant: 'ghost'
                }
            ]
        }

        // Admin - Shifts
        if (pathname === '/admin/attendance') {
            return [
                {
                    id: 'clock-in',
                    label: 'Clock In',
                    icon: Clock,
                    onClick: () => onAction?.('clock-in'),
                    variant: 'primary'
                },
                {
                    id: 'view-staff',
                    label: 'View Staff',
                    icon: Users,
                    href: '/admin/waiters',
                    variant: 'secondary'
                }
            ]
        }

        return []
    }

    const actions = customActions || getActionsForPage()

    if (actions.length === 0) return null

    const handleClick = (action: Action) => {
        if (action.onClick) {
            action.onClick()
        } else if (action.href) {
            router.push(action.href)
        }
    }

    const getVariantStyles = (variant: Action['variant'] = 'secondary') => {
        const variants = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30',
            secondary: 'bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--bg)] hover:border-blue-600',
            success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/30',
            ghost: 'bg-transparent text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--bg)]'
        }
        return variants[variant]
    }

    return (
        <div className="sticky top-16 z-20 bg-[var(--bg)]/80 backdrop-blur-lg border-b border-[var(--border)] animate-in slide-in-from-top-2 duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {/* Quick Actions Label */}
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] whitespace-nowrap pr-3 border-r border-[var(--border)]">
                        <span className="hidden sm:inline">⚡</span>
                        <span className="hidden md:inline">Quick Actions</span>
                    </div>

                    {/* Action Buttons */}
                    {actions
                        .filter(action => !action.hidden)
                        .map(action => {
                            const Icon = action.icon
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleClick(action)}
                                    className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg 
                    text-sm font-medium whitespace-nowrap
                    transition-all duration-200 
                    hover:scale-105 active:scale-95
                    ${getVariantStyles(action.variant)}
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{action.label}</span>
                                    <span className="sm:hidden">{action.label.split(' ')[0]}</span>
                                </button>
                            )
                        })}
                </div>
            </div>
        </div>
    )
}